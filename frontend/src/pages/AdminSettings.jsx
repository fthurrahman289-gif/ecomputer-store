import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { Save, Store, CreditCard, Upload, Trash2, Plus, Building } from 'lucide-react';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'payment'
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  // Form states
  const [infoForm, setInfoForm] = useState({
    store_name: '',
    cs_whatsapp: '',
    store_phone: '',
    cs_email: '',
    store_address: '',
    store_hours: ''
  });

  const [banks, setBanks] = useState([]);
  const [ewallet, setEwallet] = useState({
    ovo_number: '',
    gopay_number: '',
    is_active: false
  });
  const [qris, setQris] = useState({
    qris_image_path: '',
    is_active: false,
    file: null
  });

  const triggerAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  useEffect(() => {
    if (activeTab === 'info') {
      loadInfoSettings();
    } else if (activeTab === 'payment') {
      loadPaymentSettings();
    }
  }, [activeTab]);

  const loadInfoSettings = async () => {
    try {
      const data = await apiCall('/api/settings');
      setInfoForm({
        store_name: data.store_name || '',
        cs_whatsapp: data.cs_whatsapp || '',
        store_phone: data.store_phone || '',
        cs_email: data.cs_email || '',
        store_address: data.store_address || '',
        store_hours: data.store_hours || ''
      });
    } catch (err) {
      console.error('Failed to load info settings', err);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const data = await apiCall('/api/payment/settings');
      
      const loadedBanks = [];
      let loadedEwallet = { ovo_number: '', gopay_number: '', is_active: false };
      let loadedQris = { qris_image_path: '', is_active: false, file: null };

      data.forEach(item => {
        if (item.payment_method.startsWith('Transfer Bank - ')) {
          loadedBanks.push({
            bank_name: item.bank_name,
            account_number: item.account_number,
            account_holder_name: item.account_holder_name,
            is_active: item.is_active
          });
        } else if (item.payment_method === 'E-Wallet') {
          loadedEwallet = {
            ovo_number: item.ovo_number || '',
            gopay_number: item.gopay_number || '',
            is_active: item.is_active
          };
        } else if (item.payment_method === 'QRIS') {
          loadedQris = {
            qris_image_path: item.qris_image_path || '',
            is_active: item.is_active,
            file: null
          };
        }
      });

      setBanks(loadedBanks);
      setEwallet(loadedEwallet);
      setQris(loadedQris);
    } catch (err) {
      console.error('Failed to load payment settings', err);
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiCall('/api/settings/bulk', {
        method: 'PUT',
        body: JSON.stringify(infoForm)
      });
      triggerAlert(data.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Save Banks
      if (banks.length > 0) {
        await apiCall('/api/payment/settings/banks', {
          method: 'POST',
          body: JSON.stringify({ banks })
        });
      }

      // 2. Save E-Wallet
      await apiCall('/api/payment/settings', {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: 'E-Wallet',
          ovo_number: ewallet.ovo_number,
          gopay_number: ewallet.gopay_number,
          is_active: ewallet.is_active
        })
      });

      // 3. Save QRIS status and upload photo if exists
      if (qris.file) {
        const formData = new FormData();
        formData.append('qris_image', qris.file);
        
        const token = localStorage.getItem('token');
        const res = await fetch('/api/payment/settings/qris/upload', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${token}\`
          },
          body: formData
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Gagal upload QRIS');
        
        setQris({ ...qris, qris_image_path: result.qris_image_path, file: null });
      }

      await apiCall('/api/payment/settings', {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: 'QRIS',
          is_active: qris.is_active
        })
      });

      triggerAlert('Pengaturan pembayaran berhasil disimpan');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQrisFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setQris({ ...qris, file: e.target.files[0] });
    }
  };

  const handleAddBank = () => {
    setBanks([...banks, { bank_name: '', account_number: '', account_holder_name: '', is_active: true }]);
  };

  const handleRemoveBank = (index) => {
    const newBanks = [...banks];
    newBanks.splice(index, 1);
    setBanks(newBanks);
  };

  const handleBankChange = (index, field, value) => {
    const newBanks = [...banks];
    newBanks[index][field] = value;
    setBanks(newBanks);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-slate-500 text-xs mt-0.5">Kelola informasi kontak toko dan konfigurasi metode pembayaran</p>
      </div>

      {alertMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded text-emerald-800 text-sm font-bold shadow-sm">
          {alertMsg}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        
        {/* TAB NAV */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button 
            onClick={() => setActiveTab('info')}
            className={\`flex-1 py-4 text-sm font-bold flex items-center justify-center space-x-2 transition-colors \${activeTab === 'info' ? 'bg-white text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}\`}
          >
            <Store size={18} />
            <span>Informasi Toko</span>
          </button>
          <button 
            onClick={() => setActiveTab('payment')}
            className={\`flex-1 py-4 text-sm font-bold flex items-center justify-center space-x-2 transition-colors \${activeTab === 'payment' ? 'bg-white text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}\`}
          >
            <CreditCard size={18} />
            <span>Metode Pembayaran</span>
          </button>
        </div>

        {/* TAB 1: INFO TOKO */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveInfo} className="p-6 sm:p-10 space-y-6">
            <h2 className="text-lg font-extrabold text-slate-800 mb-6 border-b pb-2">Detail Kontak & Operasional</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <label className="block font-semibold text-slate-600 mb-2">Nama Toko</label>
                <input type="text" value={infoForm.store_name} onChange={e => setInfoForm({...infoForm, store_name: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="E-Computer Store" />
              </div>
              
              <div>
                <label className="block font-semibold text-slate-600 mb-2">Nomor Telepon</label>
                <input type="text" value={infoForm.store_phone} onChange={e => setInfoForm({...infoForm, store_phone: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="021-..." />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-2">WhatsApp / Live Chat</label>
                <input type="text" value={infoForm.cs_whatsapp} onChange={e => setInfoForm({...infoForm, cs_whatsapp: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="0812..." />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-2">Email</label>
                <input type="email" value={infoForm.cs_email} onChange={e => setInfoForm({...infoForm, cs_email: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="admin@ecomputer.com" />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-2">Jam Operasional</label>
                <input type="text" value={infoForm.store_hours} onChange={e => setInfoForm({...infoForm, store_hours: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Senin - Jumat, 09:00 - 18:00" />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-2">Alamat Lengkap</label>
                <textarea rows="3" value={infoForm.store_address} onChange={e => setInfoForm({...infoForm, store_address: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Jl. Raya..." />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button disabled={loading} type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl shadow flex items-center space-x-2">
                <Save size={18} />
                <span>{loading ? 'Menyimpan...' : 'Simpan Info Toko'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: PEMBAYARAN */}
        {activeTab === 'payment' && (
          <form onSubmit={handleSavePayment} className="p-6 sm:p-10 space-y-10">
            
            {/* Bank Transfer Section */}
            <div>
              <div className="flex items-center justify-between border-b pb-2 mb-6">
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2"><Building size={20} className="text-indigo-600" /> Transfer Bank</h2>
                <button type="button" onClick={handleAddBank} className="text-sm font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"><Plus size={16} /> Tambah Rekening</button>
              </div>
              
              <div className="space-y-4">
                {banks.map((bank, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 border rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-end relative">
                    <button type="button" onClick={() => handleRemoveBank(idx)} className="absolute top-3 right-3 text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Bank</label>
                      <input type="text" required value={bank.bank_name} onChange={(e) => handleBankChange(idx, 'bank_name', e.target.value)} className="w-full bg-white border p-2.5 rounded-lg text-sm outline-none focus:border-brand-500" placeholder="BCA, Mandiri..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">No. Rekening</label>
                      <input type="text" required value={bank.account_number} onChange={(e) => handleBankChange(idx, 'account_number', e.target.value)} className="w-full bg-white border p-2.5 rounded-lg text-sm outline-none focus:border-brand-500" placeholder="1234567890" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Pemilik</label>
                      <input type="text" required value={bank.account_holder_name} onChange={(e) => handleBankChange(idx, 'account_holder_name', e.target.value)} className="w-full bg-white border p-2.5 rounded-lg text-sm outline-none focus:border-brand-500" placeholder="A.n Toko E-Computer" />
                    </div>
                    <div className="flex items-center h-[42px] px-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={bank.is_active} onChange={(e) => handleBankChange(idx, 'is_active', e.target.checked)} className="rounded text-brand-600 focus:ring-brand-500" />
                        <span className="text-sm font-bold text-slate-700">Aktif</span>
                      </label>
                    </div>
                  </div>
                ))}
                {banks.length === 0 && <p className="text-sm text-slate-500 italic">Belum ada data rekening bank. Klik Tambah Rekening.</p>}
              </div>
            </div>

            {/* E-Wallet Section */}
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 mb-6 border-b pb-2 flex items-center gap-2">📱 E-Wallet (OVO / GoPay)</h2>
              <div className="bg-slate-50 p-6 border rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold text-slate-600 mb-2">Nomor OVO</label>
                  <input type="text" value={ewallet.ovo_number} onChange={(e) => setEwallet({...ewallet, ovo_number: e.target.value})} className="w-full bg-white border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0812..." />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-2">Nomor GoPay</label>
                  <input type="text" value={ewallet.gopay_number} onChange={(e) => setEwallet({...ewallet, gopay_number: e.target.value})} className="w-full bg-white border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0812..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={ewallet.is_active} onChange={(e) => setEwallet({...ewallet, is_active: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                    <span className="text-sm font-bold text-slate-800">Aktifkan Pembayaran E-Wallet</span>
                  </label>
                </div>
              </div>
            </div>

            {/* QRIS Section */}
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 mb-6 border-b pb-2 flex items-center gap-2">🏁 Barcode QRIS</h2>
              <div className="bg-slate-50 p-6 border rounded-2xl flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-2">Upload Foto / Barcode QRIS</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-white text-center hover:bg-slate-50 transition-colors">
                      <input type="file" accept="image/*" onChange={handleQrisFileChange} className="hidden" id="qris-upload" />
                      <label htmlFor="qris-upload" className="cursor-pointer flex flex-col items-center gap-2 text-slate-500">
                        <Upload size={24} className="text-purple-500" />
                        <span className="font-semibold text-sm">Pilih Gambar QRIS</span>
                        <span className="text-xs text-slate-400">JPG, PNG, WEBP. Maks 2MB</span>
                      </label>
                    </div>
                    {qris.file && <p className="text-xs text-emerald-600 mt-2 font-semibold font-mono">File siap diupload: {qris.file.name}</p>}
                  </div>
                  
                  <div className="pt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={qris.is_active} onChange={(e) => setQris({...qris, is_active: e.target.checked})} className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4" />
                      <span className="text-sm font-bold text-slate-800">Aktifkan Pembayaran QRIS</span>
                    </label>
                  </div>
                </div>

                {/* Preview QRIS */}
                <div className="w-full md:w-64 shrink-0 bg-white border rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px]">
                  <p className="text-xs font-bold text-slate-400 mb-3 uppercase">Preview QRIS Tersimpan</p>
                  {qris.qris_image_path ? (
                    <img src={qris.qris_image_path} alt="QRIS Preview" className="max-w-full h-auto object-contain" />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center">
                      <Building size={32} />
                      <span className="text-xs mt-2">Belum ada QRIS</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t pt-8">
              <button disabled={loading} type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl shadow flex items-center space-x-2">
                <Save size={18} />
                <span>{loading ? 'Menyimpan...' : 'Simpan Semua Pembayaran'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
