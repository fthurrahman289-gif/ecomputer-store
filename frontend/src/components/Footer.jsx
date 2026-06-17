import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Clock } from 'lucide-react';
import { apiCall } from '../services/api';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState({
    cs_whatsapp: '6282312360958',
    cs_email: 'support@ecomputer.com',
    admin_phone: '+6282312360958',
    store_address: 'Cyber Mall Lt. 2 No. 45, Jakarta',
    store_hours: 'Senin-Jumat: 10:00-18:00, Sabtu-Minggu: 11:00-17:00'
  });

  // Load settings from API on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiCall('/api/settings', {}, 'GET');
      setSettings({
        cs_whatsapp: data.cs_whatsapp || '6282312360958',
        cs_email: data.cs_email || 'support@ecomputer.com',
        admin_phone: data.admin_phone || '+6282312360958',
        store_address: data.store_address || 'Cyber Mall Lt. 2 No. 45, Jakarta',
        store_hours: data.store_hours || 'Senin-Jumat: 10:00-18:00, Sabtu-Minggu: 11:00-17:00'
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

          {/* Brand Info */}
          <div className="space-y-4">
            <h3 className="text-white font-extrabold text-xl flex items-center space-x-2">
              <span>💻</span>
              <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">E-Computer</span>
            </h3>
            <p className="text-sm leading-relaxed">
              Toko komputer, laptop, dan aksesoris terlengkap & terpercaya dengan teknologi modern dan pelayanan terbaik.
            </p>
            <div className="flex space-x-4 pt-2">
              <span className="bg-slate-800 p-2 rounded-full text-slate-300 hover:text-white cursor-pointer transition-colors">
                🌐
              </span>
              <span className="bg-slate-800 p-2 rounded-full text-slate-300 hover:text-white cursor-pointer transition-colors">
                📸
              </span>
              <span className="bg-slate-800 p-2 rounded-full text-slate-300 hover:text-white cursor-pointer transition-colors">
                🐦
              </span>
            </div>
          </div>

          {/* Categories Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Kategori Populer</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/catalog?category=laptop" className="hover:text-white transition-colors">Laptop Gaming & Ultrabook</a></li>
              <li><a href="/catalog?category=komputer-desktop" className="hover:text-white transition-colors">PC Desktop Gaming</a></li>
              <li><a href="/catalog?category=komponen" className="hover:text-white transition-colors">Komponen & Hardware</a></li>
              <li><a href="/catalog?category=aksesoris" className="hover:text-white transition-colors">Aksesoris & Monitor</a></li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Metode Pembayaran</h4>
            <div className="space-y-3">
              <p className="text-xs">Mendukung transfer bank manual & E-Wallet:</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-300">
                <div className="bg-slate-800 p-2 rounded text-center">BCA</div>
                <div className="bg-slate-800 p-2 rounded text-center">Mandiri</div>
                <div className="bg-slate-800 p-2 rounded text-center">GoPay</div>
                <div className="bg-slate-800 p-2 rounded text-center">OVO</div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Kontak & Jam Operasional</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <MapPin size={18} className="mr-2 text-brand-400 shrink-0 mt-0.5" />
                <span>{settings.store_address}</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 text-brand-400 shrink-0" />
                <span>{settings.admin_phone}</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 text-brand-400 shrink-0" />
                <span>{settings.cs_email}</span>
              </li>
              <li className="flex items-start">
                <MessageCircle size={18} className="mr-2 text-green-400 shrink-0 mt-0.5" />
                <span>WA: {settings.cs_whatsapp}</span>
              </li>
              {settings.store_hours && (
                <li className="pt-2 border-t border-slate-700">
                  <div className="flex items-center gap-2 font-semibold text-slate-300 mb-1 text-xs">
                    <Clock size={14} className="text-orange-400" />
                    Jam Operasional:
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed ml-6">{settings.store_hours}</div>
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Footer bottom */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>&copy; {currentYear} E-Computer Indonesia. Hak cipta dilindungi undang-undang.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer">Syarat & Ketentuan</span>
            <span className="hover:text-white cursor-pointer">Kebijakan Privasi</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
