import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengirim OTP');
      }

      setSuccess(data.message);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengirim OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otpCode,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengubah password');
      }

      setSuccess(data.message);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = () => {
    if (!otpCode || otpCode.length < 6) {
      setError('Masukkan kode OTP 6 digit');
      return;
    }
    setError('');
    setStep(3);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-tr from-slate-100 via-white to-brand-50/30">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-slide-up">
        
        {/* Title */}
        <div className="text-center">
          <span className="text-4xl">🔑</span>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">Reset Password</h2>
          <p className="mt-2 text-sm text-slate-500">
            Kami akan membantu Anda mengubah password akun
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-between items-center space-x-2">
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-brand-500' : 'bg-slate-200'}`}></div>
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-brand-500' : 'bg-slate-200'}`}></div>
          <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-brand-500' : 'bg-slate-200'}`}></div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg flex items-center space-x-3 text-rose-700 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-center space-x-3 text-emerald-700 text-sm">
            <CheckCircle size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleRequestOTP}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Alamat Email Terdaftar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Masukkan email yang terdaftar untuk akun Anda. Kami akan mengirimkan kode OTP ke email ini.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all duration-300 hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Mengirim OTP...
                </>
              ) : (
                'Kirim Kode OTP'
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={(e) => {
            e.preventDefault();
            handleVerifyOTP();
          }}>
            <div>
              <label htmlFor="otp" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Kode OTP 6 Digit
              </label>
              <input
                id="otp"
                type="text"
                maxLength="6"
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl py-3 text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                placeholder="000000"
              />
              <p className="mt-2 text-xs text-slate-500">
                Periksa email Anda dan masukkan kode OTP 6 digit. Kode berlaku selama 10 menit.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all duration-300 hover:shadow-lg"
            >
              Verifikasi OTP
            </button>

            <div className="text-center text-sm">
              <p className="text-slate-500 mb-2">Tidak menerima kode?</p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-brand-600 hover:text-brand-700 font-semibold"
              >
                Kembali dan coba email lain
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
              <p>✓ Password minimal 6 karakter</p>
              <p>✓ Gunakan kombinasi huruf dan angka untuk keamanan lebih baik</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all duration-300 hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Mengubah Password...
                </>
              ) : (
                'Ubah Password'
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-100">
          Ingat password Anda?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Kembali ke Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
