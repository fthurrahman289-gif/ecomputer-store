import React, { useState, useEffect, useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../services/api';
import { 
  ShoppingBag, 
  Upload, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Landmark, 
  ChevronRight, 
  AlertCircle,
  FileImage,
  Printer,
  CreditCard
} from 'lucide-react';

const OrderStatus = () => {
  const { user } = useContext(AppContext);
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // File upload state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Countdown timer string
  const [timerText, setTimerText] = useState('');

  // Load orders history list
  const loadOrdersHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await apiCall('/api/orders/my-orders');
      setOrders(data);

      // If redirected from checkout, load that specific order
      if (location.state && location.state.orderId) {
        loadOrderDetail(location.state.orderId);
      } else if (data.length > 0) {
        // Default to loading the most recent order
        loadOrderDetail(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load orders history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrdersHistory();
    }
  }, [user]);

  // Load specific order details
  const loadOrderDetail = async (orderId) => {
    setLoadingDetail(true);
    setUploadSuccess('');
    setUploadError('');
    setFile(null);
    try {
      const data = await apiCall(`/api/orders/${orderId}`);
      setActiveOrder(data);
    } catch (err) {
      console.error('Failed to load order details', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Ticking countdown timer for unpaid order
  useEffect(() => {
    if (!activeOrder || activeOrder.order.status !== 'Menunggu Pembayaran') {
      setTimerText('');
      return;
    }

    const targetTime = new Date(activeOrder.order.expired_at).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimerText('Batas waktu pembayaran habis (Dibatalkan)');
        // Reload order detail to refresh canceled status
        loadOrdersHistory();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimerText(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} tersisa`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeOrder]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!file || !activeOrder) return;

    setUploading(true);
    setUploadSuccess('');
    setUploadError('');

    const formData = new FormData();
    formData.append('orderId', activeOrder.order.id);
    formData.append('proof', file);

    try {
      const response = await apiCall('/api/orders/upload-proof', {
        method: 'POST',
        body: formData
      });

      setUploadSuccess(response.message);
      // Reload details to show updated status
      loadOrderDetail(activeOrder.order.id);
      // Reload history list
      const updatedHistory = await apiCall('/api/orders/my-orders');
      setOrders(updatedHistory);
    } catch (err) {
      setUploadError(err.message || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setUploading(false);
    }
  };

  const handlePrintReceipt = (orderData) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = orderData.items.map(item => `
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
        <div style="flex-grow: 1; padding-right: 10px;">
          <div>${item.name}</div>
          <div style="color: #666; font-size: 10px;">${item.quantity} x Rp ${item.price.toLocaleString('id-ID')}</div>
        </div>
        <div style="text-align: right; font-weight: bold; white-space: nowrap;">
          Rp ${(item.price * item.quantity).toLocaleString('id-ID')}
        </div>
      </div>
    `).join('');

    const voucherHtml = orderData.order.voucher_code ? `
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
        <div>Voucher (${orderData.order.voucher_code})</div>
        <div>- Rp ${parseFloat(orderData.order.discount_amount).toLocaleString('id-ID')}</div>
      </div>
    ` : '';

    const htmlContent = `
      <html>
        <head>
          <title>Struk Pembayaran #${orderData.order.id}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; width: 80mm; }
              @page { size: auto; margin: 0mm; }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              width: 80mm;
              padding: 10px;
              margin: 0 auto;
              box-sizing: border-box;
            }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .header-title { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            .header-subtitle { font-size: 10px; color: #333; margin-bottom: 10px; }
            .meta-info { font-size: 11px; margin-bottom: 4px; }
            .footer-msg { font-size: 10px; margin-top: 15px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="header-title">E-COMPUTER</div>
            <div class="header-subtitle">Ruko Cyber Mall Lantai 2, Jakarta<br>Telp: 081234567890</div>
          </div>
          <div class="divider"></div>
          <div class="meta-info">
            <div><strong>No. Invoice :</strong> #${orderData.order.id}</div>
            <div><strong>Tanggal     :</strong> ${new Date(orderData.order.order_date).toLocaleString('id-ID')}</div>
            <div><strong>Pelanggan   :</strong> ${orderData.order.customer_name}</div>
            <div><strong>Pengiriman  :</strong> ${orderData.order.shipping_method}</div>
            <div><strong>Kasir       :</strong> ${orderData.order.shipping_method === 'Pembelian di Toko' ? 'Admin Store' : 'Online System'}</div>
          </div>
          <div class="divider"></div>
          <div style="margin-bottom: 10px;">
            ${itemsHtml}
          </div>
          <div class="divider"></div>
          <div style="font-size: 11px; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <div>Subtotal</div>
              <div>Rp ${parseFloat(orderData.order.total_amount).toLocaleString('id-ID')}</div>
            </div>
            ${voucherHtml}
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px;">
              <div>TOTAL BAYAR</div>
              <div>Rp ${parseFloat(orderData.order.net_amount).toLocaleString('id-ID')}</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px;">
              <div>Metode Bayar</div>
              <div style="text-transform: uppercase;">${orderData.order.payment_method}</div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="center footer-msg">
            Terima kasih atas kunjungan & pembelian Anda!<br>
            Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Menunggu Verifikasi': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Diproses': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Menunggu di Ambil': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Dikirim': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Sudah di Ambil': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Selesai': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Dibatalkan': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <span className="text-6xl">🔒</span>
        <h2 className="text-2xl font-bold text-slate-800 mt-4">Akses Terbatas</h2>
        <p className="text-slate-500 mt-1 mb-8">Silakan login untuk memantau status pesanan Anda.</p>
        <Link to="/login" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-full shadow-md">
          Login Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight border-b border-slate-100 pb-6 mb-8">
        Transaksi & Status Pesanan
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN - Orders History List */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Belanja</h3>
          
          {loadingHistory ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(n => <div key={n} className="h-20 bg-white border rounded-xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center text-slate-500 text-xs">
              Belum ada riwayat pesanan.
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {orders.map((ord) => (
                <button
                  key={ord.id}
                  onClick={() => loadOrderDetail(ord.id)}
                  className={`w-full text-left bg-white rounded-2xl p-4 border transition-all flex items-center justify-between hover:border-brand-300 shadow-sm ${activeOrder && activeOrder.order.id === ord.id ? 'border-brand-500 ring-2 ring-brand-500/10' : 'border-slate-100'}`}
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Order ID: #{ord.id}</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1">Rp {parseFloat(ord.net_amount).toLocaleString('id-ID')}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(ord.order_date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusBadgeClass(ord.status)}`}>
                    {ord.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT/MIDDLE COLUMN - Active Order Detail Panel */}
        <div className="lg:col-span-2">
          {loadingDetail ? (
            <div className="bg-white border rounded-3xl p-12 text-center h-80 animate-pulse" />
          ) : !activeOrder ? (
            <div className="bg-white border rounded-3xl p-12 text-center text-slate-500 text-sm shadow-sm h-80 flex flex-col justify-center items-center">
              <ShoppingBag size={48} className="text-slate-300 mb-4" />
              <span>Silakan pilih salah satu pesanan untuk melihat detail.</span>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8 animate-fade-in">
              
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6 gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-mono">Invoice ID: #{activeOrder.order.id}</span>
                  <div className="flex items-center space-x-3 mt-1 flex-wrap gap-2">
                    <h2 className="text-lg font-extrabold text-slate-800">Detail Transaksi</h2>
                    {(activeOrder.order.shipping_method === 'Ambil di Toko' || activeOrder.order.shipping_method === 'Pembelian di Toko') && (
                      <button
                        onClick={() => handlePrintReceipt(activeOrder)}
                        className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm transition-all hover:scale-105 active:scale-95"
                      >
                        <Printer size={12} className="mr-1" />
                        <span>Cetak Struk</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">{new Date(activeOrder.order.order_date).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-xs text-slate-400 uppercase font-bold mb-1">Status Pesanan</span>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border uppercase ${getStatusBadgeClass(activeOrder.order.status)}`}>
                    {activeOrder.order.status}
                  </span>
                </div>
              </div>

              {/* Status Stepper Progression */}
              {activeOrder.order.status !== 'Dibatalkan' && (
                <div className="relative">
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 -z-0 hidden md:block"></div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10 text-center">
                    {[
                      { name: 'Menunggu Pembayaran', active: ['Menunggu Pembayaran', 'Menunggu Verifikasi', 'Diproses', 'Dikirim', 'Menunggu di Ambil', 'Sudah di Ambil', 'Selesai'] },
                      { name: 'Verifikasi', active: ['Menunggu Verifikasi', 'Diproses', 'Dikirim', 'Menunggu di Ambil', 'Sudah di Ambil', 'Selesai'] },
                      { name: 'Diproses', active: ['Diproses', 'Dikirim', 'Menunggu di Ambil', 'Sudah di Ambil', 'Selesai'] },
                      { name: (activeOrder.order.shipping_method === 'Ambil di Toko' || activeOrder.order.shipping_method === 'Pembelian di Toko') ? 'Siap di Ambil' : 'Dikirim', active: ['Dikirim', 'Menunggu di Ambil', 'Sudah di Ambil', 'Selesai'] },
                      { name: (activeOrder.order.shipping_method === 'Ambil di Toko' || activeOrder.order.shipping_method === 'Pembelian di Toko') ? 'Sudah di Ambil' : 'Selesai', active: ['Sudah di Ambil', 'Selesai'] }
                    ].map((step, idx) => {
                      const isStepActive = step.active.includes(activeOrder.order.status);
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${isStepActive ? 'bg-brand-600 border-brand-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[10px] font-bold mt-2 ${isStepActive ? 'text-slate-800' : 'text-slate-400'}`}>{step.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Countdown for Unpaid Orders */}
              {activeOrder.order.status === 'Menunggu Pembayaran' && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 text-amber-800 text-xs sm:text-sm">
                    <Clock size={20} className="shrink-0 text-amber-600 animate-pulse" />
                    <div>
                      <span className="font-bold block">Segera Lakukan Pembayaran!</span>
                      <span className="text-[11px] block mt-0.5 text-slate-500">Transfer tepat ke rekening di bawah sebelum batas waktu berakhir.</span>
                    </div>
                  </div>
                  <span className="bg-amber-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-sm font-mono shrink-0">
                    {timerText}
                  </span>
                </div>
              )}

              {/* Delivery info & Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                
                {/* Shipping info */}
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                    {activeOrder.order.shipping_method === 'Ambil di Toko' ? 'Pengambilan di Toko' : 'Tujuan Pengiriman'}
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">Nama Penerima:</span>
                      <span className="text-slate-600">{activeOrder.order.customer_name}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin size={16} className="text-slate-400 shrink-0" />
                      <span className="text-slate-600 leading-relaxed">{activeOrder.order.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone size={16} className="text-slate-400 shrink-0" />
                      <span className="text-slate-600">{activeOrder.order.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Payment instructions */}
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Detail Rekening Pembayaran</h3>
                  <div className="space-y-3">
                    {activeOrder.order.payment_method === 'Transfer Bank' && (
                      <>
                        {[
                          { bank: 'BCA (Transfer Bank)', num: '8027491290', name: 'PT E-Computer Indonesia' },
                          { bank: 'Mandiri (Transfer Bank)', num: '1320098765432', name: 'PT E-Computer Indonesia' }
                        ].map((acct, idx) => (
                          <div key={idx} className="text-xs border-b last:border-0 border-slate-200/50 pb-2 last:pb-0">
                            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                              <Landmark size={14} className="text-brand-600" />
                              <span>{acct.bank}</span>
                            </div>
                            <div className="font-mono text-brand-605 font-extrabold py-0.5">{acct.num}</div>
                            <div className="text-[10px] text-slate-400">A/N {acct.name}</div>
                          </div>
                        ))}
                      </>
                    )}

                    {activeOrder.order.payment_method === 'E-Wallet' && (
                      <div className="text-xs space-y-1.5">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                          <CreditCard size={14} className="text-indigo-600" />
                          <span>E-Wallet (Gopay / OVO)</span>
                        </div>
                        <div className="font-mono text-brand-600 font-extrabold py-0.5">081234567890</div>
                        <div className="text-[10px] text-slate-400">A/N E-COMPUTER PAY</div>
                        <div className="text-[9px] text-slate-400 italic mt-2 bg-slate-100 p-2 rounded-lg border leading-relaxed">
                          Silakan scan QR Code store atau transfer ke nomor di atas, lalu unggah bukti transaksi Anda di form di bawah ini.
                        </div>
                      </div>
                    )}

                    {activeOrder.order.payment_method === 'Tunai' && (
                      <div className="text-xs space-y-1">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                          <Landmark size={14} className="text-emerald-600" />
                          <span>Pembayaran Tunai / Cash</span>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-600 mt-1">LUNAS DI KASIR TOKO</div>
                        <div className="text-[9px] text-slate-400 italic leading-relaxed mt-1">
                          Pesanan dibeli dan diselesaikan secara offline langsung di toko.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Items Purchased List */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Item yang Dipesan</h3>
                <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 bg-slate-50/20 overflow-hidden">
                  {activeOrder.items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between text-xs gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 bg-slate-100 rounded overflow-hidden flex items-center justify-center shrink-0 border text-xl">
                          {item.image_urls && item.image_urls.length > 0 ? (
                            <img 
                              src={item.image_urls[0]} 
                              alt={item.name} 
                              className="absolute inset-0 w-full h-full object-contain p-0.5"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fb = e.target.parentNode.querySelector('.emoji-fallback');
                                if (fb) fb.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="emoji-fallback absolute inset-0 flex items-center justify-center" style={{ display: item.image_urls && item.image_urls.length > 0 ? 'none' : 'flex' }}>
                            {item.category_id === 1 ? '💻' : '⚙️'}
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block line-clamp-1">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Brand: {item.brand} | Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-700 shrink-0">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order total */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border text-sm">
                <span className="font-bold text-slate-700">Total Pembayaran Tagihan:</span>
                <span className="text-brand-600 font-extrabold text-lg">Rp {parseFloat(activeOrder.order.net_amount).toLocaleString('id-ID')}</span>
              </div>

              {/* UPLOAD PROOF AREA */}
              {activeOrder.order.status === 'Menunggu Pembayaran' && (
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50/50 space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center space-x-2">
                    <Upload size={18} className="text-brand-500 animate-bounce" />
                    <span>Unggah Bukti Pembayaran</span>
                  </h3>
                  <p className="text-xs text-slate-400">Unggah foto atau screenshot struk transfer bank / bukti transaksi e-wallet Anda untuk diverifikasi Admin (format jpg, jpeg, png).</p>
                  
                  {uploadSuccess && <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg border border-emerald-100">{uploadSuccess}</div>}
                  {uploadError && <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg border border-rose-100">{uploadError}</div>}

                  <form onSubmit={handleUploadProof} className="flex flex-col sm:flex-row gap-4 items-center">
                    <label className="w-full sm:w-auto flex items-center justify-center space-x-2 border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 transition-colors">
                      <FileImage size={16} className="text-slate-400" />
                      <span>{file ? file.name : 'Pilih File Gambar'}</span>
                      <input type="file" accept="image/*" required onChange={handleFileChange} className="hidden" />
                    </label>
                    <button
                      type="submit"
                      disabled={uploading || !file}
                      className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      {uploading ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                    </button>
                  </form>
                </div>
              )}

              {/* Uploaded Payment Info for verification check */}
              {activeOrder.payment && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">Status Pembayaran Terunggah</h4>
                  <div className="flex items-center space-x-3 text-xs">
                    <CheckCircle2 size={18} className="text-indigo-600" />
                    <span className="text-indigo-950 font-semibold">Bukti transfer sudah diunggah pada {new Date(activeOrder.payment.payment_date).toLocaleDateString('id-ID')}.</span>
                  </div>
                  <div className="text-[10px] text-indigo-800/80 italic">Status verifikasi pembayaran: {activeOrder.payment.status}</div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default OrderStatus;
