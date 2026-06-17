import React, { useState } from 'react';
import { Upload, X, Plus, GripVertical } from 'lucide-react';

const ProductImageUploader = ({ images, onImagesChange }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const handleFileSelect = async (file, index = null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar yang valid (JPG, PNG, WebP, dll)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file tidak boleh lebih dari 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      const newImages = [...images];
      
      if (index !== null) {
        // Replace existing image
        newImages[index] = base64Data;
      } else {
        // Add new image
        newImages.push(base64Data);
      }
      
      onImagesChange(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e, index = null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0], index);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-slate-500">Gambar Produk</label>
        <span className="text-xs text-slate-400">{images.length} gambar</span>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={image}
                  alt={`Gambar ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Image Controls */}
              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                {/* Move up/down buttons */}
                {images.length > 1 && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(index, index - 1)}
                      disabled={index === 0}
                      className="p-1.5 bg-white rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Pindah ke atas"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, index + 1)}
                      disabled={index === images.length - 1}
                      className="p-1.5 bg-white rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Pindah ke bawah"
                    >
                      ↓
                    </button>
                  </div>
                )}
                
                {/* Edit/Remove buttons */}
                <div className="flex gap-1">
                  <label className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
                    <Upload size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files[0], index)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                    title="Hapus gambar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Image number badge */}
              <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-xs px-2 py-1 rounded font-semibold">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < 5 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <label className="cursor-pointer block">
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-slate-400" />
              <div>
                <p className="font-semibold text-slate-700">
                  Klik atau drag gambar ke sini
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG, WebP, GIF (Maks 5MB, Maksimal 5 gambar)
                </p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      )}

      {images.length === 5 && (
        <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700 font-medium">
            ⚠️ Maksimal 5 gambar sudah tercapai
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductImageUploader;
