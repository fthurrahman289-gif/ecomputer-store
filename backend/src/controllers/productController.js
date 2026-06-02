const { poolPromise, sql } = require('../config/db');

// Get all products with dynamic filtering and search
const getProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, brand, ram, storage, gpu, isNew, isBestSeller, hasDiscount } = req.query;

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT p.*, c.name as category_name 
      FROM dbo.products p
      JOIN dbo.categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    if (search) {
      request.input('search', sql.NVarChar, `%${search}%`);
      query += ` AND (p.name LIKE @search OR p.description LIKE @search OR p.brand LIKE @search)`;
    }

    if (category) {
      request.input('category', sql.VarChar, category);
      query += ` AND (c.slug = @category OR CAST(c.id AS VARCHAR) = @category)`;
    }

    if (minPrice) {
      request.input('minPrice', sql.Decimal, parseFloat(minPrice));
      query += ` AND p.price >= @minPrice`;
    }

    if (maxPrice) {
      request.input('maxPrice', sql.Decimal, parseFloat(maxPrice));
      query += ` AND p.price <= @maxPrice`;
    }

    if (brand) {
      request.input('brand', sql.NVarChar, brand);
      query += ` AND p.brand = @brand`;
    }

    if (ram) {
      request.input('ram', sql.VarChar, `%${ram}%`);
      query += ` AND p.spec_ram LIKE @ram`;
    }

    if (storage) {
      request.input('storage', sql.VarChar, `%${storage}%`);
      query += ` AND p.spec_storage LIKE @storage`;
    }

    if (gpu) {
      request.input('gpu', sql.VarChar, `%${gpu}%`);
      query += ` AND p.spec_gpu LIKE @gpu`;
    }

    if (isNew === 'true') {
      query += ` AND p.is_new = 1`;
    }

    if (isBestSeller === 'true') {
      query += ` AND p.is_best_seller = 1`;
    }

    if (hasDiscount === 'true') {
      query += ` AND p.discount_percent > 0`;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await request.query(query);

    // Format image_urls to JS arrays
    const products = result.recordset.map(p => {
      try {
        p.image_urls = JSON.parse(p.image_urls);
      } catch (e) {
        p.image_urls = [p.image_urls];
      }
      return p;
    });

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil produk', error: error.message });
  }
};

// Get single product details
const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.*, c.name as category_name 
        FROM dbo.products p
        JOIN dbo.categories c ON p.category_id = c.id
        WHERE p.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const product = result.recordset[0];
    try {
      product.image_urls = JSON.parse(product.image_urls);
    } catch (e) {
      product.image_urls = [product.image_urls];
    }

    // Get recommendations (same category, excluding current product)
    const recsResult = await pool.request()
      .input('categoryId', sql.Int, product.category_id)
      .input('productId', sql.Int, product.id)
      .query('SELECT TOP 4 * FROM dbo.products WHERE category_id = @categoryId AND id != @productId ORDER BY is_best_seller DESC, is_new DESC');

    const recommendations = recsResult.recordset.map(p => {
      try {
        p.image_urls = JSON.parse(p.image_urls);
      } catch (e) {
        p.image_urls = [p.image_urls];
      }
      return p;
    });

    res.json({ product, recommendations });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil detail produk', error: error.message });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM dbo.categories ORDER BY name');
    res.json(result.recordset);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil kategori', error: error.message });
  }
};

// Admin: Add new product
const addProduct = async (req, res) => {
  const { category_id, name, brand, price, stock, description, image_urls, spec_ram, spec_storage, spec_cpu, spec_gpu, weight, is_best_seller, is_new, discount_percent } = req.body;

  if (!category_id || !name || !brand || !price || !image_urls) {
    return res.status(400).json({ message: 'Kategori, Nama, Brand, Harga, dan Gambar wajib diisi' });
  }

  try {
    const pool = await poolPromise;
    const imgString = typeof image_urls === 'string' ? image_urls : JSON.stringify(image_urls);

    await pool.request()
      .input('category_id', sql.Int, category_id)
      .input('name', sql.NVarChar, name)
      .input('brand', sql.NVarChar, brand)
      .input('price', sql.Decimal, parseFloat(price))
      .input('stock', sql.Int, parseInt(stock) || 0)
      .input('description', sql.NVarChar, description || null)
      .input('image_urls', sql.NVarChar, imgString)
      .input('spec_ram', sql.VarChar, spec_ram || null)
      .input('spec_storage', sql.VarChar, spec_storage || null)
      .input('spec_cpu', sql.VarChar, spec_cpu || null)
      .input('spec_gpu', sql.VarChar, spec_gpu || null)
      .input('weight', sql.Decimal, parseFloat(weight) || null)
      .input('is_best_seller', sql.Bit, is_best_seller ? 1 : 0)
      .input('is_new', sql.Bit, is_new ? 1 : 0)
      .input('discount_percent', sql.Int, parseInt(discount_percent) || 0)
      .query(`
        INSERT INTO dbo.products 
        (category_id, name, brand, price, stock, description, image_urls, spec_ram, spec_storage, spec_cpu, spec_gpu, weight, is_best_seller, is_new, discount_percent)
        VALUES 
        (@category_id, @name, @brand, @price, @stock, @description, @image_urls, @spec_ram, @spec_storage, @spec_cpu, @spec_gpu, @weight, @is_best_seller, @is_new, @discount_percent)
      `);

    res.status(201).json({ message: 'Produk berhasil ditambahkan' });
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
    const pool = await poolPromise;
    const imgString = typeof image_urls === 'string' ? image_urls : JSON.stringify(image_urls);

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('category_id', sql.Int, category_id)
      .input('name', sql.NVarChar, name)
      .input('brand', sql.NVarChar, brand)
      .input('price', sql.Decimal, parseFloat(price))
      .input('stock', sql.Int, parseInt(stock) || 0)
      .input('description', sql.NVarChar, description || null)
      .input('image_urls', sql.NVarChar, imgString)
      .input('spec_ram', sql.VarChar, spec_ram || null)
      .input('spec_storage', sql.VarChar, spec_storage || null)
      .input('spec_cpu', sql.VarChar, spec_cpu || null)
      .input('spec_gpu', sql.VarChar, spec_gpu || null)
      .input('weight', sql.Decimal, parseFloat(weight) || null)
      .input('is_best_seller', sql.Bit, is_best_seller ? 1 : 0)
      .input('is_new', sql.Bit, is_new ? 1 : 0)
      .input('discount_percent', sql.Int, parseInt(discount_percent) || 0)
      .query(`
        UPDATE dbo.products 
        SET category_id = @category_id, 
            name = @name, 
            brand = @brand, 
            price = @price, 
            stock = @stock, 
            description = @description, 
            image_urls = @image_urls, 
            spec_ram = @spec_ram, 
            spec_storage = @spec_storage, 
            spec_cpu = @spec_cpu, 
            spec_gpu = @spec_gpu, 
            weight = @weight, 
            is_best_seller = @is_best_seller, 
            is_new = @is_new, 
            discount_percent = @discount_percent
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
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
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.products WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat menghapus produk', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  addProduct,
  updateProduct,
  deleteProduct
};
