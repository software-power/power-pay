#!/bin/bash

# Power-Pay Dashboard - Complete File Generator
# This creates ALL dashboard files

echo "Creating complete Power-Pay Dashboard..."

# ============================================================================
# MAIN FILES
# ============================================================================

cat > src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.table-compact thead th {
  @apply py-2 px-3 font-semibold bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-700;
}

.table-compact tbody td {
  @apply py-2 px-3 border-b border-gray-200 text-sm;
}

.table-compact tbody tr:hover {
  @apply bg-gray-50 cursor-pointer;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  transition: width 0.3s ease;
}
EOF

cat > src/App.jsx << 'EOF'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ApiKeys from './pages/ApiKeys';
import Transactions from './pages/Transactions';
import TransactionView from './pages/TransactionView';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {isAuthenticated ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="api-keys" element={<ApiKeys />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transactions/:id" element={<TransactionView />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
EOF

# ============================================================================
# STORE
# ============================================================================

cat > src/store/authStore.js << 'EOF'
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
EOF

# ============================================================================
# SERVICES
# ============================================================================

cat > src/services/api.js << 'EOF'
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  logout: () => api.post('/api/auth/logout'),
};

// Users endpoints
export const usersAPI = {
  getAll: () => api.get('/api/users'),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
};

// API Keys endpoints
export const apiKeysAPI = {
  getAll: () => api.get('/api/api-keys'),
  create: (data) => api.post('/api/api-keys', data),
  revoke: (id) => api.post(`/api/api-keys/${id}/revoke`),
  getStats: () => api.get('/api/api-keys/stats'),
};

// Transactions endpoints
export const transactionsAPI = {
  lookup: (reference) => api.get(`/api/payments/lookup?reference=${reference}`),
  getById: (id) => api.get(`/api/transactions/${id}`),
  getHistory: (clientSystem, params) => api.get(`/api/transactions/history/${clientSystem}`, { params }),
};
EOF

cat > src/utils/formatters.js << 'EOF'
export const formatCurrency = (amount, currency = 'TZS') => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date) => {
  if (!date) return '-';
  const now = new Date();
  const then = new Date(date);
  const diff = now - then;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const getStatusColor = (status) => {
  const colors = {
    SUCCESS: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-blue-100 text-blue-800',
    FAILED: 'bg-red-100 text-red-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};
EOF

echo "✅ All files created successfully!"
echo ""
echo "Total files created:"
find src -type f | wc -l
