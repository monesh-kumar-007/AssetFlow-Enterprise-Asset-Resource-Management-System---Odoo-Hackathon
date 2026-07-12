import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to dynamically attach the Auth header
const getAuthConfig = () => {
  const token = localStorage.getItem('token'); // Assumes token is saved on login
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const fetchAssetDirectory = async (filters = {}) => {
  // Converts filters object to query params (e.g., ?search=laptop&status=Available)
  const params = new URLSearchParams(filters).toString();
  const response = await axios.get(`${API_URL}/directory?${params}`, getAuthConfig());
  return response.data;
};

export const registerNewAsset = async (assetData) => {
  const response = await axios.post(`${API_URL}/register`, assetData, getAuthConfig());
  return response.data;
};

// Helper fetch to get categories (needed to populate the registration form dropdowns)
export const fetchCategories = async () => {
  const response = await axios.get(`${API_URL}/categories`, getAuthConfig());
  return response.data;
};