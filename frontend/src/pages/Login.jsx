import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login gagal, periksa email dan password Anda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-tr from-slate-100 via-white to-brand-50/30">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-slide-up">
        
        {/* Title */}
        <div class="text-center">
          <span class="text-4xl">💻</span>
          <h2 class="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">Selamat Datang Kembali</h2>
          <p class="mt-2 text-sm text-slate-500">
            Masuk ke akun E-Computer Anda untuk mulai berbelanja
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div class="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg flex items-center space-x-3 text-rose-700 text-sm">
            <AlertCircle size={18} class="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form class="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div class="space-y-4">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email-address" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Alamat Email
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Kata Sandi
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all duration-300 hover:shadow-lg"
            >
              {loading ? 'Menghubungkan...' : 'Masuk ke Akun'}
            </button>
          </div>
        </form>

        <div class="text-center text-sm text-slate-500 pt-4 border-t border-slate-100">
          Belum punya akun?{' '}
          <Link to="/register" class="font-semibold text-brand-600 hover:text-brand-700">
            Daftar Sekarang
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
