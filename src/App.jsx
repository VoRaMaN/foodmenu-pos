import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MenuProvider } from './contexts/MenuContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import OrderList from './pages/POS/OrderList';
import NewOrder from './pages/POS/NewOrder';
import OrderDetail from './pages/POS/OrderDetail';
import Payment from './pages/POS/Payment';
import Tables from './pages/Tables';
import KDS from './pages/Kitchen/KDS';
import Dashboard from './pages/Admin/Dashboard';
import MenuManagement from './pages/Admin/MenuManagement';
import StaffManagement from './pages/Admin/StaffManagement';
import Reports from './pages/Admin/Reports';
import Settings from './pages/Admin/Settings';
import OrderHistory from './pages/Admin/OrderHistory';

export default function App() {
  return (
    <BrowserRouter basename="/foodmenu-pos">
      <AuthProvider>
        <MenuProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* POS Routes - Cashier, Waiter, Manager */}
              <Route index element={<Navigate to="/pos" replace />} />
              <Route path="pos" element={
                <ProtectedRoute roles={['cashier', 'waiter', 'manager']}>
                  <OrderList />
                </ProtectedRoute>
              } />
              <Route path="pos/new-order" element={
                <ProtectedRoute roles={['cashier', 'waiter', 'manager']}>
                  <NewOrder />
                </ProtectedRoute>
              } />
              <Route path="pos/order/:id" element={
                <ProtectedRoute roles={['cashier', 'waiter', 'kitchen', 'manager']}>
                  <OrderDetail />
                </ProtectedRoute>
              } />
              <Route path="pos/payment/:orderId" element={
                <ProtectedRoute roles={['cashier', 'manager']}>
                  <Payment />
                </ProtectedRoute>
              } />

              {/* Tables */}
              <Route path="tables" element={
                <ProtectedRoute roles={['cashier', 'waiter', 'manager']}>
                  <Tables />
                </ProtectedRoute>
              } />

              {/* Kitchen Display */}
              <Route path="kitchen" element={
                <ProtectedRoute roles={['kitchen', 'manager']}>
                  <KDS />
                </ProtectedRoute>
              } />

              {/* Admin Routes - Manager only */}
              <Route path="admin" element={
                <ProtectedRoute roles={['manager']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="admin/menu" element={
                <ProtectedRoute roles={['manager']}>
                  <MenuManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/orders" element={
                <ProtectedRoute roles={['manager', 'cashier']}>
                  <OrderHistory />
                </ProtectedRoute>
              } />
              <Route path="admin/staff" element={
                <ProtectedRoute roles={['manager']}>
                  <StaffManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/reports" element={
                <ProtectedRoute roles={['manager']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="admin/settings" element={
                <ProtectedRoute roles={['manager']}>
                  <Settings />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </MenuProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
