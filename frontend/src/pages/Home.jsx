import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../services/api';
import { ShoppingCart, Eye, Heart, RefreshCw, Star, ArrowRight, Zap, Check } from 'lucide-react';

const Home = () => {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, addToCompare, isInCompare, user } = useContext(AppContext);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  // Countdown timer state for Flash Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 30, seconds: 0 });

  const heroBanners = [
    {
      title: "Generasi Baru Intel Core Gen 14",
      subtitle: "Performa Maksimal untuk Gaming & Rendering Tanpa Batas",
      badge: "PROMO BULAN INI",
      image: "💻",
      gradient: "from-brand-600 to-indigo-700",
      link: "/catalog?category=komponen"
    },
    {
      title: "ASUS ROG Zephyrus G14 OLED",
      subtitle: "Laptop Gaming Layar OLED Pertama Terbaik dengan RTX 40-Series",
      badge: "NEW ARRIVAL",
      image: "🎮",
      gradient: "from-slate-800 to-slate-950",
      link: "/product/1"
    },
    {
      title: "Peralatan Gaming Premium",
      subtitle: "Diskon hingga 15% untuk Keyboard, Mouse, & Audio Gaming",
      badge: "FLASH SALE",
      image: "🖱️",
      gradient: "from-indigo-600 to-purple-700",
      link: "/catalog?category=aksesoris"
    }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiCall('/api/products');
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Hero auto-slider loop
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Flash Sale ticking countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          clearInterval(timer);
          return prev;
        }
        let s = prev.seconds - 1;
        let m = prev.minutes;
        let h = prev.hours;

        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter lists
  const bestSellers = products.filter(p => p.is_best_seller);
  const newArrivals = products.filter(p => p.is_new);
  const discountedProducts = products.filter(p => p.discount_percent > 0);

  const handleWishlistToggle = async (product) => {
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const renderProductCard = (product) => {
    const finalPrice = product.price * (1 - (product.discount_percent / 100));
    const isWished = isInWishlist(product.id);
    const isCompared = isInCompare(product.id);

    return (
      <div key={product.id} class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full animate-fade-in">
        {/* Badges and Actions */}
        <div class="relative pt-[75%] bg-slate-50 flex items-center justify-center overflow-hidden">
          
          {/* Main Visual Image */}
          <Link to={`/product/${product.id}`} class="absolute inset-0 z-0">
            {product.image_urls && product.image_urls.length > 0 ? (
              <img 
                src={product.image_urls[0]} 
                alt={product.name} 
                class={`absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300 ${product.stock === 0 ? 'grayscale opacity-60 blur-[2px]' : ''}`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fb = e.target.parentNode.querySelector('.emoji-fallback');
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div class={`emoji-fallback absolute inset-0 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300 ${product.stock === 0 ? 'grayscale opacity-60 blur-[2px]' : ''}`} style={{ display: product.image_urls && product.image_urls.length > 0 ? 'none' : 'flex' }}>
              {product.category_id === 1 ? '💻' : product.category_id === 2 ? '🖥️' : product.category_id === 3 ? '⚙️' : '⌨️'}
            </div>
            
            {/* Overlay Habis */}
            {product.stock === 0 && (
              <div class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <span class="bg-black/80 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs tracking-widest backdrop-blur-sm shadow-xl">STOK HABIS</span>
              </div>
            )}
          </Link>

          {/* Discount Badge */}
          {product.discount_percent > 0 && (
            <span class="absolute top-3 left-3 bg-rose-500 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-sm z-10">
              -{product.discount_percent}%
            </span>
          )}

          {/* Best Seller Badge */}
          {product.is_best_seller && (
            <span class="absolute top-3 left-3 bg-amber-500 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-sm z-10">
              Best Seller
            </span>
          )}

          {/* Action Overlay */}
          <div class="absolute top-3 right-3 flex flex-col space-y-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300 z-10">
            <button 
              onClick={() => handleWishlistToggle(product)}
              class={`p-2 rounded-full shadow-md border focus:outline-none transition-all ${isWished ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-white text-slate-400 hover:text-rose-500 border-slate-100'}`}
              title="Tambah ke Wishlist"
            >
              <Heart size={16} fill={isWished ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={() => addToCompare(product)}
              class={`p-2 rounded-full shadow-md border focus:outline-none transition-all ${isCompared ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-slate-400 hover:text-indigo-600 border-slate-100'}`}
              title="Bandingkan Produk"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Content Info */}
        <div class="p-5 flex-grow flex flex-col justify-between">
          <div>
            <div class="text-xs text-slate-400 font-semibold mb-1">{product.brand}</div>
            <Link to={`/product/${product.id}`} class="text-slate-800 hover:text-brand-600 font-bold text-sm line-clamp-2 leading-tight transition-colors mb-2">
              {product.name}
            </Link>
            
            {/* Spec tags */}
            {(product.spec_ram || product.spec_cpu) && (
              <div class="flex flex-wrap gap-1 mb-3">
                {product.spec_ram && <span class="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded">{product.spec_ram}</span>}
                {product.spec_gpu && <span class="bg-indigo-50 text-indigo-600 text-[10px] font-medium px-2 py-0.5 rounded truncate max-w-[120px]">{product.spec_gpu}</span>}
              </div>
            )}
          </div>

          {/* Pricing & Add to Cart */}
          <div class="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
            <div class="flex flex-col">
              {product.discount_percent > 0 && (
                <span class="text-xs text-slate-400 line-through">Rp {product.price.toLocaleString('id-ID')}</span>
              )}
              <span class="text-brand-600 font-extrabold text-base">
                Rp {finalPrice.toLocaleString('id-ID')}
              </span>
            </div>
            
            <button
              onClick={() => addToCart(product, 1)}
              disabled={product.stock === 0}
              class="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-xl focus:outline-none transition-colors disabled:opacity-50"
              title={product.stock === 0 ? "Habis" : "Tambah ke Keranjang"}
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div class="space-y-16 pb-20">
      
      {/* 1. Hero Promo Banner Slider */}
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class={`relative rounded-3xl bg-gradient-to-r ${heroBanners[heroIndex].gradient} text-white overflow-hidden shadow-xl min-h-[380px] flex items-center transition-all duration-500`}>
          <div class="absolute inset-0 bg-black/10 z-0"></div>
          
          <div class="relative z-10 px-8 py-12 max-w-lg space-y-6 animate-slide-up">
            <span class="bg-white/20 text-white text-[11px] font-extrabold tracking-widest uppercase px-3 py-1.5 rounded-full backdrop-blur-sm">
              {heroBanners[heroIndex].badge}
            </span>
            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {heroBanners[heroIndex].title}
            </h1>
            <p class="text-white/80 text-sm sm:text-base leading-relaxed">
              {heroBanners[heroIndex].subtitle}
            </p>
            <div class="pt-4 flex items-center space-x-4">
              <Link 
                to={heroBanners[heroIndex].link} 
                class="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-6 py-3 rounded-full flex items-center space-x-2 text-sm shadow-md hover:shadow-lg transition-all"
              >
                <span>Mulai Belanja</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Large floating indicator */}
          <div class="absolute right-12 bottom-6 text-[180px] opacity-20 pointer-events-none select-none hidden lg:block">
            {heroBanners[heroIndex].image}
          </div>

          {/* Carousel dots */}
          <div class="absolute bottom-6 left-8 flex space-x-2 z-10">
            {heroBanners.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setHeroIndex(idx)}
                class={`h-2.5 rounded-full transition-all duration-300 ${heroIndex === idx ? 'w-8 bg-white' : 'w-2.5 bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Categories Quick Links */}
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-xl mx-auto mb-8">
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Kategori Produk</h2>
          <p class="text-slate-500 text-sm mt-1">Telusuri koleksi terbaik kami berdasarkan kebutuhan Anda</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Laptop", slug: "laptop", emoji: "💻", color: "bg-blue-50 border-blue-100 hover:bg-blue-100 text-blue-700" },
            { name: "Desktop PC", slug: "komputer-desktop", emoji: "🖥️", color: "bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-700" },
            { name: "Komponen PC", slug: "komponen", emoji: "⚙️", color: "bg-purple-50 border-purple-100 hover:bg-purple-100 text-purple-700" },
            { name: "Aksesoris", slug: "aksesoris", emoji: "⌨️", color: "bg-amber-50 border-amber-100 hover:bg-amber-100 text-amber-700" }
          ].map((cat, i) => (
            <Link 
              key={i}
              to={`/catalog?category=${cat.slug}`}
              class={`border rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center ${cat.color}`}
            >
              <span class="text-4xl mb-3">{cat.emoji}</span>
              <span class="font-bold text-sm">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Flash Sale Section with Countdown */}
      {discountedProducts.length > 0 && (
        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-8 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
            <div class="flex items-center space-x-4">
              <div class="bg-white/20 p-3 rounded-full animate-bounce">
                <Zap size={32} class="text-yellow-300" fill="currentColor" />
              </div>
              <div>
                <h3 class="text-xl sm:text-2xl font-extrabold tracking-tight">Flash Sale Terbatas!</h3>
                <p class="text-white/80 text-sm mt-0.5">Dapatkan penawaran harga terbaik untuk aksesoris & komputer pilihan</p>
              </div>
            </div>
            {/* Clock Countdown */}
            <div class="flex items-center space-x-3 bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-sm">
              <span class="text-xs uppercase tracking-wider font-extrabold text-rose-100">Sisa waktu:</span>
              <div class="flex space-x-2 text-slate-900">
                <span class="bg-white font-extrabold text-sm px-3 py-1.5 rounded-lg shadow-sm">
                  {timeLeft.hours.toString().padStart(2, '0')}h
                </span>
                <span class="text-white font-bold">:</span>
                <span class="bg-white font-extrabold text-sm px-3 py-1.5 rounded-lg shadow-sm">
                  {timeLeft.minutes.toString().padStart(2, '0')}m
                </span>
                <span class="text-white font-bold">:</span>
                <span class="bg-white font-extrabold text-sm px-3 py-1.5 rounded-lg shadow-sm text-rose-600 animate-pulse">
                  {timeLeft.seconds.toString().padStart(2, '0')}s
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            {discountedProducts.slice(0, 4).map(product => renderProductCard(product))}
          </div>
        </section>
      )}

      {/* 4. Best Sellers Section */}
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Best Seller</h2>
            <p class="text-slate-500 text-sm mt-0.5">Produk favorit dan paling laris dibeli oleh customer</p>
          </div>
          <Link to="/catalog?isBestSeller=true" class="text-brand-600 hover:text-brand-700 font-semibold text-sm flex items-center space-x-1 transition-all hover:translate-x-1">
            <span>Lihat Semua</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} class="animate-pulse bg-white rounded-2xl h-80 border border-slate-100" />
            ))}
          </div>
        ) : (
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellers.slice(0, 4).map(product => renderProductCard(product))}
          </div>
        )}
      </section>

      {/* 5. New Arrivals Section */}
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Produk Terbaru</h2>
            <p class="text-slate-500 text-sm mt-0.5">Koleksi ter-update untuk menunjang teknologi harian Anda</p>
          </div>
          <Link to="/catalog?isNew=true" class="text-brand-600 hover:text-brand-700 font-semibold text-sm flex items-center space-x-1 transition-all hover:translate-x-1">
            <span>Lihat Semua</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} class="animate-pulse bg-white rounded-2xl h-80 border border-slate-100" />
            ))}
          </div>
        ) : (
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.slice(0, 4).map(product => renderProductCard(product))}
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;
