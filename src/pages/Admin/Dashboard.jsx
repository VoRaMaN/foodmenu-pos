import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ShoppingCart, DollarSign, TrendingUp, Clock } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, activeOrders: 0, avgOrderValue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get today's completed orders
        const { data: todayOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'completed')
          .gte('created_at', today.toISOString());

        const todayRevenue = (todayOrders || []).reduce((sum, o) => sum + (o.total || 0), 0);

        // Active orders
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['new', 'sent_to_kitchen', 'preparing', 'ready', 'served']);

        setStats({
          todayOrders: (todayOrders || []).length,
          todayRevenue,
          activeOrders: count || 0,
          avgOrderValue: todayOrders?.length > 0 ? todayRevenue / todayOrders.length : 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: "Today's Revenue", value: `$${stats.todayRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Active Orders', value: stats.activeOrders, icon: Clock, color: 'bg-orange-50 text-orange-600' },
    { label: 'Avg Order Value', value: `$${stats.avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
