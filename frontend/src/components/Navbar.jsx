import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  ShoppingCart, 
  Heart, 
  RefreshCw, 
  User, 
  Search, 
  LogOut, 
  LayoutDashboard, 
  ShoppingBag,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, cart, wishlist, compareList } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <nav class="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div class="flex-shrink-0 flex items-center">
            <Link to="/" class="flex items-center space-x-2 text-brand-600 font-extrabold text-2xl tracking-tight">
              <span>💻</span>
              <span class="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">E-Computer</span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} class="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input
              type="text"
              placeholder="Cari laptop, mouse, komponen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              class="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
            <button type="submit" class="absolute right-3 top-2.5 text-slate-400 hover:text-brand-500 transition-colors">
              <Search size={18} />
            </button>
          </form>

          {/* Action Icons - Desktop */}
          <div class="hidden md:flex items-center space-x-6">
            <Link to="/catalog" class="text-slate-600 hover:text-brand-600 font-medium text-sm transition-colors">Katalog</Link>
            
            {/* Compare */}
            <Link to="/compare" class="text-slate-600 hover:text-brand-600 relative transition-colors" title="Bandingkan Produk">
              <RefreshCw size={20} />
              {compareList.length > 0 && (
                <span class="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                  {compareList.length}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link to="/wishlist" class="text-slate-600 hover:text-brand-600 relative transition-colors" title="Wishlist">
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span class="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" class="text-slate-600 hover:text-brand-600 relative transition-colors" title="Keranjang Belanja">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span class="absolute -top-2 -right-2 bg-brand-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            <div class="relative">
              {user ? (
                <div>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    class="flex items-center space-x-2 text-slate-700 hover:text-brand-600 focus:outline-none transition-colors"
                  >
                    <div class="bg-brand-100 text-brand-700 rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span class="text-sm font-semibold max-w-[100px] truncate">{user.name}</span>
                  </button>

                  {isDropdownOpen && (
                    <div class="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in border border-slate-100">
                      {user.role === 'admin' && (
                        <Link 
                          to="/admin" 
                          onClick={() => setIsDropdownOpen(false)}
                          class="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard size={16} class="mr-2 text-brand-500" />
                          Dashboard Admin
                        </Link>
                      )}
                      <Link 
                        to="/order-status" 
                        onClick={() => setIsDropdownOpen(false)}
                        class="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ShoppingBag size={16} class="mr-2 text-indigo-500" />
                        Transaksi Saya
                      </Link>
                      <button 
                        onClick={() => { logout(); setIsDropdownOpen(false); }}
                        class="w-full text-left flex items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50/50 transition-colors border-t border-slate-100"
                      >
                        <LogOut size={16} class="mr-2" />
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div class="flex items-center space-x-3">
                  <Link to="/login" class="text-slate-600 hover:text-brand-600 text-sm font-medium transition-colors">Login</Link>
                  <Link to="/register" class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all">Daftar</Link>
                </div>
              )}
            </div>

          </div>

          {/* Mobile Menu Button */}
          <div class="md:hidden flex items-center space-x-4">
            <Link to="/cart" class="text-slate-600 relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span class="absolute -top-2 -right-2 bg-brand-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              class="text-slate-600 hover:text-brand-600 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div class="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-4 shadow-inner">
          <form onSubmit={handleSearch} class="relative">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              class="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button type="submit" class="absolute right-3 top-2.5 text-slate-400">
              <Search size={18} />
            </button>
          </form>

          <div class="flex flex-col space-y-3 font-medium">
            <Link to="/catalog" onClick={() => setIsMobileMenuOpen(false)} class="text-slate-700 hover:text-brand-600">Katalog</Link>
            <Link to="/compare" onClick={() => setIsMobileMenuOpen(false)} class="text-slate-700 hover:text-brand-600 flex justify-between">
              <span>Bandingkan</span>
              {compareList.length > 0 && <span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{compareList.length}</span>}
            </Link>
            <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} class="text-slate-700 hover:text-brand-600 flex justify-between">
              <span>Wishlist</span>
              {wishlist.length > 0 && <span class="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs">{wishlist.length}</span>}
            </Link>

            {user ? (
              <div class="pt-3 border-t border-slate-100 flex flex-col space-y-3">
                <div class="text-slate-500 text-xs">Akun: {user.name}</div>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} class="text-brand-600 flex items-center">
                    <LayoutDashboard size={16} class="mr-2" /> Dashboard Admin
                  </Link>
                )}
                <Link to="/order-status" onClick={() => setIsMobileMenuOpen(false)} class="text-slate-700 flex items-center">
                  <ShoppingBag size={16} class="mr-2 text-indigo-500" /> Transaksi Saya
                </Link>
                <button 
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  class="text-left text-rose-600 flex items-center pt-2 border-t border-slate-100"
                >
                  <LogOut size={16} class="mr-2" /> Keluar
                </button>
              </div>
            ) : (
              <div class="pt-3 border-t border-slate-100 flex flex-col space-y-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} class="w-full text-center py-2 text-slate-700 border border-slate-200 rounded-lg">Login</Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} class="w-full text-center py-2 bg-brand-600 text-white rounded-lg">Daftar</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
