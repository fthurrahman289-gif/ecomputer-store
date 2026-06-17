const { poolPromise, sql } = require('../config/db');

// Helper function to auto-cancel expired unpaid orders
const autoCancelOrders = async (pool) => {
  try {
    // Select unpaid orders that are past their expiration date and cancel them
    // Then restock products associated with the canceled orders
    const expiredOrders = await pool.request().query(`
      SELECT id FROM dbo.orders 
      WHERE status = 'Menunggu Pembayaran' AND expired_at < GETDATE()
    `);

    for (const order of expiredOrders.recordset) {
      // Start transaction for each cancellation to restock products cleanly
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        // Restock products
        const items = await transaction.request()
          .input('orderId', sql.Int, order.id)
          .query('SELECT product_id, quantity FROM dbo.order_details WHERE order_id = @orderId');

        for (const item of items.recordset) {
          await transaction.request()
            .input('pid', sql.Int, item.product_id)
            .input('qty', sql.Int, item.quantity)
            .query('UPDATE dbo.products SET stock = stock + @qty WHERE id = @pid');
        }

        // Update status to Dibatalkan
        await transaction.request()
          .input('orderId', sql.Int, order.id)
          .query("UPDATE dbo.orders SET status = 'Dibatalkan' WHERE id = @orderId");

        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        console.error(`Failed to auto-cancel order ${order.id}:`, err);
      }
    }
  } catch (error) {
    console.error('Auto-cancel orders process failed:', error);
  }
};

