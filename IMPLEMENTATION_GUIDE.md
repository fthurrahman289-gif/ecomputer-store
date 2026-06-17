# 🔧 IMPLEMENTATION GUIDE - Remaining Features

Guide lengkap untuk menyelesaikan fitur-fitur yang masih pending.

---

## 1️⃣ SEARCH BARS - ADMIN PANEL

### A. Update Backend Controllers

#### 1. Update `orderController.js` untuk Search & Filter

```javascript
// backend/src/controllers/orderController.js

const { query } = require('../config/db');

// Get all orders with search
const getOrders = async (req, res) => {
  const { search, status, userId, page = 1, limit = 10 } = req.query;

  try {
    let sqlQuery = `
      SELECT o.*, u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Admin can view all orders, customers can only see theirs
    if (req.user.role === 'customer') {
      sqlQuery += ` AND o.user_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    // Search by order ID or customer name
    if (search) {
      sqlQuery += ` AND (CAST(o.id AS VARCHAR) ILIKE $${paramCount} OR u.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Filter by status
    if (status) {
      sqlQuery += ` AND o.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Pagination
    const offset = (page - 1) * limit;
    sqlQuery += ` ORDER BY o.order_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1`;
    const countParams = [];
    let countParamNum = 1;

    if (req.user.role === 'customer') {
      countQuery += ` AND o.user_id = $${countParamNum}`;
      countParams.push(req.user.id);
      countParamNum++;
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit))
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

module.exports = { getOrders, /* ... other functions ... */ };
```

#### 2. Update `paymentController.js` untuk Search & Filter

```javascript
// backend/src/controllers/paymentController.js

const { query } = require('../config/db');

// Get all payments with search
const getPayments = async (req, res) => {
  const { search, status, page = 1, limit = 10 } = req.query;

  try {
    let sqlQuery = `
      SELECT p.*, o.id as order_id, u.name as customer_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Search by order ID or customer name
    if (search) {
      sqlQuery += ` AND (CAST(p.order_id AS VARCHAR) ILIKE $${paramCount} OR u.name ILIKE $${paramCount} OR CAST(p.id AS VARCHAR) ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Filter by status
    if (status) {
      sqlQuery += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Pagination
    const offset = (page - 1) * limit;
    sqlQuery += ` ORDER BY p.payment_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(sqlQuery, params);

    res.json({
      payments: result.rows,
      total: result.rows.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

module.exports = { getPayments, /* ... other functions ... */ };
```

### B. Update Frontend Components

#### 1. Update `AdminDashboard.jsx` untuk Search Bars

**Tambahkan state dan functions:**

```jsx
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { apiCall } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  
  // Product Search State
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productLoading, setProductLoading] = useState(false);

  // Order Search State
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  // Payment Search State
  const [payments, setPayments] = useState([]);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Fetch Products with Search
  const fetchProducts = async (searchQuery = '') => {
    setProductLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const data = await apiCall(`/api/products?${params}`);
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setProductLoading(false);
    }
  };

  // Fetch Orders with Search
  const fetchOrders = async (searchQuery = '', status = '') => {
    setOrderLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (status) params.append('status', status);
      const data = await apiCall(`/api/orders?${params}`);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrderLoading(false);
    }
  };

  // Fetch Payments with Search
  const fetchPayments = async (searchQuery = '', status = '') => {
    setPaymentLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (status) params.append('status', status);
      const data = await apiCall(`/api/payment?${params}`);
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'products') fetchProducts(productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'orders') fetchOrders(orderSearch, orderStatus);
    }, 300);
    return () => clearTimeout(timer);
  }, [orderSearch, orderStatus, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'payments') fetchPayments(paymentSearch, paymentStatus);
    }, 300);
    return () => clearTimeout(timer);
  }, [paymentSearch, paymentStatus, activeTab]);

  return (
    <div className="space-y-6">
      {/* TABS */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          📦 Kelola Produk
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          📋 Kelola Order
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          💳 Kelola Transaksi
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari produk (nama, brand, deskripsi)..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {productLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <div key={product.id} className="p-4 border rounded-lg hover:shadow-lg transition">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.brand}</p>
                  <p className="text-blue-600 font-bold">Rp {product.price.toLocaleString('id-ID')}</p>
                  <p className="text-sm">Stock: {product.stock}</p>
                  <div className="mt-2 flex gap-2">
                    <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Edit</button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari order ID atau nama customer..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Diproses">Diproses</option>
              <option value="Dikirim">Dikirim</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {orderLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Order ID</th>
                  <th className="border p-2 text-left">Customer</th>
                  <th className="border p-2 text-left">Total</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Tanggal</th>
                  <th className="border p-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="border p-2">#{order.id}</td>
                    <td className="border p-2">{order.customer_name}</td>
                    <td className="border p-2">Rp {order.net_amount.toLocaleString('id-ID')}</td>
                    <td className="border p-2">
                      <span className={`px-2 py-1 rounded text-sm font-semibold ${
                        order.status === 'Selesai' ? 'bg-green-100 text-green-800' :
                        order.status === 'Dibatalkan' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="border p-2">{new Date(order.order_date).toLocaleDateString('id-ID')}</td>
                    <td className="border p-2">
                      <button className="text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari payment ID atau order ID..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          {paymentLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Payment ID</th>
                  <th className="border p-2 text-left">Order ID</th>
                  <th className="border p-2 text-left">Amount</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Tanggal</th>
                  <th className="border p-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="border p-2">#{payment.id}</td>
                    <td className="border p-2">#{payment.order_id}</td>
                    <td className="border p-2">Rp {payment.amount.toLocaleString('id-ID')}</td>
                    <td className="border p-2">
                      <span className={`px-2 py-1 rounded text-sm font-semibold ${
                        payment.status === 'Disetujui' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Ditolak' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="border p-2">{new Date(payment.payment_date).toLocaleDateString('id-ID')}</td>
                    <td className="border p-2">
                      {payment.status === 'Menunggu Verifikasi' && (
                        <div className="flex gap-1">
                          <button className="text-green-600 hover:underline text-sm">Approve</button>
                          <button className="text-red-600 hover:underline text-sm">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
```

---

## 2️⃣ UNIFIED SETTINGS PAGE

### Create New Unified Settings Component

**File:** `frontend/src/pages/UnifiedSettings.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Settings, Phone, Mail, MapPin, Clock, CreditCard, QrCode, Wallet } from 'lucide-react';
import { apiCall } from '../services/api';

const UnifiedSettings = () => {
  const [activeTab, setActiveTab] = useState('contact');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Contact Settings State
  const [contactSettings, setContactSettings] = useState({
    cs_whatsapp: '',
    cs_email: '',
    store_address: '',
    store_hours: ''
  });

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    qris_image_path: '',
    ovo_number: '',
    gopay_number: '',
    whatsapp_number: ''
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiCall('/api/settings');
      if (data.contactSettings) {
        setContactSettings(data.contactSettings);
      }
      if (data.paymentSettings) {
        setPaymentSettings(data.paymentSettings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactSettings(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentSettings(prev => ({ ...prev, [name]: value }));
  };

  const saveContactSettings = async () => {
    setLoading(true);
    setMessage('');
    try {
      await apiCall('/api/settings/contact', {
        method: 'PUT',
        body: JSON.stringify(contactSettings)
      });
      setMessage('✓ Pengaturan kontak berhasil disimpan');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('✗ Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePaymentSettings = async () => {
    setLoading(true);
    setMessage('');
    try {
      await apiCall('/api/settings/payment', {
        method: 'PUT',
        body: JSON.stringify(paymentSettings)
      });
      setMessage('✓ Pengaturan pembayaran berhasil disimpan');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('✗ Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={32} className="text-blue-600" />
        <h1 className="text-3xl font-bold">Pengaturan Toko</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'contact'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Phone size={20} /> Informasi Kontak
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'payment'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <CreditCard size={20} /> Pengaturan Pembayaran
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.startsWith('✓')
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* TAB 1: Contact Information */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-lg p-6 space-y-6 shadow">
          <div>
            <label className="block text-sm font-semibold mb-2">
              <Phone size={16} className="inline mr-2" />
              WhatsApp Customer Service
            </label>
            <input
              type="text"
              name="cs_whatsapp"
              value={contactSettings.cs_whatsapp}
              onChange={handleContactChange}
              placeholder="Contoh: +62812345678"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              <Mail size={16} className="inline mr-2" />
              Email Customer Service
            </label>
            <input
              type="email"
              name="cs_email"
              value={contactSettings.cs_email}
              onChange={handleContactChange}
              placeholder="Contoh: cs@ecomputer.com"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              <MapPin size={16} className="inline mr-2" />
              Alamat Toko
            </label>
            <textarea
              name="store_address"
              value={contactSettings.store_address}
              onChange={handleContactChange}
              placeholder="Alamat lengkap toko Anda..."
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              <Clock size={16} className="inline mr-2" />
              Jam Operasional
            </label>
            <input
              type="text"
              name="store_hours"
              value={contactSettings.store_hours}
              onChange={handleContactChange}
              placeholder="Contoh: Senin-Jumat 09:00-18:00, Sabtu 09:00-17:00"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={saveContactSettings}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Menyimpan...' : 'Simpan Pengaturan Kontak'}
          </button>
        </div>
      )}

      {/* TAB 2: Payment Settings */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-lg p-6 space-y-8 shadow">
          
          {/* Bank Transfer Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">🏦 Transfer Bank</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nama Bank</label>
                <input
                  type="text"
                  name="bank_name"
                  value={paymentSettings.bank_name}
                  onChange={handlePaymentChange}
                  placeholder="Contoh: BCA, Mandiri, BRI"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Nomor Rekening</label>
                <input
                  type="text"
                  name="account_number"
                  value={paymentSettings.account_number}
                  onChange={handlePaymentChange}
                  placeholder="Contoh: 0123456789"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Atas Nama</label>
                <input
                  type="text"
                  name="account_holder_name"
                  value={paymentSettings.account_holder_name}
                  onChange={handlePaymentChange}
                  placeholder="Nama pemilik rekening"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* QRIS Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">📱 QRIS</h2>
            <div>
              <label className="block text-sm font-semibold mb-2">QRIS Image Path</label>
              <input
                type="text"
                name="qris_image_path"
                value={paymentSettings.qris_image_path}
                onChange={handlePaymentChange}
                placeholder="Contoh: /uploads/qris.png"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-2">Upload image QRIS terlebih dahulu</p>
            </div>
          </div>

          {/* E-Wallet Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-blue-600">💳 E-Wallet</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nomor OVO</label>
                <input
                  type="text"
                  name="ovo_number"
                  value={paymentSettings.ovo_number}
                  onChange={handlePaymentChange}
                  placeholder="Nomor terdaftar OVO"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Nomor GoPay</label>
                <input
                  type="text"
                  name="gopay_number"
                  value={paymentSettings.gopay_number}
                  onChange={handlePaymentChange}
                  placeholder="Nomor terdaftar GoPay"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">WhatsApp untuk Konfirmasi E-Wallet</label>
                <input
                  type="text"
                  name="whatsapp_number"
                  value={paymentSettings.whatsapp_number}
                  onChange={handlePaymentChange}
                  placeholder="Nomor WhatsApp untuk notifikasi"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={savePaymentSettings}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Menyimpan...' : 'Simpan Pengaturan Pembayaran'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UnifiedSettings;
```

### Update `App.jsx` Route

```jsx
import UnifiedSettings from './pages/UnifiedSettings';

// Add route:
<Route path="/admin/settings" element={<UnifiedSettings />} />
```

---

## 3️⃣ FIX REPORT BUGS

### Investigation Steps:

1. **Check Report Controller:**
```bash
# Review: backend/src/controllers/reportController.js
# Check: File path resolution
# Check: Database queries (update to PostgreSQL)
```

2. **Test Report Generation:**
```bash
# Test HTML report endpoint
curl http://localhost:5000/api/reports/html

# Test PDF report endpoint  
curl http://localhost:5000/api/reports/pdf
```

3. **Common Issues & Fixes:**

```javascript
// ISSUE: Access Denied / File not found
// FIX: Check file paths

const reportPath = path.join(__dirname, '../../uploads/reports');
// Make sure directory exists:
if (!fs.existsSync(reportPath)) {
  fs.mkdirSync(reportPath, { recursive: true });
}

// ISSUE: Database query errors
// FIX: Update queries to PostgreSQL

// OLD
SELECT * FROM dbo.orders WHERE status = @status

// NEW
SELECT * FROM orders WHERE status = $1
```

---

## 🚀 IMPLEMENTATION ORDER

1. **Backend Updates (1-2 hours)**
   - [ ] Update orderController.js
   - [ ] Update paymentController.js
   - [ ] Fix reportController.js
   - [ ] Update adminSettingsController.js

2. **Frontend Updates (1-2 hours)**
   - [ ] Update AdminDashboard.jsx dengan search tabs
   - [ ] Create UnifiedSettings.jsx
   - [ ] Update App.jsx routes

3. **Testing (1 hour)**
   - [ ] Test all search functionalities
   - [ ] Test settings save
   - [ ] Test report generation

4. **Final Deployment (30 mins)**
   - [ ] Push ke GitHub
   - [ ] Deploy ke Vercel (frontend)
   - [ ] Deploy ke Supabase (backend)

**Total Time:** ~4-5 hours untuk complete semua features

---

**Next:** Hubungi kalau perlu help dengan implementation! 🚀
