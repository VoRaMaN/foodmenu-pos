import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MenuProvider } from './contexts/MenuContext';
import Layout from './components/Layout';
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
      <MenuProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* POS Routes - All accessible without login or role checks */}
            <Route index element={<Navigate to="/pos" replace />} />
            <Route path="pos" element={<OrderList />} />
            <Route path="pos/new-order" element={<NewOrder />} />
            <Route path="pos/order/:id" element={<OrderDetail />} />
            <Route path="pos/payment/:orderId" element={<Payment />} />
            {/* Tables */}
            <Route path="tables" element={<Tables />} />
            {/* Kitchen Display */}
            <Route path="kitchen" element={<KDS />} />
            {/* Admin Routes - All accessible */}
            <Route path="admin" element={<Dashboard />} />
            <Route path="admin/menu" element={<MenuManagement />} />
            <Route path="admin/orders" element={<OrderHistory />} />
            <Route path="admin/staff" element={<StaffManagement />} />
            <Route path="admin/reports" element={<Reports />} />
            <Route path="admin/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </MenuProvider>
    </BrowserRouter>
  );
}
