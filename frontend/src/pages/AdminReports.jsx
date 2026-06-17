import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../services/api';
import { Download, FileText, File, Calendar, Filter } from 'lucide-react';

const AdminReports = () => {
  const { user } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (filters.startDate) query.append('startDate', filters.startDate);
      if (filters.endDate) query.append('endDate', filters.endDate);
      if (filters.category && filters.category !== 'all') {
        query.append('category', filters.category);
      }

      const data = await apiCall(`/api/reports?${query.toString()}`);
      setOrders(data.orders);
      setCategories(data.categories);
    } catch (err) {
      setError(err.message || 'Gagal mengambil data laporan');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories on mount
  useEffect(() => {
    fetchReportData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = () => {
    fetchReportData();
  };

  const handleExport = (format) => {
    const query = new URLSearchParams();
    if (filters.startDate) query.append('startDate', filters.startDate);
    if (filters.endDate) query.append('endDate', filters.endDate);
    if (filters.category && filters.category !== 'all') {
      query.append('category', filters.category);
    }

    const url = `/api/reports/export/${format}?${query.toString()}`;
    window.location.href = url;
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Akses Ditolak</h2>
          <p className="text-gray-600">Hanya admin yang dapat mengakses halaman ini</p>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.net_amount || 0), 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">📊 Laporan Penjualan</h1>
          <p className="text-slate-600">Kelola dan analisis data penjualan E-Computer</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter size={20} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-slate-900">Filter Laporan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Tanggal Mulai
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Tanggal Akhir
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Apply Filter Button */}
            <div className="flex items-end">
              <button
                onClick={handleApplyFilter}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Memuat...' : 'Terapkan Filter'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Orders */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Order</p>
                <h3 className="text-3xl font-bold mt-2">{orders.length}</h3>
              </div>
              <div className="bg-blue-400 bg-opacity-30 p-3 rounded-lg">
                <FileText size={24} />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-2">{formatCurrency(totalRevenue)}</h3>
              </div>
              <div className="bg-green-400 bg-opacity-30 p-3 rounded-lg">
                <Download size={24} />
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-sm font-medium">Rata-rata Order</p>
                <h3 className="text-2xl font-bold mt-2">{formatCurrency(averageOrderValue)}</h3>
              </div>
              <div className="bg-purple-400 bg-opacity-30 p-3 rounded-lg">
                <File size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Export Laporan</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => handleExport('html')}
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <FileText size={20} />
              Export HTML
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <File size={20} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <th className="px-6 py-3 text-left text-sm font-semibold">ID Order</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Tanggal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Pengiriman</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map(order => (
                    <tr key={order.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{order.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(order.order_date)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          {order.shipping_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Selesai' || order.status === 'Sudah Diambil'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'Diproses' || order.status === 'Siap Diambil'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right text-slate-900">
                        {formatCurrency(order.net_amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-600">
                      {loading ? 'Memuat data...' : 'Tidak ada data laporan untuk filter yang dipilih'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
