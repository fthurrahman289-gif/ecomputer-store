const { query } = require('../config/db');

// Get all products with dynamic filtering and search
const getProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, brand, ram, storage, gpu, isNew, isBestSeller, hasDiscount } = req.query;

  try {
    let sqlQuery = `
      SELECT p.*, c.name as category_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      sqlQuery += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.brand ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (category) {
      sqlQuery += ` AND (c.slug = $${paramCount} OR CAST(c.id AS VARCHAR) = $${paramCount})`;
      params.push(category);
      paramCount++;
    }

    if (minPrice) {
      sqlQuery += ` AND p.price >= $${paramCount}`;
      params.push(parseFloat(minPrice));
      paramCount++;
    }

    if (maxPrice) {
      sqlQuery += ` AND p.price <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
      paramCount++;
    }

    if (brand) {
      sqlQuery += ` AND p.brand = $${paramCount}`;
      params.push(brand);
      paramCount++;
    }

    if (ram) {
      sqlQuery += ` AND p.spec_ram ILIKE $${paramCount}`;
      params.push(`%${ram}%`);
      paramCount++;
    }

    if (storage) {
      sqlQuery += ` AND p.spec_storage ILIKE $${paramCount}`;
      params.push(`%${storage}%`);
      paramCount++;
    }

    if (gpu) {
      sqlQuery += ` AND p.spec_gpu ILIKE $${paramCount}`;
      params.push(`%${gpu}%`);
      paramCount++;
    }

    if (isNew === 'true') {
      sqlQuery += ` AND p.is_new = true`;
    }

    if (isBestSeller === 'true') {
      sqlQuery += ` AND p.is_best_seller = true`;
    }

    if (hasDiscount === 'true') {
      sqlQuery += ` AND p.discount_percent > 0`;
    }

    sqlQuery += ' ORDER BY p.created_at DESC';

    const result = await query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil produk', error: error.message });
  }
};

// Get single product details
const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(`
      SELECT p.*, c.name as category_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const product = result.rows[0];

    // Get recommendations (same category, excluding current product)
    const recsResult = await query(
      'SELECT * FROM products WHERE category_id = $1 AND id != $2 ORDER BY is_best_seller DESC, is_new DESC LIMIT 4',
      [product.category_id, id]
    );

    res.json({ product, recommendations: recsResult.rows });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil detail produk', error: error.message });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil kategori', error: error.message });
  }
};

// Admin: Add new product
const addProduct = async (req, res) => {
  const { category_id, name, brand, price, stock, description, image_urls, spec_ram, spec_storage, spec_cpu, spec_gpu, weight, is_best_seller, is_new, discount_percent } = req.body;

  if (!category_id || !name || !brand || !price || !image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
    return res.status(400).json({ message: 'Kategori, Nama, Brand, Harga, dan setidaknya satu Gambar wajib diisi' });
  }

  try {
    // image_urls stored as JSONB in PostgreSQL
    const result = await query(
      `INSERT INTO products 
       (category_id, name, brand, price, stock, description, image_urls, spec_ram, spec_storage, spec_cpu, spec_gpu, weight, is_best_seller, is_new, discount_percent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [category_id, name, brand, parseFloat(price), parseInt(stock) || 0, description || null, JSON.stringify(image_urls), spec_ram || null, spec_storage || null, spec_cpu || null, spec_gpu || null, parseFloat(weight) || null, is_best_seller ? true : false, is_new ? true : false, parseInt(discount_percent) || 0]
    );

    res.status(201).json({ message: 'Produk berhasil ditambahkan', productId: result.rows[0].id });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat menambahkan produk', error: error.message });
  }
};

// Admin: Edit product
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { category_id, name, brand, price, stock, description, image_urls, spec_ram, spec_storage, spec_cpu, spec_gpu, weight, is_best_seller, is_new, discount_percent } = req.body;

  try {
    const imgData = Array.isArray(image_urls) ? JSON.stringify(image_urls) : image_urls;

    const result = await query(
      `UPDATE products 
       SET category_id = $1, 
           name = $2, 
           brand = $3, 
           price = $4, 
           stock = $5, 
           description = $6, 
           image_urls = $7, 
           spec_ram = $8, 
           spec_storage = $9, 
           spec_cpu = $10, 
           spec_gpu = $11, 
           weight = $12, 
           is_best_seller = $13, 
           is_new = $14, 
           discount_percent = $15,
           updated_at = NOW()
       WHERE id = $16`,
      [category_id, name, brand, parseFloat(price), parseInt(stock) || 0, description || null, imgData, spec_ram || null, spec_storage || null, spec_cpu || null, spec_gpu || null, parseFloat(weight) || null, is_best_seller ? true : false, is_new ? true : false, parseInt(discount_percent) || 0, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    res.json({ message: 'Produk berhasil diperbarui' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat memperbarui produk', error: error.message });
  }
};

// Admin: Delete product
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM products WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat menghapus produk', error: error.message });
  }
};

// Admin: Upload product images
const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Tidak ada file gambar yang diunggah' });
    }
    const filePaths = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ filePaths });
  } catch (error) {
    console.error('Upload product images error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengunggah gambar', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages
};
