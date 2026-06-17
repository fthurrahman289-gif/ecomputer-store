import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShoppingCart, Trash2, GitCompare, RefreshCw, X } from 'lucide-react';

const Compare = () => {
  const { compareList, removeFromCompare, clearCompare, addToCart } = useContext(AppContext);

  if (compareList.length === 0) {
    return (
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-slide-up">
        <span class="text-6xl flex justify-center mb-4">⚖️</span>
        <h2 class="text-2xl font-bold text-slate-800 mt-4">Belum Ada Produk Banding</h2>
        <p class="text-slate-500 mt-1 mb-8">Pilih dan tambahkan 2 hingga 3 produk di katalog untuk membandingkan spesifikasinya secara mendalam.</p>
        <Link to="/catalog" class="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-full shadow-md">
          Lihat Katalog
        </Link>
      </div>
    );
  }

  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div class="flex items-center justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <GitCompare size={28} class="text-indigo-600 animate-pulse-slow" />
            <span>Perbandingan Produk</span>
          </h1>
          <p class="text-slate-500 text-sm mt-1">Bandingkan RAM, Storage, CPU, GPU, dan Harga secara detail side-by-side</p>
        </div>
        <button 
          onClick={clearCompare}
          class="flex items-center space-x-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-rose-600 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
        >
          <Trash2 size={14} />
          <span>Hapus Semua</span>
        </button>
      </div>

      {/* Comparison Grid Table */}
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
        <table class="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr class="bg-slate-50/50">
              <th class="p-6 text-xs uppercase font-extrabold tracking-widest text-slate-400 border-b border-slate-100 w-1/4">Spesifikasi</th>
              {compareList.map((prod) => (
                <th key={prod.id} class="p-6 border-b border-slate-100 w-1/4 relative">
                  <button 
                    onClick={() => removeFromCompare(prod.id)}
                    class="absolute top-4 right-4 text-slate-400 hover:text-rose-500 p-1 hover:bg-slate-100 rounded-full transition-all"
                    title="Hapus"
                  >
                    <X size={16} />
                  </button>
                  <div class="flex flex-col items-center text-center space-y-3 pt-4">
                    <div class="relative w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center text-4xl border border-slate-100">
                      {prod.image_urls && prod.image_urls.length > 0 ? (
                        <img 
                          src={prod.image_urls[0]} 
                          alt={prod.name} 
                          class="absolute inset-0 w-full h-full object-contain p-1"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fb = e.target.parentNode.querySelector('.emoji-fallback');
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div class="emoji-fallback absolute inset-0 flex items-center justify-center" style={{ display: prod.image_urls && prod.image_urls.length > 0 ? 'none' : 'flex' }}>
                        {prod.category_id === 1 ? '💻' : '⚙️'}
                      </div>
                    </div>
                    <div>
                      <span class="text-[10px] uppercase font-bold text-slate-400">{prod.brand}</span>
                      <Link to={`/product/${prod.id}`} class="block text-slate-800 hover:text-brand-600 font-extrabold text-xs line-clamp-2 mt-1 leading-snug">
                        {prod.name}
                      </Link>
                    </div>
                  </div>
                </th>
              ))}
              {/* Filler column if list has less than 3 elements */}
              {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <th key={i} class="p-6 border-b border-slate-100 text-center text-slate-300 font-medium text-xs">
                  <div class="flex flex-col items-center space-y-2 py-6">
                    <RefreshCw size={24} class="opacity-50" />
                    <Link to="/catalog" class="text-brand-500 hover:underline">Tambah Produk</Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody class="text-xs divide-y divide-slate-100">
            
            {/* Price */}
            <tr>
              <td class="p-6 font-bold text-slate-500 bg-slate-50/20">Harga Akhir</td>
              {compareList.map((prod) => {
                const finalPrice = prod.price * (1 - (prod.discount_percent / 100));
                return (
                  <td key={prod.id} class="p-6 font-extrabold text-brand-600 text-sm">
                    Rp {finalPrice.toLocaleString('id-ID')}
                    {prod.discount_percent > 0 && (
                      <span class="text-[10px] text-rose-500 block font-bold mt-0.5">Potongan -{prod.discount_percent}%</span>
                    )}
                  </td>
                );
              })}
              {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <td key={i} class="p-6 text-slate-300">-</td>
              ))}
            </tr>

            {/* RAM */}
            <tr>
              <td class="p-6 font-bold text-slate-500 bg-slate-50/20">RAM</td>
              {compareList.map((prod) => (
                <td key={prod.id} class="p-6 font-bold text-slate-750">{prod.spec_ram || '-'}</td>
              ))}
              {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <td key={i} class="p-6 text-slate-300">-</td>
              ))}
            </tr>

            {/* Storage */}
            <tr>
              <td class="p-6 font-bold text-slate-500 bg-slate-50/20">Penyimpanan</td>
              {compareList.map((prod) => (
                <td key={prod.id} class="p-6 font-bold text-slate-750">{prod.spec_storage || '-'}</td>
              ))}
              {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <td key={i} class="p-6 text-slate-300">-</td>
              ))}
            </tr>

            {/* CPU */}
            <tr>
              <td class="p-6 font-bold text-slate-500 bg-slate-50/20">Prosesor (CPU)</td>
              {compareList.map((prod) => (
                <td key={prod.id} class="p-6 font-bold text-slate-750">{prod.spec_cpu || '-'}</td>
              ))}
              {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <td key={i} class="p-6 text-slate-300">-</td>
              ))}
            </tr>

            {/* GPU */}
            <tr>
              <td class="p-6 font-bold text-slate-500 bg-slate-50/20">Kartu Grafis (GPU)</td>
              {compareList.map((prod) => (
                <td key={prod.id} class="p-6 font-bold text-slate-750">{prod.spec_gpu || '-'}</td>
              ))}
              {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <td key={i} class="p-6 text-slate-300">-</td>
              ))}
            </tr>

            {/* Weight */}
            <tr>
              <td class="p-6 font-bold text-slate-500 bg-slate-50/20">Berat Produk</td>
              {compareList.map((prod) => (
                <td key={prod.id} class="p-6 text-slate-700">{prod.weight ? `${prod.weight} kg` : '-'}</td>
              ))}
              {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <td key={i} class="p-6 text-slate-300">-</td>
              ))}
            </tr>

            {/* Stock status */}
            <tr>
              <td class="p-6 font-bold text-slate-500 bg-slate-50/20">Ketersediaan Stok</td>
              {compareList.map((prod) => (
                <td key={prod.id} class={`p-6 font-extrabold ${prod.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {prod.stock > 0 ? `Tersedia (${prod.stock})` : 'Habis'}
                </td>
              ))}
              {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <td key={i} class="p-6 text-slate-300">-</td>
              ))}
            </tr>

            {/* Action buttons CTA */}
            <tr>
              <td class="p-6 font-bold text-slate-500 bg-slate-50/20">Aksi</td>
              {compareList.map((prod) => (
                <td key={prod.id} class="p-6">
                  <button 
                    onClick={() => addToCart(prod, 1)}
                    disabled={prod.stock === 0}
                    class="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-1.5 focus:outline-none transition-all mx-auto text-[10px]"
                  >
                    <ShoppingCart size={12} />
                    <span>Beli</span>
                  </button>
                </td>
              ))}
              {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <td key={i} class="p-6"></td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Compare;
