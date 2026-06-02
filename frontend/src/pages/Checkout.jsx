import React, { useContext, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../services/api';
import { CreditCard, Landmark, Truck, Phone, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, clearCart, user } = useContext(AppContext);

  // Retrieve values passed from Cart page
  const { voucherCode, discountAmount, netTotal } = location.state || {
    voucherCode: null,
    discountAmount: 0,
    netTotal: 0
  };

  const [address, setAddress] = useState(user ? user.address || '' : '');
  const [phone, setPhone] = useState(user ? user.phone || '' : '');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Safeguard: Redirect back to Cart if cart is empty or loaded directly
  if (cart.length === 0 || netTotal === 0) {
    return (
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 class="text-xl font-bold text-slate-800">Keranjang Belanja Anda Kosong</h2>
        <Link to="/cart" class="text-brand-600 font-semibold underline mt-2 block">Kembali ke Keranjang</Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const items = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    try {
      const response = await apiCall('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items,
          voucherCode,
          address,
          phone,
          paymentMethod
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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight border-b border-slate-100 pb-6 mb-8">
        Checkout Pembayaran
      </h1>

      {error && (
        <div class="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg mb-6 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CHECKOUT FORM (Left/Middle Columns) */}
        <form onSubmit={handleSubmitOrder} class="lg:col-span-2 space-y-6">
          
          {/* Shipping Details */}
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 class="text-base font-extrabold text-slate-800 flex items-center space-x-2">
              <Truck size={18} class="text-brand-500" />
              <span>Detail Alamat Pengiriman</span>
            </h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Penerima</label>
                <input 
                  type="text" 
                  value={user ? user.name : ''} 
                  disabled 
                  class="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Nomor Telepon / WhatsApp</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16} />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Alamat Lengkap</label>
                <div class="relative">
                  <div class="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-slate-400">
                    <MapPin size={16} />
                  </div>
                  <textarea 
                    required
                    rows={3}
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Tulis alamat rumah lengkap RT/RW, Kecamatan, Kota, Kode Pos..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 class="text-base font-extrabold text-slate-800 flex items-center space-x-2">
              <Landmark size={18} class="text-indigo-500" />
              <span>Metode Pembayaran</span>
            </h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option Bank */}
              <label class={`border rounded-2xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${paymentMethod === 'Transfer Bank' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'Transfer Bank'} 
                  onChange={() => setPaymentMethod('Transfer Bank')}
                  class="text-brand-600 focus:ring-brand-500"
                />
                <div class="flex items-center space-x-2">
                  <Landmark size={20} class="text-brand-600" />
                  <div class="text-left">
                    <span class="block text-xs font-bold text-slate-800">Transfer Bank Manual</span>
                    <span class="block text-[10px] text-slate-400">BCA, Mandiri (Konfirmasi Cepat)</span>
                  </div>
                </div>
              </label>

              {/* Option E-Wallet */}
              <label class={`border rounded-2xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${paymentMethod === 'E-Wallet' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'E-Wallet'} 
                  onChange={() => setPaymentMethod('E-Wallet')}
                  class="text-brand-600 focus:ring-brand-500"
                />
                <div class="flex items-center space-x-2">
                  <CreditCard size={20} class="text-indigo-600" />
                  <div class="text-left">
                    <span class="block text-xs font-bold text-slate-800">E-Wallet Indonesia</span>
                    <span class="block text-[10px] text-slate-400">OVO, GoPay (Scan QR)</span>
                  </div>
                </div>
              </label>

            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Sedang Memproses Order...' : 'Buat Pesanan & Bayar'}</span>
            <ArrowRight size={16} />
          </button>

        </form>

        {/* ORDER REVIEW SIDEBAR (Right Column) */}
        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6 self-start">
          <h3 class="font-extrabold text-slate-800 text-sm">Review Belanja</h3>
          
          <div class="space-y-4 max-h-60 overflow-y-auto pr-2 border-b border-slate-50 pb-4">
            {cart.map((item) => (
              <div key={item.product.id} class="flex items-center justify-between text-xs gap-3">
                <div class="flex items-center space-x-2">
                  <div class="w-8 h-8 bg-slate-50 rounded flex items-center justify-center shrink-0 border">
                    {item.product.category_id === 1 ? '💻' : '⚙️'}
                  </div>
                  <span class="font-semibold text-slate-700 line-clamp-1">{item.product.name}</span>
                </div>
                <div class="text-right shrink-0 text-slate-500">
                  {item.quantity} x Rp {(item.product.price * (1 - (item.product.discount_percent / 100))).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          <div class="space-y-2 text-xs text-slate-600 border-b border-slate-50 pb-4">
            <div class="flex justify-between">
              <span>Biaya Pengiriman</span>
              <span class="text-emerald-600 font-extrabold">Gratis Ongkir</span>
            </div>
            {discountAmount > 0 && (
              <div class="flex justify-between text-rose-600">
                <span>Potongan Promo</span>
                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          <div class="flex justify-between items-center">
            <span class="text-sm font-bold text-slate-800">Total Pembayaran</span>
            <span class="text-brand-600 font-extrabold text-lg">Rp {netTotal.toLocaleString('id-ID')}</span>
          </div>

          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[10px] text-slate-500 flex items-start space-x-2 leading-relaxed">
            <ShieldCheck size={16} class="text-emerald-500 shrink-0 mt-0.5" />
            <span>Pesanan Anda dijamin aman dengan perlindungan garansi resmi toko E-Computer.</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
