import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, ChefHat,
  Settings, Users, BarChart3, Menu as MenuIcon, LogOut, X, Wifi, WifiOff, ClipboardList
} from 'lucide-react';

const navItems = [
  { to: '/pos', icon: ShoppingCart, label: 'POS', roles: ['cashier', 'waiter', 'manager'] },
  { to: '/tables', icon: LayoutDashboard, label: 'Tables', roles: ['cashier', 'waiter', 'manager'] },
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen', roles: ['kitchen', 'manager'] },
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['manager'] },
  { to: '/admin/menu', icon: UtensilsCrossed, label: 'Menu', roles: ['manager'] },
  { to: '/admin/orders', icon: ClipboardList, label: 'Order History', roles: ['manager', 'cashier'] },
  { to: '/admin/staff', icon: Users, label: 'Staff', roles: ['manager'] },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports', roles: ['manager'] },
  { to: '/admin/settings', icon: Settings, label: 'Settings', roles: ['manager'] },
];

export default function Layout() {
  const { staffProfile, role, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useState(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  });

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">Khmer POS</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/pos' || item.to === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-purple-700">
                {(staffProfile?.name || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{staffProfile?.name || 'Staff'}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            {online ? (
              <span className="flex items-center gap-1 text-xs text-green-600"><Wifi className="w-3.5 h-3.5" /> Online</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-500"><WifiOff className="w-3.5 h-3.5" /> Offline</span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
