import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getHomePathForRole, ROLES } from './utils/constants';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import AppLayout from './layouts/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';
import NotFoundPage from './pages/auth/NotFoundPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import SuppliersPage from './pages/admin/SuppliersPage';
import ProductsManagementPage from './pages/admin/ProductsManagementPage';
import InventoryPage from './pages/admin/InventoryPage';
import LowStockPage from './pages/admin/LowStockPage';
import OrdersPage from './pages/admin/OrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import UsersPage from './pages/admin/UsersPage';

import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import CustomerCatalogPage from './pages/customer/CustomerCatalogPage';
import CartPage from './pages/customer/CartPage';

import ProfilePage from './pages/ProfilePage';

function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={getHomePathForRole(user?.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RoleHomeRedirect />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/categories" element={<CategoriesPage />} />
            <Route path="/admin/suppliers" element={<SuppliersPage />} />
            <Route path="/admin/products" element={<ProductsManagementPage />} />
            <Route path="/admin/inventory" element={<InventoryPage />} />
            <Route path="/admin/inventory/low-stock" element={<LowStockPage />} />
            <Route path="/admin/orders" element={<OrdersPage />} />
            <Route path="/admin/orders/:id" element={<OrderDetailPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>

          {/* Staff routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.STAFF]} />}>
            <Route path="/staff/products" element={<ProductsManagementPage />} />
            <Route path="/staff/inventory" element={<InventoryPage />} />
            <Route path="/staff/inventory/low-stock" element={<LowStockPage />} />
            <Route path="/staff/orders" element={<OrdersPage />} />
            <Route path="/staff/orders/:id" element={<OrderDetailPage />} />
          </Route>

          {/* Customer routes */}
          <Route element={<RoleRoute allowedRoles={[ROLES.CUSTOMER]} />}>
            <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
            <Route path="/customer/catalog" element={<CustomerCatalogPage />} />
            <Route path="/customer/cart" element={<CartPage />} />
            <Route path="/customer/orders" element={<OrdersPage />} />
            <Route path="/customer/orders/:id" element={<OrderDetailPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
