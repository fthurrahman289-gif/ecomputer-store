const PDFDocument = require('pdfkit');

// Format currency to IDR
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Format date
const formatDate = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

// Generate HTML Report
const generateHTMLReport = (orders, filters = {}) => {
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.net_amount || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  let filterText = 'Semua Data';
  if (filters.category && filters.startDate && filters.endDate) {
    filterText = `Kategori: ${filters.category} | ${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`;
  } else if (filters.category) {
    filterText = `Kategori: ${filters.category}`;
  } else if (filters.startDate && filters.endDate) {
    filterText = `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`;
  }

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Penjualan E-Computer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #2563eb;
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 14px;
        }
        
        .filter-info {
            background: #f0f4ff;
            padding: 12px 20px;
            border-left: 4px solid #2563eb;
            margin-bottom: 30px;
            border-radius: 4px;
            color: #333;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
        }
        
        .stat-card:nth-child(2) {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .stat-card:nth-child(3) {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 13px;
            opacity: 0.9;
        }
        
        .table-container {
            overflow-x: auto;
            margin-bottom: 40px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        table thead {
            background: #2563eb;
            color: white;
        }
        
        table th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        table tbody tr:hover {
            background: #f9fafb;
        }
        
        table tbody tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .status {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status.completed {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status.processing {
            background: #fed7aa;
            color: #92400e;
        }
        
        .status.pending {
            background: #fecaca;
            color: #991b1b;
        }
        
        .status.pickup {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #666;
            font-size: 12px;
        }
        
        .print-info {
            text-align: center;
            color: #999;
            font-size: 11px;
            margin-top: 20px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                padding: 0;
            }
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .stats {
                grid-template-columns: 1fr;
            }
            table {
                font-size: 13px;
            }
            table th, table td {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💻 E-Computer</h1>
            <h2>Laporan Penjualan</h2>
            <p>${formatDate(new Date())}</p>
        </div>
        
        <div class="filter-info">
            <strong>Filter:</strong> ${filterText}
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${totalOrders}</div>
                <div class="stat-label">Total Order</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatCurrency(totalRevenue)}</div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatCurrency(averageOrderValue)}</div>
                <div class="stat-label">Rata-rata Order Value</div>
            </div>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID Order</th>
                        <th>Customer</th>
                        <th>Tanggal</th>
                        <th>Metode Pengiriman</th>
                        <th>Status</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td><strong>#${order.id}</strong></td>
                            <td>${order.customer_name}</td>
                            <td>${formatDate(order.order_date)}</td>
                            <td>${order.shipping_method}</td>
                            <td>
                                <span class="status ${getStatusClass(order.status)}">
                                    ${order.status}
                                </span>
                            </td>
                            <td>${formatCurrency(order.net_amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p><strong>E-Computer Indonesia</strong></p>
            <p>Ruko Cyber Mall Lantai 2, Jakarta</p>
            <p>© ${new Date().getFullYear()} Semua Hak Cipta Dilindungi Undang-Undang</p>
        </div>
        
        <div class="print-info">
            <p>Laporan ini dibuat otomatis oleh sistem E-Computer</p>
            <p>Waktu cetak: ${new Date().toLocaleString('id-ID')}</p>
        </div>
    </div>
    
    <script>
        // Auto-print on page load (optional)
        // window.print();
    </script>
</body>
</html>
  `;

  return html;
};

// Helper function to get status CSS class
const getStatusClass = (status) => {
  const statusMap = {
    'Selesai': 'completed',
    'Sudah Diambil': 'completed',
    'Diproses': 'processing',
    'Siap Diambil': 'pickup',
    'Menunggu Verifikasi': 'pending',
    'Menunggu Pembayaran': 'pending',
  };
  return statusMap[status] || 'pending';
};

// Generate PDF Report
const generatePDFReport = (orders, filters = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
      });

      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.net_amount || 0), 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('LAPORAN PENJUALAN', 0, 40, { align: 'center' });
      doc.fontSize(14).font('Helvetica').text('E-Computer Indonesia', { align: 'center' });
      doc.fontSize(10).text(`Tanggal: ${formatDate(new Date())}`, { align: 'center' });
      doc.moveDown(1);

      // Filter Info
      let filterText = 'Semua Data';
      if (filters.category && filters.startDate && filters.endDate) {
        filterText = `Kategori: ${filters.category} | ${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`;
      } else if (filters.category) {
        filterText = `Kategori: ${filters.category}`;
      } else if (filters.startDate && filters.endDate) {
        filterText = `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`;
      }
      doc.fontSize(10).text(`Filter: ${filterText}`);
      doc.moveDown(1);

      // Stats
      const statsY = doc.y;
      doc.rect(40, statsY, 170, 60).stroke();
      doc.fontSize(12).font('Helvetica-Bold').text('Total Order', 50, statsY + 5);
      doc.fontSize(16).text(totalOrders.toString(), 50, statsY + 25);

      doc.rect(220, statsY, 170, 60).stroke();
      doc.fontSize(12).font('Helvetica-Bold').text('Total Revenue', 230, statsY + 5);
      doc.fontSize(14).text(formatCurrency(totalRevenue), 230, statsY + 25);

      doc.rect(400, statsY, 150, 60).stroke();
      doc.fontSize(12).font('Helvetica-Bold').text('Rata-rata Order', 410, statsY + 5);
      doc.fontSize(13).text(formatCurrency(averageOrderValue), 410, statsY + 25);

      doc.moveDown(5);

      // Table
      doc.fontSize(10);
      const tableTop = doc.y;
      const rows = [
        ['ID', 'Customer', 'Tanggal', 'Pengiriman', 'Status', 'Total']
      ];

      orders.forEach(order => {
        rows.push([
          `#${order.id}`,
          order.customer_name.substring(0, 15),
          formatDate(order.order_date),
          order.shipping_method.substring(0, 10),
          order.status.substring(0, 12),
          formatCurrency(order.net_amount)
        ]);
      });

      const colWidths = [50, 90, 70, 80, 90, 110];
      let y = tableTop;

      // Header
      doc.font('Helvetica-Bold').fillColor('#2563eb');
      const headerY = y;
      rows[0].forEach((text, i) => {
        doc.text(text, 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] });
      });
      doc.moveTo(40, y + 15).lineTo(550, y + 15).stroke();
      y += 20;

      // Body
      doc.font('Helvetica').fillColor('#000000');
      for (let i = 1; i < rows.length; i++) {
        if (y > 750) {
          doc.addPage();
          y = 40;
        }
        rows[i].forEach((text, j) => {
          doc.text(text, 40 + colWidths.slice(0, j).reduce((a, b) => a + b, 0), y, { width: colWidths[j] });
        });
        y += 15;
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#666666');
      doc.text('© E-Computer Indonesia. Semua Hak Cipta Dilindungi Undang-Undang', { align: 'center' });
      doc.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });

      doc.end();
      resolve(doc);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateHTMLReport,
  generatePDFReport,
  formatCurrency,
  formatDate,
  getStatusClass
};
