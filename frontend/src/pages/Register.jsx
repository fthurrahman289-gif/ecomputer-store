import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { User, Mail, Lock, Phone, MapPin, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AppContext);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.phone,
        formData.address
      );
      setSuccess('Registrasi berhasil! Mengalihkan ke halaman login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registrasi gagal. Coba email lain.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-[90vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-tr from-slate-100 via-white to-brand-50/30">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-slide-up">
        
        {/* Title */}
        <div class="text-center">
          <span class="text-4xl">👋</span>
          <h2 class="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">Buat Akun Baru</h2>
          <p class="mt-2 text-sm text-slate-500">
            Daftar untuk menikmati belanja komputer & laptop terbaik
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div class="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg flex items-center space-x-3 text-rose-700 text-sm">
            <AlertCircle size={18} class="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-emerald-700 text-sm">
            {success}
          </div>
        )}

        <form class="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div class="space-y-4">
            
            {/* Name Field */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Nama Lengkap</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="Nama Lengkap Anda"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Alamat Email</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Kata Sandi</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
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

            {/* Phone Field */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Nomor Telepon / WhatsApp</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone size={18} />
                </div>
                <input
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="Contoh: 081234567890"
                />
              </div>
            </div>

            {/* Address Field */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Alamat Pengiriman</label>
              <div class="relative">
                <div class="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-slate-400">
                  <MapPin size={18} />
                </div>
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="Tulis alamat lengkap pengiriman rumah Anda..."
                />
              </div>
            </div>

          </div>

          <div class="pt-2">
            <button
              type="submit"
              disabled={loading}
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all duration-300 hover:shadow-lg"
            >
              {loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
            </button>
          </div>
        </form>

        <div class="text-center text-sm text-slate-500 pt-4 border-t border-slate-100">
          Sudah punya akun?{' '}
          <Link to="/login" class="font-semibold text-brand-600 hover:text-brand-700">
            Masuk Disini
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
