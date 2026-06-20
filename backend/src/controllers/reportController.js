const { query } = require('../config/db');
const { generateHTMLReport, generatePDFReport } = require('../utils/reportGenerator');

// Get Report Data with Filters
const getReportData = async (req, res) => {
  const { startDate, endDate, category } = req.query;

  try {
    let sqlQuery = `
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
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_details od ON o.id = od.order_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Add date filter
    if (startDate) {
      sqlQuery += ` AND o.order_date >= $${paramIndex}`;
      params.push(new Date(startDate));
      paramIndex++;
    }
    if (endDate) {
      // Add 1 day to endDate to include the entire end date
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      sqlQuery += ` AND o.order_date < $${paramIndex}`;
      params.push(endDateObj);
      paramIndex++;
    }

    // Add category filter
    if (category && category !== 'all') {
      sqlQuery += `
        AND o.id IN (
          SELECT DISTINCT od.order_id
          FROM order_details od
          JOIN products p ON od.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          WHERE c.slug = $${paramIndex}
        )
      `;
      params.push(category);
      paramIndex++;
    }

    sqlQuery += ` GROUP BY o.id, o.user_id, u.name, o.order_date, o.status, o.shipping_method, o.total_amount, o.discount_amount, o.net_amount, o.payment_method
               ORDER BY o.order_date DESC`;

    const result = await query(sqlQuery, params);

    // Get categories for filter
    const categoriesRes = await query('SELECT id, name, slug FROM categories ORDER BY name');

    res.json({
      orders: result.rows,
      categories: categoriesRes.rows,
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
    let sqlQuery = `
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
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (startDate) {
      sqlQuery += ` AND o.order_date >= $${paramIndex}`;
      params.push(new Date(startDate));
      paramIndex++;
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      sqlQuery += ` AND o.order_date < $${paramIndex}`;
      params.push(endDateObj);
      paramIndex++;
    }

    if (category && category !== 'all') {
      sqlQuery += `
        AND o.id IN (
          SELECT DISTINCT od.order_id
          FROM order_details od
          JOIN products p ON od.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          WHERE c.slug = $${paramIndex}
        )
      `;
      params.push(category);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY o.order_date DESC`;

    const result = await query(sqlQuery, params);
    const htmlContent = generateHTMLReport(result.rows, {
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
    let sqlQuery = `
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
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (startDate) {
      sqlQuery += ` AND o.order_date >= $${paramIndex}`;
      params.push(new Date(startDate));
      paramIndex++;
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      sqlQuery += ` AND o.order_date < $${paramIndex}`;
      params.push(endDateObj);
      paramIndex++;
    }

    if (category && category !== 'all') {
      sqlQuery += `
        AND o.id IN (
          SELECT DISTINCT od.order_id
          FROM order_details od
          JOIN products p ON od.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          WHERE c.slug = $${paramIndex}
        )
      `;
      params.push(category);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY o.order_date DESC`;

    const result = await query(sqlQuery, params);
    const doc = await generatePDFReport(result.rows, {
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
