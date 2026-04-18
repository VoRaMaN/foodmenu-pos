import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'completed')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start;

    switch (dateRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        start = new Date(customDate);
        break;
      default:
        start = new Date(0);
    }

    return orders.filter((o) => {
      const created = new Date(o.created_at || 0);
      if (dateRange === 'custom') {
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return created >= start && created < end;
      }
      return created >= start;
    });
  }, [orders, dateRange, customDate]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = filteredOrders.length;
    const avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Payment method breakdown
    const paymentBreakdown = {};
    filteredOrders.forEach((o) => {
      const method = o.payment_method || 'unknown';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (o.total || 0);
    });

    // Top items
    const itemCounts = {};
    filteredOrders.forEach((o) => {
      o.items?.forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
      });
    });
    const topItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Hourly distribution
    const hourly = {};
    filteredOrders.forEach((o) => {
      const hour = new Date(o.created_at || 0).getHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      orders: hourly[i] || 0,
    })).filter((h) => h.orders > 0 || (h.hour >= '10:00' && h.hour <= '22:00'));

    return {
      totalRevenue, orderCount, avgOrder,
      paymentData: Object.entries(paymentBreakdown).map(([name, value]) => ({ name: name.toUpperCase(), value })),
      topItems, hourlyData,
    };
  }, [filteredOrders]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
      </div>

      {/* Date range selector */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'all', label: 'All Time' },
          { key: 'custom', label: 'Custom' },
        ].map((r) => (
          <button
            key={r.key}
            onClick={() => setDateRange(r.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              dateRange === r.key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {r.label}
          </button>
        ))}
        {dateRange === 'custom' && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <DollarSign className="w-4 h-4" /> Total Revenue
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <ShoppingCart className="w-4 h-4" /> Orders
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.orderCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <TrendingUp className="w-4 h-4" /> Avg Order
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.avgOrder.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top items chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Top Selling Items</h3>
              {stats.topItems.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.topItems} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-12">No data</p>
              )}
            </div>

            {/* Payment method pie chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Revenue by Payment Method</h3>
              {stats.paymentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.paymentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                    >
                      {stats.paymentData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-12">No data</p>
              )}
            </div>

            {/* Hourly orders */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
              <h3 className="font-bold text-gray-900 mb-4">Orders by Hour</h3>
              {stats.hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-12">No data</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