// Checkout & Create Order (Transaction Safe)
const checkout = async (req, res) => {
  const { items, voucherCode, address, phone, paymentMethod, shippingMethod, customerName } = req.body;

  if (!items || items.length === 0 || !address || !phone || !paymentMethod) {
    return res.status(400).json({ message: 'Item keranjang, alamat, no telepon, dan metode pembayaran wajib diisi' });
  }

  const isAdmin = req.user && req.user.role === 'admin';
  let userId = req.user.id;

  const allowedShippingMethods = ['Pengiriman', 'Ambil di Toko'];
  if (isAdmin) {
    allowedShippingMethods.push('Pembelian di Toko');
  }
  const finalShippingMethod = allowedShippingMethods.includes(shippingMethod) ? shippingMethod : 'Pengiriman';

  const allowedPaymentMethods = ['Transfer Bank', 'E-Wallet', 'QRIS'];
  if (isAdmin && finalShippingMethod === 'Pembelian di Toko') {
    allowedPaymentMethods.push('Tunai');
  }
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ message: 'Metode pembayaran tidak valid' });
  }

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      if (isAdmin && shippingMethod === 'Pembelian di Toko' && customerName) {
        const dummyEmail = `offline_${Date.now()}@ecomputer.com`;
        const userRes = await transaction.request()
          .input('name', sql.NVarChar, customerName)
          .input('email', sql.VarChar, dummyEmail)
          .input('password', sql.VarChar, 'offline')
          .input('phone', sql.VarChar, phone)
          .input('address', sql.NVarChar, 'Pembelian di Toko')
          .query(`
            INSERT INTO dbo.users (name, email, password, phone, address, role)
            OUTPUT INSERTED.id
            VALUES (@name, @email, @password, @phone, @address, 'customer')
          `);
        userId = userRes.recordset[0].id;
      }

      let totalAmount = 0;
      const orderItems = [];

      // Validate stock & calculate price
      for (const item of items) {
        const prodRes = await transaction.request()
          .input('pid', sql.Int, item.productId)
          .query('SELECT * FROM dbo.products WHERE id = @pid');

        if (prodRes.recordset.length === 0) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
        }

        const product = prodRes.recordset[0];
        if (product.stock < item.quantity) {
          throw new Error(`Stok produk "${product.name}" tidak mencukupi (Tersedia: ${product.stock}, Diminta: ${item.quantity})`);
        }

        // Calculate item price after product discount
        const activePrice = product.price * (1 - (product.discount_percent / 100));
        const itemSubtotal = activePrice * item.quantity;
        totalAmount += itemSubtotal;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: activePrice,
          newStock: product.stock - item.quantity
        });
      }

      // Apply Voucher (Only valid for online customer checkouts, not offline store purchases)
      let discountAmount = 0;
      const isStorePurchase = finalShippingMethod === 'Pembelian di Toko';
      if (voucherCode && !isStorePurchase) {
        const vRes = await transaction.request()
          .input('code', sql.VarChar, voucherCode)
          .query(`
            SELECT * FROM dbo.vouchers 
            WHERE code = @code AND is_active = 1 AND GETDATE() BETWEEN start_date AND end_date
          `);

        if (vRes.recordset.length > 0) {
          const voucher = vRes.recordset[0];
          if (totalAmount >= parseFloat(voucher.min_purchase)) {
            if (voucher.discount_percent > 0) {
              discountAmount = totalAmount * (voucher.discount_percent / 100);
            } else {
              discountAmount = parseFloat(voucher.discount_amount);
            }
            if (discountAmount > totalAmount) discountAmount = totalAmount;
          }
        }
      }

      const netAmount = totalAmount - discountAmount;
      if (netAmount >= 40000000 && paymentMethod === 'E-Wallet') {
        throw new Error('Metode pembayaran E-Wallet tidak didukung untuk transaksi senilai Rp 40.000.000 atau lebih. Silakan gunakan Transfer Bank.');
      }

      const orderDate = new Date();
      // Set expiration to 2 hours from now for response metadata
      const expiredAt = new Date(orderDate.getTime() + (2 * 60 * 60 * 1000));
      const initialStatus = isStorePurchase ? 'Selesai' : 'Menunggu Pembayaran';

      // Insert Order using GETDATE() and DATEADD(hour, 2, GETDATE()) to avoid Node/SQL Server timezone mismatches
      const insertOrderRes = await transaction.request()
        .input('userId', sql.Int, userId)
        .input('totalAmount', sql.Decimal, totalAmount)
        .input('discountAmount', sql.Decimal, discountAmount)
        .input('netAmount', sql.Decimal, netAmount)
        .input('voucherCode', sql.VarChar, voucherCode || null)
        .input('address', sql.NVarChar, address)
        .input('phone', sql.VarChar, phone)
        .input('paymentMethod', sql.VarChar, paymentMethod)
        .input('shippingMethod', sql.VarChar, finalShippingMethod)
        .input('status', sql.VarChar, initialStatus)
        .query(`
          INSERT INTO dbo.orders 
          (user_id, order_date, total_amount, discount_amount, net_amount, voucher_code, address, phone, payment_method, expired_at, status, shipping_method)
          OUTPUT INSERTED.id
          VALUES 
          (@userId, GETDATE(), @totalAmount, @discountAmount, @netAmount, @voucherCode, @address, @phone, @paymentMethod, 
           ${isStorePurchase ? 'GETDATE()' : 'DATEADD(hour, 2, GETDATE())'}, 
           @status, @shippingMethod)
        `);

      const orderId = insertOrderRes.recordset[0].id;

      // Insert Order Details & Update Product Stock
      for (const item of orderItems) {
        await transaction.request()
          .input('orderId', sql.Int, orderId)
          .input('productId', sql.Int, item.productId)
          .input('quantity', sql.Int, item.quantity)
          .input('price', sql.Decimal, item.price)
          .query(`
            INSERT INTO dbo.order_details (order_id, product_id, quantity, price)
            VALUES (@orderId, @productId, @quantity, @price)
          `);

        await transaction.request()
          .input('productId', sql.Int, item.productId)
          .input('newStock', sql.Int, item.newStock)
          .query('UPDATE dbo.products SET stock = @newStock WHERE id = @productId');
      }

      await transaction.commit();
      res.status(201).json({
        message: isStorePurchase ? 'Order pembelian di toko berhasil dicatat' : 'Order berhasil dibuat',
        orderId,
        netAmount,
        expiredAt,
        paymentDetails: {
          bankAccounts: [
            { bankName: 'BCA (Transfer Bank)', accountNumber: '8027491290', holderName: 'PT E-Computer Indonesia' },
            { bankName: 'Mandiri (Transfer Bank)', accountNumber: '1320098765432', holderName: 'PT E-Computer Indonesia' },
            { bankName: 'E-Wallet (Gopay/OVO)', accountNumber: '081234567890', holderName: 'E-COMPUTER PAY' }
          ]
        }
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan saat memproses checkout' });
  }
};

// Get User Orders History
const getMyOrders = async (req, res) => {
  try {
    const pool = await poolPromise;
    // Auto-cancel expired first
    await autoCancelOrders(pool);

    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query('SELECT * FROM dbo.orders WHERE user_id = @userId ORDER BY order_date DESC');

    res.json(result.recordset);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil data order', error: error.message });
  }
};

