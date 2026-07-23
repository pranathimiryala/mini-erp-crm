import apiClient from './client';
import {
  AuthResponse,
  Customer,
  Product,
  StockMovement,
  Challan,
  DashboardStats,
  FollowUp,
} from '../types';

// ============================================================
// Auth API
// ============================================================
export const authAPI = {
  login: (username: string, password: string) =>
    apiClient.post<{ data: AuthResponse }>('/auth/login', { username, password }),

  register: (data: any) =>
    apiClient.post('/auth/register', data),

  getMe: () =>
    apiClient.get('/auth/me'),
};

// ============================================================
// Customers API
// ============================================================
export const customersAPI = {
  getAll: (params?: any) =>
    apiClient.get('/customers', { params }),

  getById: (id: number) =>
    apiClient.get<{ data: Customer }>(`/customers/${id}`),

  create: (data: Partial<Customer>) =>
    apiClient.post('/customers', data),

  update: (id: number, data: Partial<Customer>) =>
    apiClient.put(`/customers/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/customers/${id}`),

  addFollowUp: (id: number, data: Partial<FollowUp>) =>
    apiClient.post(`/customers/${id}/followups`, data),

  getFollowUps: (id: number) =>
    apiClient.get(`/customers/${id}/followups`),
};

// ============================================================
// Products API
// ============================================================
export const productsAPI = {
  getAll: (params?: any) =>
    apiClient.get('/products', { params }),

  getById: (id: number) =>
    apiClient.get<{ data: Product }>(`/products/${id}`),

  create: (data: Partial<Product>) =>
    apiClient.post('/products', data),

  update: (id: number, data: Partial<Product>) =>
    apiClient.put(`/products/${id}`, data),

  getLowStock: () =>
    apiClient.get('/products/low-stock'),

  getCategories: () =>
    apiClient.get('/products/categories'),
};

// ============================================================
// Inventory API
// ============================================================
export const inventoryAPI = {
  getMovements: (params?: any) =>
    apiClient.get('/inventory/movements', { params }),

  recordMovement: (data: any) =>
    apiClient.post('/inventory/movements', data),

  getProductMovements: (productId: number) =>
    apiClient.get(`/inventory/movements/${productId}`),
};

// ============================================================
// Challans API
// ============================================================
export const challansAPI = {
  getAll: (params?: any) =>
    apiClient.get('/challans', { params }),

  getById: (id: number) =>
    apiClient.get<{ data: Challan }>(`/challans/${id}`),

  create: (data: any) =>
    apiClient.post('/challans', data),

  update: (id: number, data: any) =>
    apiClient.put(`/challans/${id}`, data),

  confirm: (id: number) =>
    apiClient.patch(`/challans/${id}/confirm`),

  cancel: (id: number) =>
    apiClient.patch(`/challans/${id}/cancel`),
};

// ============================================================
// Dashboard API
// ============================================================
export const dashboardAPI = {
  getStats: () =>
    apiClient.get<{ data: DashboardStats }>('/dashboard/stats'),
};
