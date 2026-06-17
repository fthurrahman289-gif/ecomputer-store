import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { apiCall } from '../services/api';

const LiveChatButton = () => {
  const [csWhatsapp, setCsWhatsapp] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Load CS WhatsApp number on mount
  useEffect(() => {
    loadCsWhatsapp();
  }, []);

  const loadCsWhatsapp = async () => {
    try {
      const data = await apiCall('/api/settings', {}, 'GET');
      if (data.cs_whatsapp) {
        setCsWhatsapp(data.cs_whatsapp);
      }
    } catch (error) {
      console.error('Error loading CS WhatsApp:', error);
    }
  };

  if (!csWhatsapp) {
    return null; // Don't show if no WhatsApp number configured
  }

  const handleWhatsappClick = () => {
    const message = encodeURIComponent('Halo, saya ingin bertanya tentang produk Anda');
    const waUrl = `https://wa.me/${csWhatsapp}?text=${message}`;
    window.open(waUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Chat Menu */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-64 animate-fade-in">
            <h3 className="font-bold text-gray-900 mb-3">Hubungi Kami</h3>
            
            {/* WhatsApp Option */}
            <button
              onClick={handleWhatsappClick}
              className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors mb-2"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                <MessageCircle size={20} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-gray-900">WhatsApp</p>
                <p className="text-xs text-gray-500">Hubungi via WhatsApp</p>
              </div>
            </button>

            <p className="text-xs text-gray-500 text-center mt-3 pt-3 border-t">
              Balas cepat dalam jam kerja
            </p>
          </div>
        )}

        {/* Main Float Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white font-bold text-2xl ${
            isOpen
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600 animate-bounce'
          }`}
          title={isOpen ? 'Tutup chat' : 'Buka live chat'}
        >
          {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </button>
      </div>
    </>
  );
};

export default LiveChatButton;