// Get Single Order Details (with Items and Payment proof status)
const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    // Auto-cancel check
    await autoCancelOrders(pool);

    // Get order details
    const orderRes = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT o.*, u.name as customer_name, u.email as customer_email 
        FROM dbo.orders o
        JOIN dbo.users u ON o.user_id = u.id
        WHERE o.id = @id
      `);

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    const order = orderRes.recordset[0];

    // Enforce authorization: only owner or admin can view
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    // Get products in order
    const itemsRes = await pool.request()
      .input('orderId', sql.Int, id)
      .query(`
        SELECT od.*, p.name, p.image_urls, p.brand
        FROM dbo.order_details od
        JOIN dbo.products p ON od.product_id = p.id
        WHERE od.order_id = @orderId
      `);

    const items = itemsRes.recordset.map(item => {
      try {
        item.image_urls = JSON.parse(item.image_urls);
      } catch (e) {
        item.image_urls = [item.image_urls];
      }
      return item;
    });

    // Get payment proof if exists
    const paymentRes = await pool.request()
      .input('orderId', sql.Int, id)
      .query('SELECT * FROM dbo.payments WHERE order_id = @orderId');

    res.json({
      order,
      items,
      payment: paymentRes.recordset.length > 0 ? paymentRes.recordset[0] : null
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil detail order', error: error.message });
  }
};

// Upload Payment Proof (receipt image)
const uploadPaymentProof = async (req, res) => {
  const { orderId } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'Bukti pembayaran (file gambar) wajib diunggah' });
  }

  if (!orderId) {
    return res.status(400).json({ message: 'Order ID wajib diisi' });
  }

  try {
    const pool = await poolPromise;

    // Check order existence and status
    const orderRes = await pool.request()
      .input('orderId', sql.Int, orderId)
      .query('SELECT * FROM dbo.orders WHERE id = @orderId');

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    const order = orderRes.recordset[0];
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    if (order.status !== 'Menunggu Pembayaran') {
      return res.status(400).json({ message: `Bukti pembayaran tidak dapat diunggah untuk order dengan status ${order.status}` });
    }

    const relativePath = `/uploads/${req.file.filename}`;

    // Use transaction to ensure both payment insert and order status update occur
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Clear previous verification attempts if any
      await transaction.request()
        .input('orderId', sql.Int, orderId)
        .query('DELETE FROM dbo.payments WHERE order_id = @orderId');

      // Insert payment record
      await transaction.request()
        .input('orderId', sql.Int, orderId)
        .input('amount', sql.Decimal, order.net_amount)
        .input('proofImage', sql.NVarChar, relativePath)
        .query(`
          INSERT INTO dbo.payments (order_id, amount, proof_image, status)
          VALUES (@orderId, @amount, @proofImage, 'Menunggu Verifikasi')
        `);

      // Update Order Status
      await transaction.request()
        .input('orderId', sql.Int, orderId)
        .query("UPDATE dbo.orders SET status = 'Menunggu Verifikasi' WHERE id = @orderId");

      await transaction.commit();
      res.json({ message: 'Bukti pembayaran berhasil diunggah, menunggu verifikasi Admin' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Upload proof error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengunggah bukti pembayaran', error: error.message });
  }
};

// Admin: Get all orders
const adminGetOrders = async (req, res) => {
  try {
    const pool = await poolPromise;
    await autoCancelOrders(pool);

    const result = await pool.request().query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email 
      FROM dbo.orders o
      JOIN dbo.users u ON o.user_id = u.id
      ORDER BY o.order_date DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil data order', error: error.message });
  }
};

// Admin: Update order status manually
const adminUpdateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'

  const allowedStatuses = ['Menunggu Pembayaran', 'Menunggu Verifikasi', 'Diproses', 'Dikirim', 'Menunggu di Ambil', 'Sudah di Ambil', 'Selesai', 'Dibatalkan'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar, status)
      .query('UPDATE dbo.orders SET status = @status WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    res.json({ message: `Status order berhasil diperbarui menjadi ${status}` });
  } catch (error) {
    console.error('Admin update status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat memperbarui status order', error: error.message });
  }
};

// Admin: Verify payment proof
const adminVerifyPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { approvalStatus } = req.body; // 'Disetujui' or 'Ditolak'

  if (approvalStatus !== 'Disetujui' && approvalStatus !== 'Ditolak') {
    return res.status(400).json({ message: 'Status verifikasi harus "Disetujui" atau "Ditolak"' });
  }

  try {
    const pool = await poolPromise;

    // Get payment proof details and order shipping method
    const payRes = await pool.request()
      .input('paymentId', sql.Int, paymentId)
      .query(`
        SELECT p.*, o.shipping_method 
        FROM dbo.payments p
        JOIN dbo.orders o ON p.order_id = o.id
        WHERE p.id = @paymentId
      `);

    if (payRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Bukti pembayaran tidak ditemukan' });
    }

    const payment = payRes.recordset[0];
    let newOrderStatus = 'Menunggu Pembayaran';
    if (approvalStatus === 'Disetujui') {
      newOrderStatus = payment.shipping_method === 'Ambil di Toko' ? 'Menunggu di Ambil' : 'Diproses';
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Update payment record
      await transaction.request()
        .input('payId', sql.Int, paymentId)
        .input('status', sql.VarChar, approvalStatus)
        .input('adminId', sql.Int, req.user.id)
        .query(`
          UPDATE dbo.payments 
          SET status = @status, verified_at = GETDATE(), verified_by = @adminId
          WHERE id = @payId
        `);

      // Update Order Status
      await transaction.request()
        .input('orderId', sql.Int, payment.order_id)
        .input('status', sql.VarChar, newOrderStatus)
        .query('UPDATE dbo.orders SET status = @status WHERE id = @orderId');

      await transaction.commit();
      res.json({ message: `Pembayaran berhasil diverifikasi dengan status: ${approvalStatus}. Status order kini: ${newOrderStatus}` });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat memproses verifikasi pembayaran', error: error.message });
  }
};

// Admin: Create in-store purchase order directly (POS Style)
const adminCreateOrder = async (req, res) => {
  const { userId, items, paymentMethod, phone, address } = req.body;

  if (!userId || !items || items.length === 0 || !phone || !paymentMethod) {
    return res.status(400).json({ message: 'User ID, item, no telepon, dan metode pembayaran wajib diisi' });
  }

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      let totalAmount = 0;
      const orderItems = [];

      // Validate stock & calculate price
      for (const item of items) {
        const prodRes = await transaction.request()
          .input('pid', sql.Int, item.productId)
          .query('SELECT * FROM dbo.products WHERE id = @pid');

        if (prodRes.recordset.length === 0) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
        }

        const product = prodRes.recordset[0];
        if (product.stock < item.quantity) {
          throw new Error(`Stok produk "${product.name}" tidak mencukupi (Tersedia: ${product.stock}, Diminta: ${item.quantity})`);
        }

        const activePrice = product.price * (1 - (product.discount_percent / 100));
        const itemSubtotal = activePrice * item.quantity;
        totalAmount += itemSubtotal;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: activePrice,
          newStock: product.stock - item.quantity
        });
      }

      const netAmount = totalAmount;

      // Insert Order directly with 'Selesai' status and 'Pembelian di Toko' shipping method
      const insertOrderRes = await transaction.request()
        .input('userId', sql.Int, userId)
        .input('totalAmount', sql.Decimal, totalAmount)
        .input('discountAmount', sql.Decimal, 0)
        .input('netAmount', sql.Decimal, netAmount)
        .input('address', sql.NVarChar, address || 'Pembelian di Toko')
        .input('phone', sql.VarChar, phone)
        .input('paymentMethod', sql.VarChar, paymentMethod)
        .query(`
          INSERT INTO dbo.orders 
          (user_id, order_date, total_amount, discount_amount, net_amount, voucher_code, address, phone, payment_method, expired_at, status, shipping_method)
          OUTPUT INSERTED.id
          VALUES 
          (@userId, GETDATE(), @totalAmount, @discountAmount, @netAmount, NULL, @address, @phone, @paymentMethod, GETDATE(), 'Selesai', 'Pembelian di Toko')
        `);

      const orderId = insertOrderRes.recordset[0].id;

      // Insert Order Details & Update Product Stock
      for (const item of orderItems) {
        await transaction.request()
          .input('orderId', sql.Int, orderId)
          .input('productId', sql.Int, item.productId)
          .input('quantity', sql.Int, item.quantity)
          .input('price', sql.Decimal, item.price)
          .query(`
            INSERT INTO dbo.order_details (order_id, product_id, quantity, price)
            VALUES (@orderId, @productId, @quantity, @price)
          `);

        await transaction.request()
          .input('productId', sql.Int, item.productId)
          .input('newStock', sql.Int, item.newStock)
          .query('UPDATE dbo.products SET stock = @newStock WHERE id = @productId');
      }

      await transaction.commit();
      res.status(201).json({
        message: 'Order pembelian di toko berhasil dibuat',
        orderId,
        netAmount
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Admin create order error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses pembelian di toko', error: error.message });
  }
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderById,
  uploadPaymentProof,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminVerifyPayment,
  adminCreateOrder
};

