const { poolPromise, sql } = require('../config/db');

// Get Dashboard Analytics Data
const getDashboardStats = async (req, res) => {
  try {
    const pool = await poolPromise;

    // 1. Total revenue (from processed, shipped, or completed orders)
    const salesRes = await pool.request().query(`
      SELECT SUM(net_amount) as total_revenue, COUNT(id) as total_orders
      FROM dbo.orders 
      WHERE status IN ('Diproses', 'Dikirim', 'Selesai')
    `);
    const totalRevenue = salesRes.recordset[0].total_revenue || 0;
    const totalOrders = salesRes.recordset[0].total_orders || 0;

    // 2. Count of users and products
    const usersRes = await pool.request().query("SELECT COUNT(id) as total_users FROM dbo.users WHERE role = 'customer'");
    const productsRes = await pool.request().query("SELECT COUNT(id) as total_products FROM dbo.products");
    
    const totalCustomers = usersRes.recordset[0].total_users || 0;
    const totalProducts = productsRes.recordset[0].total_products || 0;

    // 3. Sales by category
    const categorySalesRes = await pool.request().query(`
      SELECT c.name as category_name, SUM(od.quantity * od.price) as revenue
      FROM dbo.order_details od
      JOIN dbo.products p ON od.product_id = p.id
      JOIN dbo.categories c ON p.category_id = c.id
      JOIN dbo.orders o ON od.order_id = o.id
      WHERE o.status IN ('Diproses', 'Dikirim', 'Selesai')
      GROUP BY c.name
    `);

    // 4. Recent transactions
    const recentOrdersRes = await pool.request().query(`
      SELECT TOP 5 o.*, u.name as customer_name 
      FROM dbo.orders o
      JOIN dbo.users u ON o.user_id = u.id
      ORDER BY o.order_date DESC
    `);

    res.json({
      metrics: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts
      },
      categorySales: categorySalesRes.recordset,
      recentOrders: recentOrdersRes.recordset
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat memuat analytics dashboard', error: error.message });
  }
};

// Get List of Users
const getUsersList = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT id, name, email, role, phone, address, created_at FROM dbo.users ORDER BY role, name');
    res.json(result.recordset);
  } catch (error) {
    console.error('Get users list error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil daftar pengguna', error: error.message });
  }
};

// Update User Role (make admin / customer)
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // 'admin' or 'customer'

  if (role !== 'admin' && role !== 'customer') {
    return res.status(400).json({ message: 'Role tidak valid' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('role', sql.VarChar, role)
      .query('UPDATE dbo.users SET role = @role WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json({ message: `Role user berhasil diubah menjadi ${role}` });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengubah role user', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getUsersList,
  updateUserRole
};
