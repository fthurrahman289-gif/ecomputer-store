import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShoppingCart, Trash2, Heart, ExternalLink } from 'lucide-react';

const Wishlist = () => {
  const { wishlist, fetchWishlist, removeFromWishlist, addToCart, user } = useContext(AppContext);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  if (!user) {
    return (
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-slide-up">
        <span class="text-6xl">🔒</span>
        <h2 class="text-2xl font-bold text-slate-800 mt-4">Akses Terbatas</h2>
        <p class="text-slate-500 mt-1 mb-8">Silakan login untuk menyimpan dan melihat produk favorit Anda.</p>
        <Link to="/login" class="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-full shadow-md">
          Login Sekarang
        </Link>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-slide-up">
        <span class="text-6xl flex justify-center mb-4">❤️</span>
        <h2 class="text-2xl font-bold text-slate-800 mt-4">Wishlist Anda Kosong</h2>
        <p class="text-slate-500 mt-1 mb-8">Simpan produk-produk yang Anda minati di katalog untuk membelinya nanti.</p>
        <Link to="/catalog" class="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-full shadow-md">
          Belanja Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight border-b border-slate-100 pb-6 mb-8 flex items-center space-x-2">
        <Heart size={28} class="text-rose-500 fill-rose-500" />
        <span>Wishlist Saya</span>
      </h1>

      {/* Grid List */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        {wishlist.map((prod) => {
          const finalPrice = prod.price * (1 - (prod.discount_percent / 100));
          return (
            <div key={prod.id} class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full group">
              
              {/* Product Visual Area */}
              <div class="relative pt-[75%] bg-slate-50 flex items-center justify-center overflow-hidden">
                <div class="absolute inset-0 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-300">
                  {prod.category_id === 1 ? '💻' : prod.category_id === 2 ? '🖥️' : prod.category_id === 3 ? '⚙️' : '⌨️'}
                </div>
                
                {/* Delete button from wishlist overlay */}
                <button 
                  onClick={() => removeFromWishlist(prod.id)}
                  class="absolute top-3 right-3 p-2 bg-white text-slate-400 hover:text-rose-500 border border-slate-100 rounded-full shadow-sm focus:outline-none transition-colors"
                  title="Hapus dari Wishlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Description Info */}
              <div class="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{prod.brand}</span>
                  <Link to={`/product/${prod.id}`} class="text-slate-800 hover:text-brand-600 font-extrabold text-xs line-clamp-2 mt-1 leading-snug flex items-center justify-between gap-1">
                    <span>{prod.name}</span>
                    <ExternalLink size={12} class="text-slate-300 shrink-0" />
                  </Link>
                </div>

                <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div class="flex flex-col">
                    {prod.discount_percent > 0 && (
                      <span class="text-[10px] text-slate-400 line-through">Rp {prod.price.toLocaleString('id-ID')}</span>
                    )}
                    <span class="text-brand-600 font-extrabold text-xs sm:text-sm">
                      Rp {finalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(prod, 1)}
                    disabled={prod.stock === 0}
                    class="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-xl focus:outline-none transition-colors disabled:opacity-50"
                    title="Tambah ke Keranjang"
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Wishlist;
