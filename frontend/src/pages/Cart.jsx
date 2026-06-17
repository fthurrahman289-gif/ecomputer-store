import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../services/api';
import { Trash2, ShoppingBag, Plus, Minus, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, getCartTotal, user } = useContext(AppContext);
  const navigate = useNavigate();

  const cartTotal = getCartTotal();
  const netTotal = cartTotal;

  const handleCheckoutRedirect = () => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk melakukan checkout');
      navigate('/login');
      return;
    }
    
    // Pass cart totals to checkout state
    navigate('/checkout', {
      state: {
        cartTotal
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
                  <div class="relative w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center text-4xl shrink-0 border border-slate-100">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img 
                        src={product.image_urls[0]} 
                        alt={product.name} 
                        class="absolute inset-0 w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fb = e.target.parentNode.querySelector('.emoji-fallback');
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div class="emoji-fallback absolute inset-0 flex items-center justify-center text-3xl" style={{ display: product.image_urls && product.image_urls.length > 0 ? 'none' : 'flex' }}>
                      {product.category_id === 1 ? '💻' : product.category_id === 2 ? '🖥️' : product.category_id === 3 ? '⚙️' : '⌨️'}
                    </div>
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
