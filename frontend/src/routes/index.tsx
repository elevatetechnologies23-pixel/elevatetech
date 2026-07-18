import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

// Layouts
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Mock/Feature Pages (will be fully implemented in subsequent phases)
import Home from '../features/Home';
import Catalog from '../features/Catalog';
import ProductDetails from '../features/ProductDetails';
import CartPage from '../features/CartPage';
import CheckoutPage from '../features/CheckoutPage';
import CorporateEnquiry from '../features/CorporateEnquiry';
import CompareProducts from '../features/CompareProducts';
import BillingSoftwarePage from '../features/BillingSoftwarePage';
import Login from '../features/Login';
import Register from '../features/Register';
import CustomerDashboard from '../features/CustomerDashboard';

// Admin / Employee Pages
import AdminOverview from '../features/admin/AdminOverview';
import AdminProducts from '../features/admin/AdminProducts';
import AdminCategories from '../features/admin/AdminCategories';
import AdminOrders from '../features/admin/AdminOrders';
import AdminLicenses from '../features/admin/AdminLicenses';
import AdminTickets from '../features/admin/AdminTickets';
import AdminEmployees from '../features/admin/AdminEmployees';
import AdminUsers from '../features/admin/AdminUsers';
import AdminLogs from '../features/admin/AdminLogs';
import AdminSettings from '../features/admin/AdminSettings';
import AdminLogin from '../features/admin/AdminLogin';
import EmployeeLogin from '../features/admin/EmployeeLogin';
import AdminRegister from '../features/admin/AdminRegister';
import EmployeeRegister from '../features/admin/EmployeeRegister';

// Protected Route Guard Component
interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ('customer' | 'admin' | 'employee')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-primary-850">
        <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Customer Website routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<ProtectedRoute allowedRoles={['customer', 'admin', 'employee']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="corporate-enquiry" element={<CorporateEnquiry />} />
        <Route path="compare" element={<CompareProducts />} />
        <Route path="billing-software" element={<BillingSoftwarePage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={['customer', 'admin', 'employee']}><CustomerDashboard /></ProtectedRoute>} />
      </Route>

      {/* Dedicated Portal Logins & Registrations */}
      <Route path="/secure/portal/admin-auth-9x27" element={<AdminLogin />} />
      <Route path="/secure/portal/admin-create-4y81" element={<AdminRegister />} />
      <Route path="/secure/portal/staff-auth-1z56" element={<EmployeeLogin />} />
      <Route path="/secure/portal/staff-create-3w82" element={<EmployeeRegister />} />

      {/* 2. Admin Portal routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="licenses" element={<AdminLicenses />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* 3. Employee Portal routes (Optional / Reuses Dashboard layout with allowed roles check) */}
      <Route 
        path="/employee" 
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="licenses" element={<AdminLicenses />} />
        <Route path="tickets" element={<AdminTickets />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
