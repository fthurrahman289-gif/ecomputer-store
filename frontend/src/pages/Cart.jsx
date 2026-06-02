import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../services/api';
import { Trash2, ShoppingBag, Plus, Minus, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, getCartTotal, user } = useContext(AppContext);
  const navigate = useNavigate();

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [activeVoucher, setActiveVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');

  const cartTotal = getCartTotal();

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

  const handleCheckoutRedirect = () => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk melakukan checkout');
      navigate('/login');
      return;
    }
    
    // Pass cart totals and voucher code to checkout state
    navigate('/checkout', {
      state: {
        voucherCode: activeVoucher ? activeVoucher.code : null,
        discountAmount,
        netTotal
      }
    });
  };

  if (cart.length === 0) {
    return (
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-slide-up">
        <span class="text-6xl">🛒</span>
        <h2 class="text-2xl font-bold text-slate-800 mt-4">Keranjang Belanja Kosong</h2>
        <p class="text-slate-500 mt-1 mb-8">Anda belum menambahkan produk apa pun ke keranjang.</p>
        <Link to="/catalog" class="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-full shadow-md transition-all">
          Belanja Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight border-b border-slate-100 pb-6 mb-8">
        Keranjang Belanja
      </h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LIST OF CART ITEMS (Left Column) */}
        <div class="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const product = item.product;
            const finalPrice = product.price * (1 - (product.discount_percent / 100));
            const subtotal = finalPrice * item.quantity;

            return (
              <div key={product.id} class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Visual Image representation */}
                <div class="flex items-center space-x-4 w-full sm:w-auto">
                  <div class="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-4xl shrink-0 border border-slate-100">
                    {product.category_id === 1 ? '💻' : product.category_id === 2 ? '🖥️' : product.category_id === 3 ? '⚙️' : '⌨️'}
                  </div>
                  <div>
                    <h3 class="text-slate-800 font-bold text-sm line-clamp-1">{product.name}</h3>
                    <p class="text-xs text-slate-400">Brand: {product.brand}</p>
                    <p class="text-xs text-brand-600 font-extrabold mt-1">Rp {finalPrice.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {/* Quantity Control & Subtotal */}
                <div class="flex items-center justify-between w-full sm:w-auto gap-8">
                  
                  {/* Plus Minus */}
                  <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button 
                      onClick={() => updateCartQuantity(product.id, item.quantity - 1)}
                      class="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span class="px-3 text-xs font-extrabold text-slate-800">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(product.id, item.quantity + 1)}
                      class="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div class="text-right shrink-0">
                    <span class="text-slate-400 text-[10px] block uppercase font-bold">Subtotal</span>
                    <span class="text-slate-800 font-extrabold text-sm">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCart(product.id)}
                    class="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    title="Hapus Produk"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>

              </div>
            );
          })}
        </div>

        {/* ORDER SUMMARY & VOUCHERS (Right Column) */}
        <div class="space-y-6">
          
          {/* Voucher promo card */}
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 class="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
              <Ticket size={18} class="text-indigo-500" />
              <span>Kode Voucher Promo</span>
            </h3>

            {activeVoucher ? (
              <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between text-emerald-800">
                <div class="text-xs">
                  <span class="font-extrabold block">Voucher Terpasang:</span>
                  <span class="font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold text-xs uppercase">{activeVoucher.code}</span>
                  <span class="block mt-1">Diskon: {activeVoucher.discount_percent > 0 ? `${activeVoucher.discount_percent}%` : `Rp ${parseFloat(activeVoucher.discount_amount).toLocaleString('id-ID')}`}</span>
                </div>
                <button 
                  onClick={removeVoucher}
                  class="text-xs font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-100 px-2 py-1 rounded"
                >
                  Batal
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyVoucher} class="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Contoh: NEWUSER10" 
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button 
                  type="submit"
                  class="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-4 py-2 rounded-xl"
                >
                  Pakai
                </button>
              </form>
            )}

            {voucherError && (
              <div class="bg-rose-50 border-l-3 border-rose-500 p-2.5 rounded text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle size={14} class="shrink-0" />
                <span>{voucherError}</span>
              </div>
            )}

            {voucherSuccess && (
              <div class="bg-emerald-50 border-l-3 border-emerald-500 p-2.5 rounded text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle2 size={14} class="shrink-0" />
                <span>{voucherSuccess}</span>
              </div>
            )}
          </div>

          {/* Pricing summary card */}
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 class="font-extrabold text-slate-800 text-sm">Ringkasan Belanja</h3>
            
            <div class="space-y-2.5 text-xs text-slate-600 border-b border-slate-50 pb-4">
              <div class="flex justify-between">
                <span>Total Item Belanja</span>
                <span class="font-extrabold text-slate-800">{cart.reduce((sum, item) => sum + item.quantity, 0)} Pcs</span>
              </div>
              <div class="flex justify-between">
                <span>Total Harga Produk</span>
                <span class="font-bold text-slate-800">Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
              {discountAmount > 0 && (
                <div class="flex justify-between text-rose-600">
                  <span>Diskon Voucher</span>
                  <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm font-bold text-slate-800">Total Tagihan</span>
              <span class="text-brand-600 font-extrabold text-xl">Rp {netTotal.toLocaleString('id-ID')}</span>
            </div>

            <button
              onClick={handleCheckoutRedirect}
              class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center space-x-2"
            >
              <ShoppingBag size={16} />
              <span>Lanjut ke Checkout</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Cart;
