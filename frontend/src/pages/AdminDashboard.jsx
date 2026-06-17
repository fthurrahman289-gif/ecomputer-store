import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../services/api';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Ticket, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  DollarSign,
  AlertCircle,
  Upload,
  Image,
  Loader2,
  Printer,
  Settings
} from 'lucide-react';
import ProductImageUploader from '../components/ProductImageUploader';
import AdminReports from './AdminReports';

const AdminDashboard = () => {
  const { user, token } = useContext(AppContext);
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('stats');

  // Block non-admins
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Analytics states
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Products states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProds, setLoadingProds] = useState(false);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [selectedProd, setSelectedProd] = useState(null);
  const [prodForm, setProdForm] = useState({
    category_id: '', name: '', brand: '', price: '', stock: '', description: '',
    images: [], spec_ram: '', spec_storage: '',
    spec_cpu: '', spec_gpu: '', weight: '', is_best_seller: false, is_new: true, discount_percent: '0'
  });

  // Orders states
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Vouchers states
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [voucherForm, setVoucherForm] = useState({
    code: '', discount_amount: '0', discount_percent: '0', min_purchase: '0',
    start_date: '', end_date: '', is_active: true
  });

  // Users states
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // General Notification
  const [alertMsg, setAlertMsg] = useState('');

  // ----------------------------------------------------
  // DATA LOADERS
  // ----------------------------------------------------
  const loadDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const data = await apiCall('/api/admin/dashboard');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadAllProducts = async () => {
    setLoadingProds(true);
    try {
      const data = await apiCall('/api/products');
      setProducts(data);
      const cats = await apiCall('/api/products/categories');
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProds(false);
    }
  };

  const loadAllOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await apiCall('/api/orders/admin/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadAllVouchers = async () => {
    setLoadingVouchers(true);
    try {
      const data = await apiCall('/api/vouchers');
      setVouchers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiCall('/api/admin/users');
      setUsersList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      if (activeTab === 'stats') loadDashboardStats();
      if (activeTab === 'products') loadAllProducts();
      if (activeTab === 'orders') loadAllOrders();
      if (activeTab === 'vouchers') loadAllVouchers();
      if (activeTab === 'users') loadAllUsers();
    }
  }, [activeTab, user]);

  const triggerAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  // ----------------------------------------------------
  // PRODUCT OPERATIONS
  // ----------------------------------------------------
  const handleOpenAddProd = () => {
    setSelectedProd(null);
    setProdForm({
      category_id: categories.length > 0 ? categories[0].id : '',
      name: '', brand: '', price: '', stock: '', description: '',
      images: [], spec_ram: '', spec_storage: '',
      spec_cpu: '', spec_gpu: '', weight: '', is_best_seller: false, is_new: true, discount_percent: '0'
    });
    setIsProdModalOpen(true);
  };

  const handleOpenEditProd = (prod) => {
    setSelectedProd(prod);
    setProdForm({
      category_id: prod.category_id,
      name: prod.name,
      brand: prod.brand,
      price: prod.price,
      stock: prod.stock,
      description: prod.description || '',
      images: Array.isArray(prod.image_urls) ? prod.image_urls : (typeof prod.image_urls === 'string' ? JSON.parse(prod.image_urls) : []),
      spec_ram: prod.spec_ram || '',
      spec_storage: prod.spec_storage || '',
      spec_cpu: prod.spec_cpu || '',
      spec_gpu: prod.spec_gpu || '',
      weight: prod.weight || '',
      is_best_seller: prod.is_best_seller,
      is_new: prod.is_new,
      discount_percent: prod.discount_percent
    });
    setIsProdModalOpen(true);
  };

  const handleSaveProd = async (e) => {
    e.preventDefault();
    try {
      if (prodForm.images.length === 0) {
        alert('Minimal satu gambar produk harus diunggah');
        return;
      }

      const payload = {
        ...prodForm,
        image_urls: prodForm.images  // Send as array
      };

      if (selectedProd) {
        // Edit Mode
        const data = await apiCall(`/api/products/${selectedProd.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        triggerAlert(data.message);
      } else {
        // Add Mode
        const data = await apiCall('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        triggerAlert(data.message);
      }
      setIsProdModalOpen(false);
      loadAllProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProd = async (prodId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      const data = await apiCall(`/api/products/${prodId}`, {
        method: 'DELETE'
      });
      triggerAlert(data.message);
      loadAllProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // ----------------------------------------------------
  // ORDER & PAYMENT OPERATIONS
  // ----------------------------------------------------
  const handleOpenVerify = async (orderId) => {
    try {
      const detail = await apiCall(`/api/orders/${orderId}`);
      setSelectedOrder(detail);
      setIsVerifyModalOpen(true);
    } catch (err) {
      alert('Gagal mengambil detail pembayaran');
    }
  };

  const handleVerifyPayment = async (paymentId, status) => {
    try {
      const data = await apiCall(`/api/orders/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ approvalStatus: status }) // 'Disetujui' / 'Ditolak'
      });
      triggerAlert(data.message);
      setIsVerifyModalOpen(false);
      loadAllOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const data = await apiCall(`/api/orders/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      triggerAlert(data.message);
      loadAllOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  // ----------------------------------------------------
  // VOUCHER OPERATIONS
  // ----------------------------------------------------
  const handleOpenAddVoucher = () => {
    setSelectedVoucher(null);
    setVoucherForm({
      code: '', discount_amount: '0', discount_percent: '0', min_purchase: '0',
      start_date: '', end_date: '', is_active: true
    });
    setIsVoucherModalOpen(true);
  };

  const handleOpenEditVoucher = (v) => {
    setSelectedVoucher(v);
    setVoucherForm({
      code: v.code,
      discount_amount: v.discount_amount,
      discount_percent: v.discount_percent,
      min_purchase: v.min_purchase,
      start_date: new Date(v.start_date).toISOString().slice(0, 16),
      end_date: new Date(v.end_date).toISOString().slice(0, 16),
      is_active: v.is_active
    });
    setIsVoucherModalOpen(true);
  };

  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    try {
      if (selectedVoucher) {
        const data = await apiCall(`/api/vouchers/${selectedVoucher.id}`, {
          method: 'PUT',
          body: JSON.stringify(voucherForm)
        });
        triggerAlert(data.message);
      } else {
        const data = await apiCall('/api/vouchers', {
          method: 'POST',
          body: JSON.stringify(voucherForm)
        });
        triggerAlert(data.message);
      }
      setIsVoucherModalOpen(false);
      loadAllVouchers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (!window.confirm('Yakin ingin menghapus voucher ini?')) return;
    try {
      const data = await apiCall(`/api/vouchers/${id}`, {
        method: 'DELETE'
      });
      triggerAlert(data.message);
      loadAllVouchers();
    } catch (err) {
      alert(err.message);
    }
  };

  // ----------------------------------------------------
  // USER OPERATIONS
  // ----------------------------------------------------
  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    if (!window.confirm(`Yakin ingin mengubah role user ini menjadi ${newRole}?`)) return;

    try {
      const data = await apiCall(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      triggerAlert(data.message);
      loadAllUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
      
      {/* SIDEBAR NAVIGATION */}
      <aside class="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div class="p-6 border-b border-slate-800 text-center">
          <span class="text-3xl block">🛠️</span>
          <span class="text-white font-extrabold text-lg mt-2 block tracking-tight">Admin Console</span>
        </div>

        <nav class="flex-grow p-4 space-y-1.5 font-bold text-xs uppercase tracking-wider">
          {[
            { id: 'stats', label: 'Dashboard Stats', icon: <LayoutDashboard size={18} /> },
            { id: 'products', label: 'Kelola Produk', icon: <Package size={18} /> },
            { id: 'orders', label: 'Kelola Order', icon: <ShoppingBag size={18} /> },
            { id: 'vouchers', label: 'Kelola Voucher', icon: <Ticket size={18} /> },
            { id: 'users', label: 'Kelola User', icon: <Users size={18} /> },
            { id: 'reports', label: 'Laporan Penjualan', icon: <Printer size={18} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              class={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all focus:outline-none ${activeTab === tab.id ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="flex-grow p-6 sm:p-10 space-y-8 overflow-x-auto">
        
        {/* Banner Alert Notification */}
        {alertMsg && (
          <div className="fixed top-20 right-6 bg-slate-900 border-l-4 border-emerald-500 text-white font-bold p-4 rounded shadow-2xl z-50 flex items-center space-x-2 animate-fade-in text-xs">
            <Check size={16} className="text-emerald-500 shrink-0" />
            <span>{alertMsg}</span>
          </div>
        )}

        {/* ========================================================
            SUBVIEW: STATS & ANALYTICS
            ======================================================== */}
        {activeTab === 'stats' && (
          <div class="space-y-8 animate-fade-in">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard & Analytics</h1>
            
            {loadingStats ? (
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(n => <div key={n} class="bg-white rounded-2xl h-28 border" />)}
              </div>
            ) : stats && (
              <div class="space-y-8">
                {/* 4 Cards metrics */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Revenue Card */}
                  <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4">
                    <div class="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Total Omset</span>
                      <span class="text-slate-800 font-extrabold text-lg block mt-0.5">Rp {stats.metrics.totalRevenue.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Orders Card */}
                  <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4">
                    <div class="p-3.5 bg-indigo-100 text-indigo-700 rounded-2xl">
                      <ShoppingBag size={24} />
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Pesanan Sukses</span>
                      <span class="text-slate-800 font-extrabold text-lg block mt-0.5">{stats.metrics.totalOrders} Transaksi</span>
                    </div>
                  </div>

                  {/* Customers Card */}
                  <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4">
                    <div class="p-3.5 bg-blue-100 text-blue-700 rounded-2xl">
                      <Users size={24} />
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Pelanggan</span>
                      <span class="text-slate-800 font-extrabold text-lg block mt-0.5">{stats.metrics.totalCustomers} Akun</span>
                    </div>
                  </div>

                  {/* Products Card */}
                  <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4">
                    <div class="p-3.5 bg-purple-100 text-purple-700 rounded-2xl">
                      <Package size={24} />
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Varian Produk</span>
                      <span class="text-slate-800 font-extrabold text-lg block mt-0.5">{stats.metrics.totalProducts} Item</span>
                    </div>
                  </div>

                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Category Breakdown sales */}
                  <div class="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                    <h3 class="font-extrabold text-slate-800 text-sm">Penjualan Berdasarkan Kategori</h3>
                    <div class="space-y-4">
                      {stats.categorySales.map((cat, i) => (
                        <div key={i} class="space-y-1.5">
                          <div class="flex justify-between text-xs font-semibold">
                            <span class="text-slate-700">{cat.category_name}</span>
                            <span class="text-slate-800">Rp {cat.revenue.toLocaleString('id-ID')}</span>
                          </div>
                          {/* CSS Progress Bar */}
                          <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div class="bg-brand-500 h-full rounded-full" style={{ width: `${Math.min(100, (cat.revenue / (stats.metrics.totalRevenue || 1)) * 100)}%` }}></div>
                          </div>
                        </div>
                      ))}
                      {stats.categorySales.length === 0 && <div class="text-slate-400 text-xs italic text-center py-10">Belum ada data penjualan kategori.</div>}
                    </div>
                  </div>

                  {/* Recent sales logs */}
                  <div class="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                    <h3 class="font-extrabold text-slate-800 text-sm">Aktivitas Transaksi Terbaru</h3>
                    <div class="divide-y divide-slate-100">
                      {stats.recentOrders.map((ord, i) => (
                        <div key={i} class="py-3 flex items-center justify-between text-xs">
                          <div>
                            <span class="font-bold text-slate-800 block">{ord.customer_name}</span>
                            <span class="text-[10px] text-slate-400 font-mono">Invoice: #{ord.id}</span>
                          </div>
                          <div class="text-right">
                            <span class="font-extrabold text-brand-600 block">Rp {parseFloat(ord.net_amount).toLocaleString('id-ID')}</span>
                            <span class="text-[9px] uppercase font-bold text-slate-400">{ord.status}</span>
                          </div>
                        </div>
                      ))}
                      {stats.recentOrders.length === 0 && <div class="text-slate-400 text-xs italic text-center py-10">Belum ada transaksi pembelian.</div>}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SUBVIEW: PRODUCT INVENTORY CRUD
            ======================================================== */}
        {activeTab === 'products' && (
          <div class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Stok & Produk</h1>
                <p class="text-slate-500 text-xs mt-0.5">Kelola data item komputer, laptop, aksesoris, dan komponen</p>
              </div>
              <button 
                onClick={handleOpenAddProd}
                class="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow"
              >
                <Plus size={16} />
                <span>Tambah Produk</span>
              </button>
            </div>

            {loadingProds ? (
              <div class="bg-white border rounded-3xl p-12 text-center h-80 animate-pulse" />
            ) : (
              <div class="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100">
                      <th class="p-4 font-bold text-slate-400">ID</th>
                      <th class="p-4 font-bold text-slate-400">Nama Produk</th>
                      <th class="p-4 font-bold text-slate-400">Brand</th>
                      <th class="p-4 font-bold text-slate-400">Kategori</th>
                      <th class="p-4 font-bold text-slate-400">Harga</th>
                      <th class="p-4 font-bold text-slate-400">Stok</th>
                      <th class="p-4 font-bold text-slate-400">Promo</th>
                      <th class="p-4 font-bold text-slate-400 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.id} class="hover:bg-slate-50/50">
                        <td class="p-4 font-mono font-bold text-slate-400">#{p.id}</td>
                        <td class="p-4 font-bold text-slate-800 max-w-[200px] truncate" title={p.name}>{p.name}</td>
                        <td class="p-4 text-slate-600">{p.brand}</td>
                        <td class="p-4 text-slate-500 font-semibold">{p.category_name}</td>
                        <td class="p-4 font-extrabold text-brand-600">Rp {p.price.toLocaleString('id-ID')}</td>
                        <td class="p-4 font-bold text-slate-800">{p.stock} pcs</td>
                        <td class="p-4 space-x-1">
                          {p.discount_percent > 0 && <span class="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold text-[9px]">Disc {p.discount_percent}%</span>}
                          {p.is_best_seller && <span class="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold text-[9px]">Best</span>}
                        </td>
                        <td class="p-4">
                          <div class="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => handleOpenEditProd(p)}
                              class="p-1.5 border border-slate-200 text-slate-500 hover:text-brand-600 rounded bg-white hover:bg-slate-50"
                              title="Edit Produk"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProd(p.id)}
                              class="p-1.5 border border-slate-200 text-slate-500 hover:text-rose-600 rounded bg-white hover:bg-slate-50"
                              title="Hapus Produk"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SUBVIEW: ORDERS MANAGEMENT & VERIFY PAYMENTS
            ======================================================== */}
        {activeTab === 'orders' && (
          <div class="space-y-6 animate-fade-in">
            <div>
              <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Transaksi Order</h1>
              <p class="text-slate-500 text-xs mt-0.5">Konfirmasi transfer bank dan pantau status pemesanan pelanggan</p>
            </div>

            {loadingOrders ? (
              <div class="bg-white border rounded-3xl p-12 text-center h-80 animate-pulse" />
            ) : (
              <div class="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100">
                      <th class="p-4 font-bold text-slate-400">Order ID</th>
                      <th class="p-4 font-bold text-slate-400">Nama Pelanggan</th>
                      <th class="p-4 font-bold text-slate-400">Tanggal</th>
                      <th class="p-4 font-bold text-slate-400">Jumlah Tagihan</th>
                      <th class="p-4 font-bold text-slate-400">Metode</th>
                      <th class="p-4 font-bold text-slate-400">Status</th>
                      <th class="p-4 font-bold text-slate-400 text-center">Verifikasi Bukti</th>
                      <th class="p-4 font-bold text-slate-400 text-center">Ubah Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {orders.map((ord) => (
                      <tr key={ord.id} class="hover:bg-slate-50/50">
                        <td class="p-4 font-mono font-bold text-slate-500">#{ord.id}</td>
                        <td class="p-4 font-semibold text-slate-800">{ord.customer_name}</td>
                        <td class="p-4 text-slate-500">{new Date(ord.order_date).toLocaleDateString('id-ID')}</td>
                        <td class="p-4 font-extrabold text-slate-850">Rp {parseFloat(ord.net_amount).toLocaleString('id-ID')}</td>
                        <td class="p-4 text-slate-600">{ord.payment_method}</td>
                        <td class="p-4">
                          <span class="bg-slate-100 text-slate-800 border px-2 py-0.5 rounded font-bold text-[9px] uppercase">
                            {ord.status}
                          </span>
                        </td>
                        <td class="p-4 text-center">
                          {ord.status === 'Menunggu Verifikasi' ? (
                            <button
                              onClick={() => handleOpenVerify(ord.id)}
                              class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center space-x-1 mx-auto shadow-sm"
                            >
                              <Eye size={12} />
                              <span>Periksa</span>
                            </button>
                          ) : (
                            <span class="text-slate-300 text-[10px] italic">Tidak Ada</span>
                          )}
                        </td>
                        <td class="p-4">
                          <select 
                            value={ord.status} 
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            class="bg-slate-50 border p-1 rounded font-semibold text-[10px] text-slate-700 focus:outline-none"
                          >
                            <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                            <option value="Diproses">Diproses</option>
                            <option value="Dikirim">Dikirim</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SUBVIEW: VOUCHER CODE CRUD
            ======================================================== */}
        {activeTab === 'vouchers' && (
          <div class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Voucher Diskon</h1>
                <p class="text-slate-500 text-xs mt-0.5">Atur kode promosi belanja potongan harga</p>
              </div>
              <button 
                onClick={handleOpenAddVoucher}
                class="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow"
              >
                <Plus size={16} />
                <span>Buat Voucher</span>
              </button>
            </div>

            {loadingVouchers ? (
              <div class="bg-white border rounded-3xl p-12 text-center h-80 animate-pulse" />
            ) : (
              <div class="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100">
                      <th class="p-4 font-bold text-slate-400">Kode</th>
                      <th class="p-4 font-bold text-slate-400">Potongan Harga</th>
                      <th class="p-4 font-bold text-slate-400">Minimal Belanja</th>
                      <th class="p-4 font-bold text-slate-400">Tanggal Aktif</th>
                      <th class="p-4 font-bold text-slate-400">Status</th>
                      <th class="p-4 font-bold text-slate-400 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {vouchers.map((v) => (
                      <tr key={v.id} class="hover:bg-slate-50/50">
                        <td class="p-4 font-mono font-bold text-indigo-600 uppercase text-xs">{v.code}</td>
                        <td class="p-4 font-bold text-slate-800">
                          {v.discount_percent > 0 ? `${v.discount_percent}%` : `Rp ${parseFloat(v.discount_amount).toLocaleString('id-ID')}`}
                        </td>
                        <td class="p-4 font-bold text-slate-600">Rp {parseFloat(v.min_purchase).toLocaleString('id-ID')}</td>
                        <td class="p-4 text-slate-500">
                          {new Date(v.start_date).toLocaleDateString('id-ID')} - {new Date(v.end_date).toLocaleDateString('id-ID')}
                        </td>
                        <td class="p-4">
                          <span class={`px-2 py-0.5 rounded font-bold text-[9px] ${v.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {v.is_active ? 'AKTIF' : 'NON-AKTIF'}
                          </span>
                        </td>
                        <td class="p-4">
                          <div class="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => handleOpenEditVoucher(v)}
                              class="p-1.5 border border-slate-200 text-slate-500 hover:text-brand-600 rounded bg-white hover:bg-slate-50"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteVoucher(v.id)}
                              class="p-1.5 border border-slate-200 text-slate-500 hover:text-rose-600 rounded bg-white hover:bg-slate-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SUBVIEW: USERS & USER ROLE MANAGEMENTS
            ======================================================== */}
        {activeTab === 'users' && (
          <div class="space-y-6 animate-fade-in">
            <div>
              <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen User Pelanggan</h1>
              <p class="text-slate-500 text-xs mt-0.5">Pantau data profil akun terdaftar serta promosikan role Admin</p>
            </div>

            {loadingUsers ? (
              <div class="bg-white border rounded-3xl p-12 text-center h-80 animate-pulse" />
            ) : (
              <div class="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100">
                      <th class="p-4 font-bold text-slate-400">ID</th>
                      <th class="p-4 font-bold text-slate-400">Nama Pengguna</th>
                      <th class="p-4 font-bold text-slate-400">Email</th>
                      <th class="p-4 font-bold text-slate-400">Telepon</th>
                      <th class="p-4 font-bold text-slate-400">Role Hak Akses</th>
                      <th class="p-4 font-bold text-slate-400 text-center">Promosi / Demote</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} class="hover:bg-slate-50/50">
                        <td class="p-4 font-mono font-bold text-slate-400">#{u.id}</td>
                        <td class="p-4 font-bold text-slate-800">{u.name}</td>
                        <td class="p-4 text-slate-650">{u.email}</td>
                        <td class="p-4 text-slate-500">{u.phone || '-'}</td>
                        <td class="p-4">
                          <span class={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td class="p-4 text-center">
                          {user.id !== u.id ? (
                            <button
                              onClick={() => handleToggleUserRole(u.id, u.role)}
                              class="text-[10px] font-bold border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 bg-white px-2 py-1 rounded transition-colors"
                            >
                              Ubah Role
                            </button>
                          ) : (
                            <span class="text-slate-400 italic text-[10px]">Akun Anda</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <AdminReports />
        )}

      </main>

      {/* ========================================================
          MODAL: ADD/EDIT PRODUCT
          ======================================================== */}
      {isProdModalOpen && (
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-100 shadow-2xl animate-fade-in my-8 max-h-[85vh] overflow-y-auto space-y-6">
            <div class="flex items-center justify-between border-b pb-4">
              <h3 class="text-base font-extrabold text-slate-800">{selectedProd ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={() => setIsProdModalOpen(false)} class="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProd} class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div>
                <label class="block font-semibold text-slate-500 mb-1">Nama Produk</label>
                <input type="text" required value={prodForm.name} onChange={(e) => setProdForm({...prodForm, name: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              
              <div>
                <label class="block font-semibold text-slate-500 mb-1">Brand / Merk</label>
                <input type="text" required value={prodForm.brand} onChange={(e) => setProdForm({...prodForm, brand: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Kategori</label>
                <select value={prodForm.category_id} onChange={(e) => setProdForm({...prodForm, category_id: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Harga (Rp)</label>
                <input type="number" required value={prodForm.price} onChange={(e) => setProdForm({...prodForm, price: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Stok (Pcs)</label>
                <input type="number" required value={prodForm.stock} onChange={(e) => setProdForm({...prodForm, stock: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Diskon (%)</label>
                <input type="number" min="0" max="99" value={prodForm.discount_percent} onChange={(e) => setProdForm({...prodForm, discount_percent: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Spesifikasi RAM</label>
                <input type="text" value={prodForm.spec_ram} onChange={(e) => setProdForm({...prodForm, spec_ram: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none" placeholder="Contoh: 16GB DDR5" />
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Spesifikasi Storage</label>
                <input type="text" value={prodForm.spec_storage} onChange={(e) => setProdForm({...prodForm, spec_storage: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none" placeholder="Contoh: 1TB NVMe SSD" />
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Spesifikasi CPU</label>
                <input type="text" value={prodForm.spec_cpu} onChange={(e) => setProdForm({...prodForm, spec_cpu: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none" placeholder="Contoh: Intel Core i7" />
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Spesifikasi GPU</label>
                <input type="text" value={prodForm.spec_gpu} onChange={(e) => setProdForm({...prodForm, spec_gpu: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none" placeholder="Contoh: NVIDIA RTX 4060" />
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Berat (Kg)</label>
                <input type="number" step="0.01" value={prodForm.weight} onChange={(e) => setProdForm({...prodForm, weight: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none" />
              </div>

              <div class="sm:col-span-2">
                <ProductImageUploader 
                  images={prodForm.images}
                  onImagesChange={(newImages) => setProdForm({...prodForm, images: newImages})}
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-500 mb-1">Deskripsi Produk</label>
                <textarea rows="3" value={prodForm.description} onChange={(e) => setProdForm({...prodForm, description: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl focus:outline-none" />
              </div>

              <div class="sm:col-span-2 flex items-center space-x-6 pt-2">
                <label class="flex items-center space-x-2 font-bold cursor-pointer">
                  <input type="checkbox" checked={prodForm.is_new} onChange={(e) => setProdForm({...prodForm, is_new: e.target.checked})} class="rounded text-brand-600 focus:ring-brand-500" />
                  <span>Produk Baru</span>
                </label>
                <label class="flex items-center space-x-2 font-bold cursor-pointer">
                  <input type="checkbox" checked={prodForm.is_best_seller} onChange={(e) => setProdForm({...prodForm, is_best_seller: e.target.checked})} class="rounded text-brand-600 focus:ring-brand-500" />
                  <span>Best Seller</span>
                </label>
              </div>

              <div class="sm:col-span-2 pt-4 flex space-x-3">
                <button type="submit" class="flex-grow bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700">Simpan Produk</button>
                <button type="button" onClick={() => setIsProdModalOpen(false)} class="px-6 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-600">Batal</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INSPECT PAYMENT RECEIPT PROOF
          ======================================================== */}
      {isVerifyModalOpen && selectedOrder && (
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl animate-fade-in space-y-6 max-h-[85vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b pb-4">
              <div>
                <h3 class="text-base font-extrabold text-slate-800">Verifikasi Bukti Pembayaran</h3>
                <span class="text-[10px] text-slate-400 block mt-0.5">Invoice ID: #{selectedOrder.order.id} | Atas Nama: {selectedOrder.order.customer_name}</span>
              </div>
              <button onClick={() => setIsVerifyModalOpen(false)} class="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {selectedOrder.payment ? (
              <div class="space-y-6 text-xs">
                {/* Proof Image Render */}
                <div class="border rounded-2xl bg-slate-50 aspect-[4/3] flex items-center justify-center overflow-hidden">
                  <img 
                    src={selectedOrder.payment.proof_image} 
                    alt="Bukti Transfer" 
                    class="object-contain max-h-full max-w-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = '<div class="text-center p-4 text-slate-400 font-semibold">🖼️ Gagal memuat file gambar bukti pembayaran.<br><span class="text-[10px] font-mono block mt-2">'+selectedOrder.payment.proof_image+'</span></div>';
                    }}
                  />
                </div>

                <div class="bg-slate-50 p-4 rounded-xl space-y-2">
                  <div class="flex justify-between">
                    <span class="font-bold text-slate-400">Total Belanja Tagihan:</span>
                    <span class="font-extrabold text-slate-800">Rp {parseFloat(selectedOrder.order.net_amount).toLocaleString('id-ID')}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-bold text-slate-400">Metode Pembayaran:</span>
                    <span class="font-bold text-brand-600">{selectedOrder.order.payment_method}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-bold text-slate-400">Tanggal Unggah Bukti:</span>
                    <span class="font-semibold text-slate-700">{new Date(selectedOrder.payment.payment_date).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Verification CTA Actions */}
                <div class="flex gap-3 pt-2">
                  <button
                    onClick={() => handleVerifyPayment(selectedOrder.payment.id, 'Disetujui')}
                    class="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-1 shadow"
                  >
                    <Check size={16} />
                    <span>Setujui Pembayaran</span>
                  </button>
                  <button
                    onClick={() => handleVerifyPayment(selectedOrder.payment.id, 'Ditolak')}
                    class="flex-grow bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-1 shadow"
                  >
                    <X size={16} />
                    <span>Tolak Pembayaran</span>
                  </button>
                </div>
              </div>
            ) : (
              <div class="text-center p-8 text-slate-500 text-xs flex flex-col items-center">
                <AlertCircle size={36} class="text-slate-300 mb-2" />
                <span>Pelanggan belum mengunggah foto struk transfer pembayaran.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD/EDIT VOUCHER
          ======================================================== */}
      {isVoucherModalOpen && (
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl animate-fade-in space-y-6">
            <div class="flex items-center justify-between border-b pb-4">
              <h3 class="text-base font-extrabold text-slate-800">{selectedVoucher ? 'Edit Voucher' : 'Buat Voucher Baru'}</h3>
              <button onClick={() => setIsVoucherModalOpen(false)} class="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} class="space-y-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-500 mb-1">Kode Voucher</label>
                <input type="text" required value={voucherForm.code} onChange={(e) => setVoucherForm({...voucherForm, code: e.target.value.toUpperCase()})} class="w-full bg-slate-50 border p-2.5 rounded-xl uppercase font-mono" placeholder="Contoh: HEMAT10" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-500 mb-1">Potongan Flat (Rp)</label>
                  <input type="number" value={voucherForm.discount_amount} onChange={(e) => setVoucherForm({...voucherForm, discount_amount: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-500 mb-1">Potongan Persen (%)</label>
                  <input type="number" min="0" max="100" value={voucherForm.discount_percent} onChange={(e) => setVoucherForm({...voucherForm, discount_percent: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl" />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Minimal Belanja (Rp)</label>
                <input type="number" value={voucherForm.min_purchase} onChange={(e) => setVoucherForm({...voucherForm, min_purchase: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-500 mb-1">Tanggal Mulai</label>
                  <input type="datetime-local" required value={voucherForm.start_date} onChange={(e) => setVoucherForm({...voucherForm, start_date: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-500 mb-1">Tanggal Berakhir</label>
                  <input type="datetime-local" required value={voucherForm.end_date} onChange={(e) => setVoucherForm({...voucherForm, end_date: e.target.value})} class="w-full bg-slate-50 border p-2.5 rounded-xl" />
                </div>
              </div>

              <div class="flex items-center space-x-2 pt-1.5">
                <input type="checkbox" checked={voucherForm.is_active} onChange={(e) => setVoucherForm({...voucherForm, is_active: e.target.checked})} class="rounded text-brand-600 focus:ring-brand-500" />
                <span class="font-bold cursor-pointer">Voucher Aktif & Dapat Digunakan</span>
              </div>

              <div class="pt-4 flex space-x-3">
                <button type="submit" class="flex-grow bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700">Simpan Voucher</button>
                <button type="button" onClick={() => setIsVoucherModalOpen(false)} class="px-5 border rounded-xl hover:bg-slate-50 text-slate-500 font-semibold">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
