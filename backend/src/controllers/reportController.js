const { poolPromise, sql } = require('../config/db');
const { generateHTMLReport, generatePDFReport } = require('../utils/reportGenerator');

// Get Report Data with Filters
const getReportData = async (req, res) => {
  const { startDate, endDate, category } = req.query;

  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        o.id,
        o.user_id,
        u.name as customer_name,
        o.order_date,
        o.status,
        o.shipping_method,
        o.total_amount,
        o.discount_amount,
        o.net_amount,
        o.payment_method,
        COUNT(DISTINCT od.id) as item_count
      FROM dbo.orders o
      JOIN dbo.users u ON o.user_id = u.id
      LEFT JOIN dbo.order_details od ON o.id = od.order_id
      WHERE 1=1
    `;

    const request = pool.request();

    // Add date filter
    if (startDate) {
      query += ` AND o.order_date >= @startDate`;
      request.input('startDate', sql.DateTime, new Date(startDate));
    }
    if (endDate) {
      // Add 1 day to endDate to include the entire end date
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      query += ` AND o.order_date < @endDate`;
      request.input('endDate', sql.DateTime, endDateObj);
    }

    // Add category filter
    if (category && category !== 'all') {
      query += `
        AND o.id IN (
          SELECT DISTINCT od.order_id
          FROM dbo.order_details od
          JOIN dbo.products p ON od.product_id = p.id
          JOIN dbo.categories c ON p.category_id = c.id
          WHERE c.slug = @category
        )
      `;
      request.input('category', sql.VarChar, category);
    }

    query += ` GROUP BY o.id, o.user_id, u.name, o.order_date, o.status, o.shipping_method, o.total_amount, o.discount_amount, o.net_amount, o.payment_method
               ORDER BY o.order_date DESC`;

    const result = await request.query(query);

    // Get categories for filter
    const categoriesRes = await pool.request()
      .query('SELECT id, name, slug FROM dbo.categories ORDER BY name');

    res.json({
      orders: result.recordset,
      categories: categoriesRes.recordset,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        category: category || null
      }
    });
  } catch (error) {
    console.error('Get report data error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data laporan', error: error.message });
  }
};

// Export Report as HTML
const exportReportHTML = async (req, res) => {
  const { startDate, endDate, category } = req.query;

  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        o.id,
        o.user_id,
        u.name as customer_name,
        o.order_date,
        o.status,
        o.shipping_method,
        o.total_amount,
        o.discount_amount,
        o.net_amount,
        o.payment_method
      FROM dbo.orders o
      JOIN dbo.users u ON o.user_id = u.id
      WHERE 1=1
    `;

    const request = pool.request();

    if (startDate) {
      query += ` AND o.order_date >= @startDate`;
      request.input('startDate', sql.DateTime, new Date(startDate));
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      query += ` AND o.order_date < @endDate`;
      request.input('endDate', sql.DateTime, endDateObj);
    }

    if (category && category !== 'all') {
      query += `
        AND o.id IN (
          SELECT DISTINCT od.order_id
          FROM dbo.order_details od
          JOIN dbo.products p ON od.product_id = p.id
          JOIN dbo.categories c ON p.category_id = c.id
          WHERE c.slug = @category
        )
      `;
      request.input('category', sql.VarChar, category);
    }

    query += ` ORDER BY o.order_date DESC`;

    const result = await request.query(query);
    const htmlContent = generateHTMLReport(result.recordset, {
      category: category || null,
      startDate: startDate || null,
      endDate: endDate || null
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-penjualan-${new Date().toISOString().split('T')[0]}.html"`);
    res.send(htmlContent);
  } catch (error) {
    console.error('Export HTML report error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengexport laporan HTML', error: error.message });
  }
};

// Export Report as PDF
const exportReportPDF = async (req, res) => {
  const { startDate, endDate, category } = req.query;

  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        o.id,
        o.user_id,
        u.name as customer_name,
        o.order_date,
        o.status,
        o.shipping_method,
        o.total_amount,
        o.discount_amount,
        o.net_amount,
        o.payment_method
      FROM dbo.orders o
      JOIN dbo.users u ON o.user_id = u.id
      WHERE 1=1
    `;

    const request = pool.request();

    if (startDate) {
      query += ` AND o.order_date >= @startDate`;
      request.input('startDate', sql.DateTime, new Date(startDate));
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      query += ` AND o.order_date < @endDate`;
      request.input('endDate', sql.DateTime, endDateObj);
    }

    if (category && category !== 'all') {
      query += `
        AND o.id IN (
          SELECT DISTINCT od.order_id
          FROM dbo.order_details od
          JOIN dbo.products p ON od.product_id = p.id
          JOIN dbo.categories c ON p.category_id = c.id
          WHERE c.slug = @category
        )
      `;
      request.input('category', sql.VarChar, category);
    }

    query += ` ORDER BY o.order_date DESC`;

    const result = await request.query(query);
    const doc = await generatePDFReport(result.recordset, {
      category: category || null,
      startDate: startDate || null,
      endDate: endDate || null
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-penjualan-${new Date().toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);
  } catch (error) {
    console.error('Export PDF report error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengexport laporan PDF', error: error.message });
  }
};

module.exports = {
  getReportData,
  exportReportHTML,
  exportReportPDF
};
