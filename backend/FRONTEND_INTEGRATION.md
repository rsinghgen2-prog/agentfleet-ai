# 🎨 Frontend Integration Guide

## Overview

This guide explains how to integrate the React frontend with the backend microservices for authentication, user management, and role-based dashboard routing.

---

## 🔐 Authentication Flow

### **1. Login Process**

```typescript
// src/services/authService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      permissions: string[];
    };
    tenant: {
      id: string;
      slug: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    dashboardRoute: string;
  };
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, credentials);
    return response.data;
  }

  static async logout(): Promise<void> {
    const token = this.getToken();
    await axios.post(`${API_BASE_URL}/api/v1/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    this.clearTokens();
  }

  static saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  static getToken(): string | null {
    return localStorage.setItem('accessToken');
  }

  static clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
```

---

### **2. Update Login Page**

```typescript
// src/pages/Login.tsx (Updated)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    tenantSlug: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await AuthService.login(credentials);

      // Save tokens
      AuthService.saveTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );

      // Save user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('isLoggedIn', 'true');

      // Check if super admin
      if (response.data.user.role === 'super_admin') {
        localStorage.setItem('isSuperAdmin', 'true');
      }

      // Redirect to appropriate dashboard
      navigate(response.data.dashboardRoute);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full"
      >
        <h1 className="text-3xl font-bold mb-6 text-center gradient-text">
          Welcome Back
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Organization Slug */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization
            </label>
            <input
              type="text"
              placeholder="your-organization"
              value={credentials.tenantSlug}
              onChange={(e) => setCredentials({...credentials, tenantSlug: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty if you're a super admin
            </p>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
```

---

### **3. Create Axios Interceptor**

```typescript
// src/config/axios.ts
import axios from 'axios';
import { AuthService } from '../services/authService';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refreshToken
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        AuthService.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

### **4. Protected Route Component**

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = AuthService.isAuthenticated();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

---

### **5. Update App.tsx with Protected Routes**

```typescript
// src/App.tsx (Updated)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboards
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SemiAdminDashboard from './pages/SemiAdminDashboard';
import Dashboard from './pages/Dashboard';
import DentalDashboard from './pages/DentalDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboards */}
        <Route 
          path="/super-admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/semi-admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['semi_admin']}>
              <SemiAdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dental-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['doctor', 'dentist']}>
              <DentalDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🔄 Role-Based Dashboard Routing

**Automatic Redirect After Login:**

| Role | Dashboard Route |
|------|----------------|
| `super_admin` | `/super-admin-dashboard` |
| `admin` | `/admin-dashboard` |
| `semi_admin` | `/semi-admin-dashboard` |
| `doctor`, `dentist` | `/dental-dashboard` |
| `teacher` | `/school-dashboard` |
| `customer`, default | `/dashboard` |

---

## 📦 Environment Variables

**`.env` file:**
```env
VITE_API_URL=http://localhost:3000
VITE_TENANT_SLUG=your-organization
```

**Production:**
```env
VITE_API_URL=https://api.agentfleet.ai
```

---

## ✅ Testing the Flow

1. **User visits homepage** → `/`
2. **Clicks login** → `/login`
3. **Enters credentials** with organization slug
4. **Backend authenticates** and returns role + dashboard route
5. **Frontend redirects** to appropriate dashboard
6. **Protected route checks** authentication and role
7. **Dashboard loads** with user-specific data

---

**Version:** 1.0  
**Last Updated:** July 23, 2026
