import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (email, password) =>
  api.post('/auth/login/json', { email, password });
export const getMe = () => api.get('/auth/me');

// Stocks
export const searchStocks = (q) => api.get('/stocks/search', { params: { q } });
export const getStockInfo = (symbol) => api.get(`/stocks/info/${symbol}`);
export const getHistorical = (symbol, period = '1y', interval = '1d') =>
  api.get(`/stocks/historical/${symbol}`, { params: { period, interval } });
export const runForecast = (payload) => api.post('/stocks/forecast', payload);
export const compareStocks = (symbols) => api.post('/stocks/compare', { symbols });
export const getPopular = () => api.get('/stocks/popular');

// Watchlist
export const getWatchlists = () => api.get('/watchlist/');
export const createWatchlist = (name) => api.post('/watchlist/', { name });
export const addToWatchlist = (watchlistId, symbol, company_name) =>
  api.post(`/watchlist/${watchlistId}/items`, { symbol, company_name });
export const removeFromWatchlist = (watchlistId, itemId) =>
  api.delete(`/watchlist/${watchlistId}/items/${itemId}`);
export const deleteWatchlist = (id) => api.delete(`/watchlist/${id}`);

// Performance
export const getPerformanceSummary = () => api.get('/performance/summary');
export const evaluateModel = (symbol, model = 'ensemble') =>
  api.post(`/performance/evaluate/${symbol}`, null, { params: { model } });
export const listPerformance = (symbol) =>
  api.get('/performance/models', { params: { symbol } });

export default api;
