import React, { createContext, useState, useEffect } from 'react';
import { apiCall } from '../services/api';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- AUTH STATE ---
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  // --- CART STATE ---
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // --- WISHLIST STATE ---
  const [wishlist, setWishlist] = useState([]);

  // --- COMPARE STATE ---
  const [compareList, setCompareList] = useState(() => {
    const savedCompare = localStorage.getItem('compare');
    return savedCompare ? JSON.parse(savedCompare) : [];
  });

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('compare', JSON.stringify(compareList));
  }, [compareList]);

  // Load wishlist if logged in
  useEffect(() => {
    if (user && token) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [user, token]);

  // --- AUTH OPERATIONS ---
  const login = async (username, password) => {
    const data = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, username, email, password, phone, address) => {
    return await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, email, password, phone, address })
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setWishlist([]);
  };

  // --- WISHLIST OPERATIONS ---
  const fetchWishlist = async () => {
    try {
      const data = await apiCall('/api/wishlist');
      setWishlist(data);
    } catch (e) {
      console.error('Failed to fetch wishlist', e);
    }
  };

  const addToWishlist = async (product) => {
    if (!user) {
      throw new Error('Anda harus login untuk menyimpan wishlist');
    }
    await apiCall('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId: product.id })
    });
    // Add locally to avoid redundant fetches
    setWishlist(prev => {
      if (prev.some(item => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return;
    await apiCall(`/api/wishlist/${productId}`, {
      method: 'DELETE'
    });
    setWishlist(prev => prev.filter(item => item.id !== parseInt(productId)));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === parseInt(productId));
  };

  // --- CART OPERATIONS ---
  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existingItemIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingItemIndex > -1) {
        const newCart = [...prev];
        const newQty = newCart[existingItemIndex].quantity + quantity;
        if (newQty > product.stock) {
          alert(`Jumlah melebihi stok yang tersedia (${product.stock})`);
          return prev;
        }
        newCart[existingItemIndex].quantity = newQty;
        return newCart;
      } else {
        if (quantity > product.stock) {
          alert(`Jumlah melebihi stok yang tersedia (${product.stock})`);
          return prev;
        }
        return [...prev, { product, quantity }];
      }
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      const item = prev.find(item => item.product.id === productId);
      if (item && quantity > item.product.stock) {
        alert(`Jumlah melebihi stok yang tersedia (${item.product.stock})`);
        return prev;
      }
      return prev.map(item => 
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const discountPrice = item.product.price * (1 - (item.product.discount_percent / 100));
      return total + (discountPrice * item.quantity);
    }, 0);
  };

  // --- COMPARE OPERATIONS ---
  const addToCompare = (product) => {
    setCompareList(prev => {
      // Check if already exists
      if (prev.some(item => item.id === product.id)) {
        alert('Produk sudah ada di daftar perbandingan');
        return prev;
      }
      // Check limit of 3 products
      if (prev.length >= 3) {
        alert('Maksimal perbandingan adalah 3 produk. Hapus salah satu terlebih dahulu.');
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId) => {
    setCompareList(prev => prev.filter(item => item.id !== productId));
  };

  const isInCompare = (productId) => {
    return compareList.some(item => item.id === productId);
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  return (
    <AppContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      
      cart,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,

      wishlist,
      fetchWishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,

      compareList,
      addToCompare,
      removeFromCompare,
      isInCompare,
      clearCompare
    }}>
      {children}
    </AppContext.Provider>
  );
};
