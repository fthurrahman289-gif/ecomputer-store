// Base API URL helper uses Vite env variable for production and relative URL for local dev.
const API_URL = import.meta.env.VITE_API_URL || '';

export const API_BASE_URL = API_URL;

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If the body is FormData (such as during payment proof uploads),
  // let the browser set the boundary headers automatically.
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const config = {
      ...options,
      headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const textData = await response.text();
    let data = {};
    
    if (textData) {
      try {
        data = JSON.parse(textData);
      } catch (e) {
        data = { message: textData };
      }
    }

    if (!response.ok) {
      throw new Error(data.message || 'Terjadi kesalahan pada sistem.');
    }

    return data;
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};
