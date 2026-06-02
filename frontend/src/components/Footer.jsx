import React from 'react';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer class="bg-slate-900 text-slate-400 pt-16 pb-8 border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div class="space-y-4">
            <h3 class="text-white font-extrabold text-xl flex items-center space-x-2">
              <span>💻</span>
              <span class="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">E-Computer</span>
            </h3>
            <p class="text-sm leading-relaxed">
              Toko komputer, laptop, dan aksesoris terlengkap & terpercaya dengan teknologi modern dan pelayanan terbaik.
            </p>
            <div class="flex space-x-4 pt-2">
              <span class="bg-slate-800 p-2 rounded-full text-slate-300 hover:text-white cursor-pointer transition-colors">
                🌐
              </span>
              <span class="bg-slate-800 p-2 rounded-full text-slate-300 hover:text-white cursor-pointer transition-colors">
                📸
              </span>
              <span class="bg-slate-800 p-2 rounded-full text-slate-300 hover:text-white cursor-pointer transition-colors">
                🐦
              </span>
            </div>
          </div>

          {/* Categories Links */}
          <div>
            <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Kategori Populer</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="/catalog?category=laptop" class="hover:text-white transition-colors">Laptop Gaming & Ultrabook</a></li>
              <li><a href="/catalog?category=komputer-desktop" class="hover:text-white transition-colors">PC Desktop Gaming</a></li>
              <li><a href="/catalog?category=komponen" class="hover:text-white transition-colors">Komponen & Hardware</a></li>
              <li><a href="/catalog?category=aksesoris" class="hover:text-white transition-colors">Aksesoris & Monitor</a></li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Metode Pembayaran</h4>
            <div class="space-y-3">
              <p class="text-xs">Mendukung transfer bank manual & E-Wallet:</p>
              <div class="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-300">
                <div class="bg-slate-800 p-2 rounded text-center">BCA</div>
                <div class="bg-slate-800 p-2 rounded text-center">Mandiri</div>
                <div class="bg-slate-800 p-2 rounded text-center">GoPay</div>
                <div class="bg-slate-800 p-2 rounded text-center">OVO</div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div class="space-y-3">
            <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Kontak Kami</h4>
            <ul class="space-y-3 text-sm">
              <li class="flex items-start">
                <MapPin size={18} class="mr-2 text-brand-400 shrink-0" />
                <span>Cyber Mall Lt. 2 No. 45, Jakarta</span>
              </li>
              <li class="flex items-center">
                <Phone size={18} class="mr-2 text-brand-400 shrink-0" />
                <span>+62 812-3456-7890</span>
              </li>
              <li class="flex items-center">
                <Mail size={18} class="mr-2 text-brand-400 shrink-0" />
                <span>support@ecomputer.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer bottom */}
        <div class="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>&copy; {currentYear} E-Computer Indonesia. Hak cipta dilindungi undang-undang.</p>
          <div class="flex space-x-6 mt-4 md:mt-0">
            <span class="hover:text-white cursor-pointer">Syarat & Ketentuan</span>
            <span class="hover:text-white cursor-pointer">Kebijakan Privasi</span>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Action Button */}
      <a 
        href="https://wa.me/6282312360958?text=Halo%20E-Computer,%20saya%20tertarik%20untuk%20bertanya%20mengenai%20produk%20komputer/laptop%20yang%20dijual."
        target="_blank"
        rel="noopener noreferrer"
        class="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 z-50 flex items-center justify-center group"
        title="Chat WhatsApp"
      >
        <MessageCircle size={28} />
        <span class="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 text-sm font-semibold transition-all duration-300 whitespace-nowrap">
          Tanya Kami (WA)
        </span>
      </a>

    </footer>
  );
};

export default Footer;
