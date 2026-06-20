import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../services/api';
import { CreditCard, Landmark, Truck, Phone, MapPin, ArrowRight, ShieldCheck, ArrowLeft, Ticket, CheckCircle2, AlertCircle, QrCode } from 'lucide-react';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, clearCart, user } = useContext(AppContext);

  // Retrieve values passed from Cart page or ProductDetail quick checkout
  const { cartTotal, quickCheckout } = location.state || {
    cartTotal: 0,
    quickCheckout: null
  };

  // Use quickCheckout items if available, otherwise use cart
  const checkoutItems = quickCheckout ? [quickCheckout] : cart;

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [activeVoucher, setActiveVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');

  // Discount calculation
  let discountAmount = 0;
  if (activeVoucher) {
    if (activeVoucher.discount_percent > 0) {
      discountAmount = cartTotal * (activeVoucher.discount_percent / 100);
    } else {
      discountAmount = parseFloat(activeVoucher.discount_amount);
    }
    if (discountAmount > cartTotal) discountAmount = cartTotal;
  }

  const netTotal = cartTotal - discountAmount;

  const [address, setAddress] = useState(user ? user.address || '' : '');
  const [phone, setPhone] = useState(user ? user.phone || '' : '');
  const [receiverName, setReceiverName] = useState(user ? user.name || '' : '');
  const [shippingMethod, setShippingMethod] = useState('Pengiriman');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSettings, setPaymentSettings] = useState({});
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Admin POS fields
  const [customerName, setCustomerName] = useState('');

  const isEWalletDisabled = netTotal >= 40000000;
  const isAdmin = user && user.role === 'admin';

  // Handle shipping/payment dependencies
  useEffect(() => {
    // Load payment settings from API
    const loadPaymentSettings = async () => {
      try {
        const data = await apiCall('/api/payment/settings', {}, 'GET');
        const settingsMap = {};
        data.forEach(setting => {
          settingsMap[setting.payment_method] = setting;
        });
        setPaymentSettings(settingsMap);
      } catch (err) {
        console.error('Error loading payment settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadPaymentSettings();
  }, []);

  // Handle shipping/payment dependencies
  useEffect(() => {
    if (shippingMethod === 'Pembelian di Toko') {
      setPaymentMethod('Tunai');
    } else {
      if (paymentMethod === 'Tunai') {
        setPaymentMethod('Transfer Bank');
      }
    }

    if (shippingMethod === 'Ambil di Toko') {
      setPhone('');
      setAddress('');
    } else if (shippingMethod === 'Pengiriman') {
      setPhone(user ? user.phone || '' : '');
      setAddress(user ? user.address || '' : '');
    }
  }, [shippingMethod, user, paymentMethod]);

  // Automatically reset payment method to bank transfer if e-wallet is disabled
  useEffect(() => {
    if (isEWalletDisabled && paymentMethod === 'E-Wallet') {
      setPaymentMethod('Transfer Bank');
    }
  }, [isEWalletDisabled, paymentMethod]);

  // Safeguard: Redirect back to Cart if cart is empty or loaded directly (but allow if coming from quick checkout with cartTotal)
  const hasQuickCheckoutData = location.state?.quickCheckout;
  if ((checkoutItems.length === 0 && cartTotal === 0) || (!hasQuickCheckoutData && checkoutItems.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Keranjang Belanja Anda Kosong</h2>
        <Link to="/cart" className="text-brand-600 font-semibold underline mt-2 block">Kembali ke Keranjang</Link>
      </div>
    );
  }

  const handleApplyVoucher = async (e) => {
    e.preventDefault();
    setVoucherError('');
    setVoucherSuccess('');

    if (!voucherCode.trim()) return;

    try {
      const result = await apiCall('/api/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: voucherCode.trim(),
          purchaseAmount: cartTotal
        })
      });

      setActiveVoucher(result.voucher);
      setVoucherSuccess(result.message);
    } catch (err) {
      setActiveVoucher(null);
      setVoucherError(err.message || 'Voucher tidak dapat digunakan.');
    }
  };

  const removeVoucher = () => {
    setActiveVoucher(null);
    setVoucherCode('');
    setVoucherSuccess('');
    setVoucherError('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Handle both regular cart items and quick checkout
    let items;
    if (quickCheckout) {
      items = [{
        productId: quickCheckout.product.id,
        quantity: quickCheckout.quantity
      }];
    } else {
      items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));
    }

    let finalAddress = address;
    if (shippingMethod === 'Ambil di Toko') {
      finalAddress = 'Ambil di Toko (Ruko Cyber Mall Lantai 2, Jakarta)';
    } else if (shippingMethod === 'Pembelian di Toko') {
      finalAddress = 'Pembelian di Toko E-Computer';
    }

    try {
      const response = await apiCall('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items,
          voucherCode: activeVoucher ? activeVoucher.code : null,
          address: finalAddress,
          phone,
          paymentMethod,
          shippingMethod,
          customerName: shippingMethod === 'Pembelian di Toko' ? customerName : (isAdmin ? receiverName : undefined)
        })
      });

      // Clear Cart state
      clearCart();

      // Redirect to Order Status/Details page with state details
      navigate('/order-status', {
        state: {
          successMessage: response.message,
          orderId: response.orderId,
          netAmount: response.netAmount,
          expiredAt: response.expiredAt,
          bankAccounts: response.paymentDetails.bankAccounts
        }
      });
    } catch (err) {
      setError(err.message || 'Gagal memproses checkout. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4 border-b border-slate-100 pb-6 mb-8">
        <button 
          onClick={() => navigate('/cart')} 
          className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800 shrink-0 border border-slate-200 bg-white shadow-sm"
          title="Kembali ke Keranjang"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Checkout Pembayaran
        </h1>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg mb-6 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CHECKOUT FORM (Left/Middle Columns) */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-2 space-y-6">
          
          {/* Shipping & Delivery Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center space-x-2 border-b pb-3">
              <Truck size={18} className="text-brand-500" />
              <span>Metode & Alamat Pengiriman</span>
            </h2>

            {/* Selector: Pengiriman vs Ambil di Toko vs Pembelian di Toko (Khusus Admin) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className={`border rounded-2xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${shippingMethod === 'Pengiriman' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="shippingMethod" 
                  checked={shippingMethod === 'Pengiriman'} 
                  onChange={() => setShippingMethod('Pengiriman')}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-800">Kirim ke Alamat</span>
                  <span className="block text-[10px] text-slate-400">Pengiriman kurir ke rumah</span>
                </div>
              </label>

              <label className={`border rounded-2xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${shippingMethod === 'Ambil di Toko' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="shippingMethod" 
                  checked={shippingMethod === 'Ambil di Toko'} 
                  onChange={() => setShippingMethod('Ambil di Toko')}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-800">Ambil di Toko</span>
                  <span className="block text-[10px] text-slate-400">Ruko Cyber Mall Lantai 2</span>
                </div>
              </label>

              {isAdmin && (
                <label className={`border rounded-2xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${shippingMethod === 'Pembelian di Toko' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name="shippingMethod" 
                    checked={shippingMethod === 'Pembelian di Toko'} 
                    onChange={() => setShippingMethod('Pembelian di Toko')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <div className="text-left">
                    <span className="block text-xs font-bold text-slate-800">Pembelian di Toko</span>
                    <span className="block text-[10px] text-slate-400">POS Offline Kasir</span>
                  </div>
                </label>
              )}
            </div>
            
            <div className="space-y-4 pt-2">
              
              {/* Conditional dropdown for Admin POS */}
              {shippingMethod === 'Pembelian di Toko' ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Customer Pembeli</label>
                    <input
                      required
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Masukkan nama pembeli..."
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    Transaksi ini akan dicatat atas nama customer terdaftar yang dipilih dan langsung ditandai Lunas / Selesai.
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{shippingMethod === 'Ambil di Toko' ? 'Nama Pengambil' : 'Nama Penerima'}</label>
                  <input 
                    type="text" 
                    value={receiverName} 
                    onChange={(e) => setReceiverName(e.target.value)}
                    disabled={!isAdmin} 
                    className={`w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${!isAdmin ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-800'}`}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nomor Telepon / WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16} />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              {shippingMethod === 'Ambil di Toko' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 animate-fade-in">
                  <span className="font-bold text-slate-700 block">Alamat Pengambilan Toko:</span>
                  <span className="block font-semibold text-brand-600">E-COMPUTER STORE</span>
                  <span className="block leading-relaxed">Ruko Cyber Mall Lantai 2, Jakarta</span>
                  <span className="block text-[10px] text-slate-400 italic mt-1">Pesanan Anda dapat diambil langsung setelah status pembayaran diverifikasi oleh Admin.</span>
                </div>
              )}

              {shippingMethod === 'Pengiriman' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Alamat Lengkap Pengiriman</label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <textarea 
                      required
                      rows={3}
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Tulis alamat rumah lengkap RT/RW, Kecamatan, Kota, Kode Pos..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center space-x-2">
              <Landmark size={18} className="text-indigo-500" />
              <span>Metode Pembayaran</span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Option Tunai - Only for Admin Store Purchase (POS) */}
              {shippingMethod === 'Pembelian di Toko' && (
                <label className={`border rounded-2xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${paymentMethod === 'Tunai' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'Tunai'} 
                    onChange={() => setPaymentMethod('Tunai')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Landmark size={20} className="text-emerald-600" />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-slate-800">Tunai / Cash</span>
                      <span className="block text-[10px] text-slate-400">Kasir Toko (Lunas)</span>
                    </div>
                  </div>
                </label>
              )}

              {/* Option Bank */}
              <label className={`border rounded-2xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${paymentMethod === 'Transfer Bank' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'Transfer Bank'} 
                  onChange={() => setPaymentMethod('Transfer Bank')}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <div className="flex items-center space-x-2">
                  <Landmark size={20} className="text-brand-600" />
                  <div className="text-left">
                    <span className="block text-xs font-bold text-slate-800">Transfer Bank</span>
                    <span className="block text-[10px] text-slate-400">{paymentSettings['Transfer Bank']?.bank_name || 'Bank'}</span>
                  </div>
                </div>
              </label>

              {/* Option QRIS */}
              {paymentSettings['QRIS']?.is_active && (
                <label className={`border rounded-2xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${paymentMethod === 'QRIS' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'QRIS'} 
                    onChange={() => setPaymentMethod('QRIS')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex items-center space-x-2">
                    <QrCode size={20} className="text-purple-600" />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-slate-800">QRIS</span>
                      <span className="block text-[10px] text-slate-400">Semua E-Wallet</span>
                    </div>
                  </div>
                </label>
              )}

              {/* Option E-Wallet */}
              <label className={`border rounded-2xl p-4 flex items-center space-x-3 transition-all ${isEWalletDisabled ? 'border-slate-100 bg-slate-50/85 cursor-not-allowed opacity-50' : 'cursor-pointer'} ${!isEWalletDisabled && paymentMethod === 'E-Wallet' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  disabled={isEWalletDisabled}
                  checked={paymentMethod === 'E-Wallet'} 
                  onChange={() => setPaymentMethod('E-Wallet')}
                  className="text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                />
                <div className="flex items-center space-x-2">
                  <CreditCard size={20} className="text-indigo-600" />
                  <div className="text-left">
                    <span className="block text-xs font-bold text-slate-800">E-Wallet Indonesia</span>
                    <span className="block text-[10px] text-slate-400">OVO, GoPay (Scan QR)</span>
                    {isEWalletDisabled && (
                      <span className="block text-[9px] text-rose-600 font-semibold mt-0.5">Tidak tersedia untuk total &ge; Rp 40jt</span>
                    )}
                  </div>
                </div>
              </label>

            </div>

            {/* QRIS Display Section */}
            {paymentMethod === 'QRIS' && paymentSettings['QRIS']?.qris_image_path && (
              <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-fade-in">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <QrCode size={18} className="text-purple-600" />
                    <h3 className="font-bold text-slate-800">Scan Kode QRIS</h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Gunakan aplikasi e-wallet favorit Anda (OVO, GoPay, Dana, LinkAja, dll) untuk scan kode QRIS berikut:
                  </p>
                  <div className="flex justify-center bg-white p-4 rounded-lg border border-purple-100">
                    <img 
                      src={paymentSettings['QRIS'].qris_image_path} 
                      alt="QRIS Code" 
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* E-Wallet Display Section */}
            {paymentMethod === 'E-Wallet' && paymentSettings['E-Wallet'] && (
              <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-fade-in">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Detail Rekening E-Wallet</h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Transfer ke nomor berikut menggunakan aplikasi e-wallet Anda:
                  </p>
                  <div className="space-y-2">
                    {paymentSettings['E-Wallet'].ovo_number && (
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1">📱 OVO</p>
                        <p className="text-base font-mono font-bold text-indigo-600">{paymentSettings['E-Wallet'].ovo_number}</p>
                      </div>
                    )}
                    {paymentSettings['E-Wallet'].gopay_number && (
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1">📱 GoPay</p>
                        <p className="text-base font-mono font-bold text-indigo-600">{paymentSettings['E-Wallet'].gopay_number}</p>
                      </div>
                    )}
                    {!paymentSettings['E-Wallet'].ovo_number && !paymentSettings['E-Wallet'].gopay_number && (
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <p className="text-sm text-slate-600">E-Wallet tersedia untuk OVO, GoPay, Dana, LinkAja, dan e-wallet lainnya</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Sedang Memproses Order...' : (shippingMethod === 'Pembelian di Toko' ? 'Catat & Cetak Pembelian' : 'Buat Pesanan & Bayar')}</span>
            <ArrowRight size={16} />
          </button>

        </form>

        {/* ORDER REVIEW SIDEBAR (Right Column) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6 self-start">
          <h3 className="font-extrabold text-slate-800 text-sm">Review Belanja</h3>
          
          {/* Voucher promo card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-700 text-xs flex items-center space-x-1.5">
              <Ticket size={14} className="text-indigo-500" />
              <span>Kode Voucher Promo</span>
            </h4>

            {activeVoucher ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between text-emerald-800">
                <div className="text-[10px]">
                  <span className="font-extrabold block">Voucher Terpasang:</span>
                  <span className="font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold uppercase">{activeVoucher.code}</span>
                  <span className="block mt-0.5">Diskon: {activeVoucher.discount_percent > 0 ? `${activeVoucher.discount_percent}%` : `Rp ${parseFloat(activeVoucher.discount_amount).toLocaleString('id-ID')}`}</span>
                </div>
                <button 
                  type="button"
                  onClick={removeVoucher}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-100 px-2 py-1 rounded"
                >
                  Batal
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyVoucher} className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Contoh: NEWUSER10" 
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="flex-grow bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button 
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg"
                >
                  Pakai
                </button>
              </form>
            )}

            {voucherError && (
              <div className="bg-rose-50 border-l-2 border-rose-500 p-2 rounded text-rose-700 text-[10px] flex items-center space-x-1.5">
                <AlertCircle size={12} className="shrink-0" />
                <span>{voucherError}</span>
              </div>
            )}

            {voucherSuccess && (
              <div className="bg-emerald-50 border-l-2 border-emerald-500 p-2 rounded text-emerald-700 text-[10px] flex items-center space-x-1.5">
                <CheckCircle2 size={12} className="shrink-0" />
                <span>{voucherSuccess}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 border-b border-slate-50 pb-4">
            {checkoutItems.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between text-xs gap-3">
                <div className="flex items-center space-x-2">
                  <div className="relative w-8 h-8 bg-slate-50 rounded overflow-hidden flex items-center justify-center shrink-0 border">
                    {item.product.image_urls && item.product.image_urls.length > 0 ? (
                      <img 
                        src={item.product.image_urls[0]} 
                        alt={item.product.name} 
                        className="absolute inset-0 w-full h-full object-contain p-0.5"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fb = e.target.parentNode.querySelector('.emoji-fallback');
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="emoji-fallback absolute inset-0 flex items-center justify-center" style={{ display: item.product.image_urls && item.product.image_urls.length > 0 ? 'none' : 'flex' }}>
                      {item.product.category_id === 1 ? '💻' : '⚙️'}
                    </div>
                  </div>
                  <span className="font-semibold text-slate-700 line-clamp-1">{item.product.name}</span>
                </div>
                <div className="text-right shrink-0 text-slate-500">
                  {item.quantity} x Rp {(item.product.price * (1 - (item.product.discount_percent / 100))).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-slate-600 border-b border-slate-50 pb-4">
            <div className="flex justify-between">
              <span>Biaya Pengiriman</span>
              <span className="text-emerald-600 font-extrabold">Gratis Ongkir</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Potongan Promo</span>
                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Total Pembayaran</span>
            <span className="text-brand-600 font-extrabold text-lg">Rp {netTotal.toLocaleString('id-ID')}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[10px] text-slate-500 flex items-start space-x-2 leading-relaxed">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>Pesanan Anda dijamin aman dengan perlindungan garansi resmi toko E-Computer.</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
