const { poolPromise, sql } = require('../config/db');

// Get wishlist items for the logged-in user
const getWishlist = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query(`
        SELECT w.id as wishlist_id, w.created_at, p.* 
        FROM dbo.wishlist w
        JOIN dbo.products p ON w.product_id = p.id
        WHERE w.user_id = @userId
        ORDER BY w.created_at DESC
      `);

    const wishlist = result.recordset.map(item => {
      try {
        item.image_urls = JSON.parse(item.image_urls);
      } catch (e) {
        item.image_urls = [item.image_urls];
      }
      return item;
    });

    res.json(wishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil wishlist', error: error.message });
  }
};

// Add product to wishlist
const addToWishlist = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID wajib disertakan' });
  }

  try {
    const pool = await poolPromise;

    // Check if product exists
    const checkProduct = await pool.request()
      .input('productId', sql.Int, productId)
      .query('SELECT id FROM dbo.products WHERE id = @productId');

    if (checkProduct.recordset.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // Check if already in wishlist
    const checkWish = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .input('productId', sql.Int, productId)
      .query('SELECT id FROM dbo.wishlist WHERE user_id = @userId AND product_id = @productId');

    if (checkWish.recordset.length > 0) {
      return res.status(400).json({ message: 'Produk sudah ada di wishlist' });
    }

    // Insert
    await pool.request()
      .input('userId', sql.Int, req.user.id)
      .input('productId', sql.Int, productId)
      .query('INSERT INTO dbo.wishlist (user_id, product_id) VALUES (@userId, @productId)');

    res.status(201).json({ message: 'Produk ditambahkan ke wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat menambahkan wishlist', error: error.message });
  }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .input('productId', sql.Int, productId)
      .query('DELETE FROM dbo.wishlist WHERE user_id = @userId AND product_id = @productId');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan di wishlist Anda' });
    }

    res.json({ message: 'Produk dihapus dari wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat menghapus dari wishlist', error: error.message });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
