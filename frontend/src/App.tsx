import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/layout/Layout';

// Auth
import LoginPage from './components/auth/LoginPage';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';

// Customers
import CustomersList from './components/customers/CustomersList';
import CustomerForm from './components/customers/CustomerForm';
import CustomerDetail from './components/customers/CustomerDetail';

// Products
import ProductsList from './components/products/ProductsList';
import ProductForm from './components/products/ProductForm';
import ProductDetail from './components/products/ProductDetail';

// Challans
import ChallansList from './components/challans/ChallansList';
import ChallanForm from './components/challans/ChallanForm';
import ChallanDetail from './components/challans/ChallanDetail';

// Pages
import LowStockPage from './pages/LowStockPage';
import InventoryPage from './pages/InventoryPage';

// Styles
import './styles/global.css';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route (redirect if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Customers */}
        <Route path="customers" element={<CustomersList />} />
        <Route path="customers/new" element={
          <ProtectedRoute roles={['Admin', 'Sales']}><CustomerForm /></ProtectedRoute>
        } />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="customers/:id/edit" element={
          <ProtectedRoute roles={['Admin', 'Sales']}><CustomerForm /></ProtectedRoute>
        } />

        {/* Products */}
        <Route path="products" element={<ProductsList />} />
        <Route path="products/new" element={
          <ProtectedRoute roles={['Admin', 'Warehouse']}><ProductForm /></ProtectedRoute>
        } />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="products/:id/edit" element={
          <ProtectedRoute roles={['Admin', 'Warehouse']}><ProductForm /></ProtectedRoute>
        } />

        {/* Inventory */}
        <Route path="inventory" element={
          <ProtectedRoute roles={['Admin', 'Warehouse']}><InventoryPage /></ProtectedRoute>
        } />
        <Route path="low-stock" element={<LowStockPage />} />

        {/* Challans */}
        <Route path="challans" element={<ChallansList />} />
        <Route path="challans/new" element={
          <ProtectedRoute roles={['Admin', 'Sales']}><ChallanForm /></ProtectedRoute>
        } />
        <Route path="challans/:id" element={<ChallanDetail />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
