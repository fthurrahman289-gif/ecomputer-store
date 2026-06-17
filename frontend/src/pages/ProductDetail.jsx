import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../services/api';
import { ShoppingCart, Heart, RefreshCw, Star, Info, ChevronRight, ArrowLeft, MessageCircle } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, addToCompare, isInCompare } = useContext(AppContext);

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' or 'reviews'
  const [csWhatsapp, setCsWhatsapp] = useState('');

  // Load CS WhatsApp settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await apiCall('/api/settings', {}, 'GET');
        if (data.cs_whatsapp) {
          setCsWhatsapp(data.cs_whatsapp);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Fetch product detail
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await apiCall(`/api/products/${id}`);
        const product = data.product;
        
        // Parse image_urls - could be string (JSON) or already an array
        if (product.image_urls) {
          if (typeof product.image_urls === 'string') {
            try {
              product.image_urls = JSON.parse(product.image_urls);
            } catch (e) {
              // If JSON parse fails, wrap in array
              product.image_urls = [product.image_urls];
            }
          }
          // Ensure it's an array
          if (!Array.isArray(product.image_urls)) {
            product.image_urls = [product.image_urls];
          }
        } else {
          product.image_urls = [];
        }
        
        setProduct(product);
        setRecommendations(data.recommendations);
        if (product.image_urls && product.image_urls.length > 0) {
          setActiveImage(product.image_urls[0]);
        }
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    // Scroll to top on id change
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-pulse">
        <div className="h-96 bg-white border border-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <span className="text-6xl">⚠️</span>
        <h2 className="text-2xl font-bold text-slate-800 mt-4">Produk Tidak Ditemukan</h2>
        <p className="text-slate-500 mt-1 mb-6">Produk yang Anda cari tidak terdaftar di sistem kami.</p>
        <Link to="/catalog" className="bg-brand-600 text-white px-6 py-3 rounded-full font-semibold">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const finalPrice = product.price * (1 - (product.discount_percent / 100));
  const isWished = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  const handleWishlistToggle = async () => {
    try {
      if (isWished) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCheckoutNow = () => {
    // Calculate the total for just this product
    const finalPrice = product.price * (1 - (product.discount_percent / 100));
    const checkoutTotal = finalPrice * quantity;

    // Navigate to checkout with product data
    navigate('/checkout', { 
      state: { 
        cartTotal: checkoutTotal,
        quickCheckout: {
          product: product,
          quantity: quantity,
          total: checkoutTotal
        }
      } 
    });
  };

  // Mock Reviews
  const mockReviews = [
    { name: "Andi Wijaya", rating: 5, date: "2026-05-15", comment: "Barang bagus banget! Pengiriman super cepat dan packing kayu sangat aman. Recommended seller." },
    { name: "Siti Rahma", rating: 4, date: "2026-05-10", comment: "Sesuai deskripsi, performa laptop mantap untuk rendering AutoCAD. Hanya saja kipas agak bising saat full load." }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

      {/* Breadcrumb / Back button */}
      <div className="flex items-center space-x-2 text-slate-500 text-sm">
        <Link to="/catalog" className="hover:text-brand-600 flex items-center space-x-1">
          <ArrowLeft size={16} />
          <span>Katalog</span>
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-800 font-semibold truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Main product wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">

        {/* LEFT COLUMN - Gallery */}
        <div className="space-y-4">
          {/* Main Showcase Image */}
          <div className="relative bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden aspect-video flex items-center justify-center group cursor-zoom-in">
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className={`absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ${product.stock === 0 ? 'grayscale opacity-60 blur-[4px]' : ''}`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fb = e.target.parentNode.querySelector('.emoji-fallback');
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`emoji-fallback absolute inset-0 flex items-center justify-center text-[120px] group-hover:scale-110 transition-transform duration-300 ${product.stock === 0 ? 'grayscale opacity-60 blur-[4px]' : ''}`} style={{ display: activeImage ? 'none' : 'flex' }}>
              {product.category_id === 1 ? '💻' : product.category_id === 2 ? '🖥️' : product.category_id === 3 ? '⚙️' : '⌨️'}
            </div>

            {product.stock === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <span className="bg-black/80 text-white font-extrabold px-6 py-3 rounded-2xl text-lg tracking-widest backdrop-blur-sm shadow-xl">STOK HABIS</span>
              </div>
            )}

            {product.discount_percent > 0 && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-full">
                Diskon -{product.discount_percent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          <div className="flex flex-wrap gap-3">
            {product.image_urls.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`relative w-20 h-20 bg-slate-50 border rounded-xl flex items-center justify-center overflow-hidden focus:outline-none transition-all ${activeImage === img ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-brand-300'}`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="object-contain w-full h-full p-1"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fb = e.target.parentNode.querySelector('.emoji-fallback');
                    if (fb) fb.style.display = 'flex';
                  }}
                />
                <div className="emoji-fallback hidden absolute inset-0 flex items-center justify-center text-2xl">
                  {product.category_id === 1 ? '💻' : product.category_id === 2 ? '🖥️' : product.category_id === 3 ? '⚙️' : '⌨️'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN - Spec purchase */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">

            {/* Brand and Stock */}
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Brand: {product.brand}</span>
              <span className={product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {product.stock > 0 ? `Stok Tersedia (${product.stock})` : 'Stok Habis'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center space-x-2">
              <div className="flex text-amber-400">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" className="text-slate-200" />
              </div>
              <span className="text-xs text-slate-500">(4.5/5 dari 2 review)</span>
            </div>

            {/* Price section */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col space-y-1">
              {product.discount_percent > 0 && (
                <span className="text-sm text-slate-400 line-through">Rp {product.price.toLocaleString('id-ID')}</span>
              )}
              <span className="text-brand-600 font-extrabold text-2xl sm:text-3xl">
                Rp {finalPrice.toLocaleString('id-ID')}
              </span>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              {product.description || "Tidak ada deskripsi untuk produk ini."}
            </p>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-100">
            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-semibold text-slate-700">Jumlah:</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-extrabold text-slate-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* CTA Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {csWhatsapp && (
                <a
                  href={`https://wa.me/${csWhatsapp}?text=Halo,%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold py-3.5 px-4 rounded-xl border border-emerald-200 focus:outline-none transition-colors"
                  title="Kirim Pesan"
                >
                  <MessageCircle size={18} />
                </a>
              )}

              <button
                onClick={() => addToCart(product, quantity)}
                disabled={product.stock === 0}
                className="flex-grow flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 px-4 rounded-xl border border-slate-200 focus:outline-none transition-colors disabled:opacity-50"
              >
                <ShoppingCart size={18} />
                <span>Keranjang</span>
              </button>

              <button
                onClick={handleCheckoutNow}
                disabled={product.stock === 0}
                className="flex-grow flex items-center justify-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg focus:outline-none transition-all disabled:opacity-50"
              >
                Checkout
              </button>
            </div>

            {/* Quick Actions (Wishlist & Compare) */}
            <div className="flex justify-around items-center pt-2 text-slate-500 text-xs font-semibold">
              <button onClick={handleWishlistToggle} className="flex items-center space-x-2 hover:text-rose-500 transition-colors">
                <Heart size={16} fill={isWished ? "#f43f5e" : "none"} className={isWished ? 'text-rose-500' : ''} />
                <span>{isWished ? 'Hapus Wishlist' : 'Tambah ke Wishlist'}</span>
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <button onClick={() => addToCompare(product)} className="flex items-center space-x-2 hover:text-indigo-600 transition-colors">
                <RefreshCw size={16} className={isCompared ? 'text-indigo-600' : ''} />
                <span>{isCompared ? 'Produk Dibandingkan' : 'Bandingkan Spesifikasi'}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Tabs - Specification and Reviews */}
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="border-b border-slate-100 bg-slate-50 flex">
          <button
            onClick={() => setActiveTab('specs')}
            class={`px-6 py-4 text-sm font-bold border-b-2 transition-all focus:outline-none ${activeTab === 'specs' ? 'border-brand-500 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Spesifikasi Lengkap
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            class={`px-6 py-4 text-sm font-bold border-b-2 transition-all focus:outline-none ${activeTab === 'reviews' ? 'border-brand-500 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Review Pelanggan ({mockReviews.length})
          </button>
        </div>

        <div class="p-8">
          {activeTab === 'specs' ? (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {[
                { label: 'Prosesor (CPU)', value: product.spec_cpu || '-' },
                { label: 'Kartu Grafis (GPU)', value: product.spec_gpu || '-' },
                { label: 'Kapasitas RAM', value: product.spec_ram || '-' },
                { label: 'Penyimpanan (ROM)', value: product.spec_storage || '-' },
                { label: 'Berat Bersih', value: product.weight ? `${product.weight} kg` : '-' },
                { label: 'Sistem Operasi', value: product.category_id === 1 ? 'Windows 11 Home / macOS' : '-' }
              ].map((spec, i) => (
                <div key={i} class="flex justify-between border-b border-slate-50 py-2.5 text-sm">
                  <span class="text-slate-400 font-semibold">{spec.label}</span>
                  <span class="text-slate-800 font-bold text-right">{spec.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div class="space-y-6">
              {mockReviews.map((rev, i) => (
                <div key={i} class="border-b border-slate-100 pb-6 last:border-0 last:pb-0 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-800 text-sm">{rev.name}</span>
                    <span class="text-xs text-slate-400">{rev.date}</span>
                  </div>
                  <div class="flex text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, r) => (
                      <Star key={r} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p class="text-slate-600 text-xs leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations strip */}
      {recommendations.length > 0 && (
        <section class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-extrabold text-slate-900">Produk Serupa</h3>
            <Link to={`/catalog?category=${product.category_id}`} class="text-brand-600 hover:underline font-bold text-xs">Lihat Kategori</Link>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.map(p => {
              const pFinalPrice = p.price * (1 - (p.discount_percent / 100));
              return (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group h-full"
                >
                  <div class="pt-[75%] bg-slate-50 relative rounded-xl overflow-hidden flex items-center justify-center text-4xl mb-4 group-hover:scale-105 transition-transform duration-300">
                    {p.image_urls && p.image_urls.length > 0 ? (
                      <img
                        src={p.image_urls[0]}
                        alt={p.name}
                        class={`absolute inset-0 w-full h-full object-contain p-2 ${p.stock === 0 ? 'grayscale opacity-60 blur-[2px]' : ''}`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fb = e.target.parentNode.querySelector('.emoji-fallback');
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div class={`emoji-fallback absolute inset-0 flex items-center justify-center ${p.stock === 0 ? 'grayscale opacity-60 blur-[2px]' : ''}`} style={{ display: p.image_urls && p.image_urls.length > 0 ? 'none' : 'flex' }}>
                      {p.category_id === 1 ? '💻' : p.category_id === 2 ? '🖥️' : p.category_id === 3 ? '⚙️' : '⌨️'}
                    </div>

                    {p.stock === 0 && (
                      <div class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <span class="bg-black/80 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] tracking-widest backdrop-blur-sm shadow-xl">STOK HABIS</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-400 font-semibold">{p.brand}</span>
                    <h4 class="text-slate-800 font-bold text-xs line-clamp-1 mb-1 leading-tight">{p.name}</h4>
                    <span class="text-brand-600 font-extrabold text-xs">Rp {pFinalPrice.toLocaleString('id-ID')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProductDetail;
