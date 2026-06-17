import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../services/api';
import { ShoppingCart, Heart, RefreshCw, SlidersHorizontal, Search, RotateCcw, X } from 'lucide-react';

const Catalog = () => {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, addToCompare, isInCompare } = useContext(AppContext);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filter Form States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [gpu, setGpu] = useState('');

  // Watch URL parameters
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // Load Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await apiCall('/api/products/categories');
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch Products based on filters
  const fetchFilteredProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (brand) queryParams.append('brand', brand);
      if (minPrice) queryParams.append('minPrice', minPrice);
      if (maxPrice) queryParams.append('maxPrice', maxPrice);
      if (ram) queryParams.append('ram', ram);
      if (storage) queryParams.append('storage', storage);
      if (gpu) queryParams.append('gpu', gpu);

      // Check for homepage flags
      if (searchParams.get('isNew')) queryParams.append('isNew', 'true');
      if (searchParams.get('isBestSeller')) queryParams.append('isBestSeller', 'true');

      const data = await apiCall(`/api/products?${queryParams.toString()}`);
      
      // Parse image_urls for all products
      const parsedProducts = data.map(product => {
        if (product.image_urls) {
          if (typeof product.image_urls === 'string') {
            try {
              product.image_urls = JSON.parse(product.image_urls);
            } catch (e) {
              product.image_urls = [product.image_urls];
            }
          }
          if (!Array.isArray(product.image_urls)) {
            product.image_urls = [product.image_urls];
          }
        } else {
          product.image_urls = [];
        }
        return product;
      });
      
      setProducts(parsedProducts);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [search, category, brand, minPrice, maxPrice, ram, storage, gpu, searchParams]);

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setRam('');
    setStorage('');
    setGpu('');
    setSearchParams({});
  };

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

  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Info */}
      <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Katalog Produk</h1>
          <p class="text-slate-500 text-sm mt-1">Dapatkan spesifikasi komputer terbaik sesuai selera Anda</p>
        </div>
        
        {/* Buttons */}
        <div class="flex items-center space-x-3 mt-4 md:mt-0">
          <button 
            onClick={() => setIsMobileFiltersOpen(true)}
            class="md:hidden flex items-center space-x-2 border border-slate-200 bg-white px-4 py-2 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            <SlidersHorizontal size={16} />
            <span>Filter</span>
          </button>

          <button 
            onClick={resetFilters}
            class="flex items-center space-x-2 border border-slate-200 bg-white px-4 py-2 rounded-xl text-slate-500 hover:text-brand-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RotateCcw size={16} />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>

      <div class="flex gap-8">
        
        {/* SIDEBAR FILTERS - Desktop */}
        <aside class="hidden md:block w-64 shrink-0 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm self-start space-y-6">
          
          {/* Search inside catalog */}
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 mb-3">Cari Produk</h3>
            <div class="relative">
              <input 
                type="text" 
                placeholder="Ketik kata kunci..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Search size={14} class="absolute right-3 top-3 text-slate-400" />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 mb-3">Kategori</h3>
            <div class="space-y-2">
              <label class="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                <input 
                  type="radio" 
                  checked={category === ''} 
                  onChange={() => setCategory('')} 
                  class="text-brand-600 focus:ring-brand-500" 
                />
                <span class={category === '' ? 'text-brand-600' : 'text-slate-600'}>Semua Kategori</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.id} class="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                  <input 
                    type="radio" 
                    checked={category === cat.slug || category === String(cat.id)} 
                    onChange={() => setCategory(cat.slug)} 
                    class="text-brand-600 focus:ring-brand-500" 
                  />
                  <span class={category === cat.slug || category === String(cat.id) ? 'text-brand-600 font-bold' : 'text-slate-600'}>
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 mb-3">Brand / Merk</h3>
            <select 
              value={brand} 
              onChange={(e) => setBrand(e.target.value)}
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Semua Brand</option>
              <option value="ASUS">ASUS</option>
              <option value="Lenovo">Lenovo</option>
              <option value="Apple">Apple</option>
              <option value="HP">HP</option>
              <option value="MSI">MSI</option>
              <option value="Logitech">Logitech</option>
              <option value="Corsair">Corsair</option>
              <option value="Keychron">Keychron</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 mb-3">Rentang Harga (Rp)</h3>
            <div class="space-y-2">
              <input 
                type="number" 
                placeholder="Min Harga" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)}
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input 
                type="number" 
                placeholder="Max Harga" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)}
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Specification Filters */}
          <div class="border-t border-slate-100 pt-4 space-y-4">
            <h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Spesifikasi</h4>
            
            {/* RAM Filter */}
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">RAM</label>
              <select 
                value={ram} 
                onChange={(e) => setRam(e.target.value)}
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Semua RAM</option>
                <option value="8GB">8GB</option>
                <option value="16GB">16GB</option>
                <option value="32GB">32GB</option>
              </select>
            </div>

            {/* Storage Filter */}
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">Penyimpanan</label>
              <select 
                value={storage} 
                onChange={(e) => setStorage(e.target.value)}
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Semua Storage</option>
                <option value="256GB">256GB SSD</option>
                <option value="512GB">512GB SSD</option>
                <option value="1TB">1TB SSD</option>
                <option value="2TB">2TB SSD</option>
              </select>
            </div>

            {/* GPU Filter */}
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">GPU / Grafis</label>
              <select 
                value={gpu} 
                onChange={(e) => setGpu(e.target.value)}
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Semua GPU</option>
                <option value="RTX 4060">RTX 4060</option>
                <option value="RTX 4070">RTX 4070</option>
                <option value="Iris Xe">Intel Iris Xe</option>
                <option value="Apple M3">Apple GPU</option>
              </select>
            </div>
          </div>

        </aside>

        {/* PRODUCTS GRID */}
        <div class="flex-grow">
          {loading ? (
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} class="animate-pulse bg-white border border-slate-100 rounded-2xl h-80" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div class="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
              <span class="text-5xl">🔍</span>
              <h3 class="text-lg font-bold text-slate-800 mt-4">Produk Tidak Ditemukan</h3>
              <p class="text-slate-500 text-sm mt-1 mb-6">Coba ganti filter atau kata kunci pencarian Anda.</p>
              <button 
                onClick={resetFilters} 
                class="bg-brand-600 text-white font-semibold text-xs px-5 py-3 rounded-full hover:bg-brand-700 transition-colors"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => {
                const finalPrice = product.price * (1 - (product.discount_percent / 100));
                const isWished = isInWishlist(product.id);
                const isCompared = isInCompare(product.id);

                return (
                  <div key={product.id} class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between h-full">
                    
                    {/* Image Area */}
                    <div class="relative pt-[70%] bg-slate-50 overflow-hidden flex items-center justify-center">
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
                        <div class={`emoji-fallback absolute inset-0 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300 ${product.stock === 0 ? 'grayscale opacity-60 blur-[2px]' : ''}`} style={{ display: product.image_urls && product.image_urls.length > 0 ? 'none' : 'flex' }}>
                          {product.category_id === 1 ? '💻' : product.category_id === 2 ? '🖥️' : product.category_id === 3 ? '⚙️' : '⌨️'}
                        </div>
                        
                        {/* Overlay Habis */}
                        {product.stock === 0 && (
                          <div class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <span class="bg-black/80 text-white font-extrabold px-4 py-2 rounded-lg text-sm tracking-widest backdrop-blur-sm shadow-xl">STOK HABIS</span>
                          </div>
                        )}
                      </Link>
                      
                      {/* Overlay badges */}
                      {product.discount_percent > 0 && (
                        <span class="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10 pointer-events-none">
                          -{product.discount_percent}%
                        </span>
                      )}

                      {/* Action buttons */}
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

                    {/* Description Area */}
                    <div class="p-5 flex-grow flex flex-col justify-between">
                      <div class="space-y-1">
                        <div class="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">{product.brand}</div>
                        <Link to={`/product/${product.id}`} class="text-slate-800 hover:text-brand-600 font-extrabold text-sm line-clamp-2 leading-tight transition-colors">
                          {product.name}
                        </Link>
                        
                        {/* Specs display */}
                        {(product.spec_ram || product.spec_cpu) && (
                          <div class="flex flex-wrap gap-1 pt-1">
                            {product.spec_ram && <span class="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded">{product.spec_ram}</span>}
                            {product.spec_storage && <span class="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded">{product.spec_storage}</span>}
                            {product.spec_gpu && <span class="bg-indigo-50 text-indigo-600 text-[10px] font-medium px-2 py-0.5 rounded truncate max-w-[120px]">{product.spec_gpu}</span>}
                          </div>
                        )}
                      </div>

                      <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
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
                          title="Tambah ke Keranjang"
                        >
                          <ShoppingCart size={18} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* MOBILE FILTERS SHEET - Slide over modal */}
      {isMobileFiltersOpen && (
        <div class="fixed inset-0 z-50 overflow-hidden md:hidden">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileFiltersOpen(false)}></div>
          
          <div class="absolute inset-y-0 left-0 max-w-full flex">
            <div class="w-screen max-w-xs bg-white h-full flex flex-col justify-between shadow-2xl animate-fade-in p-6 overflow-y-auto space-y-6">
              
              {/* Header */}
              <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 class="text-base font-extrabold text-slate-800">Filter Produk</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} class="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              {/* Sidebar Filters copied for mobile */}
              <div class="flex-grow space-y-5">
                
                <div>
                  <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cari</h4>
                  <input 
                    type="text" 
                    placeholder="Kata kunci..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kategori</h4>
                  <div class="space-y-1.5">
                    <label class="flex items-center space-x-2 text-xs cursor-pointer">
                      <input type="radio" checked={category === ''} onChange={() => setCategory('')} />
                      <span class="text-slate-600">Semua Kategori</span>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat.id} class="flex items-center space-x-2 text-xs cursor-pointer">
                        <input type="radio" checked={category === cat.slug} onChange={() => setCategory(cat.slug)} />
                        <span class="text-slate-600">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Brand</h4>
                  <select value={brand} onChange={(e) => setBrand(e.target.value)} class="w-full bg-slate-50 border p-2 text-xs rounded-lg">
                    <option value="">Semua Brand</option>
                    <option value="ASUS">ASUS</option>
                    <option value="Lenovo">Lenovo</option>
                    <option value="Apple">Apple</option>
                    <option value="HP">HP</option>
                    <option value="MSI">MSI</option>
                  </select>
                </div>

                <div>
                  <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rentang Harga (Rp)</h4>
                  <div class="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} class="bg-slate-50 border p-2 text-xs rounded-lg w-full" />
                    <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} class="bg-slate-50 border p-2 text-xs rounded-lg w-full" />
                  </div>
                </div>

                <div class="border-t border-slate-100 pt-4 space-y-4">
                  <h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Spesifikasi</h4>
                  <div>
                    <label class="block text-xs text-slate-700 mb-1">RAM</label>
                    <select value={ram} onChange={(e) => setRam(e.target.value)} class="w-full bg-slate-50 border p-2 text-xs rounded-lg">
                      <option value="">Semua RAM</option>
                      <option value="8GB">8GB</option>
                      <option value="16GB">16GB</option>
                      <option value="32GB">32GB</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Apply Button */}
              <button 
                onClick={() => setIsMobileFiltersOpen(false)}
                class="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-xs"
              >
                Terapkan Filter
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Catalog;
