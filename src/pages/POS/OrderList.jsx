import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';
import { Plus, Clock, ChefHat, CheckCircle, AlertCircle } from 'lucide-react';

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  sent_to_kitchen: { label: 'Sent to Kitchen', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-700', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  served: { label: 'Served', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function OrderList() {
  const [filter, setFilter] = useState('active');
  const activeStatuses = ['new', 'sent_to_kitchen', 'preparing', 'ready', 'served'];
  const { orders, loading } = useOrders(
    filter === 'active' ? { statuses: activeStatuses } :
    filter === 'all' ? {} :
    { status: filter }
  );
  const navigate = useNavigate();

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button
          onClick={() => navigate('/pos/new-order')}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { key: 'active', label: 'Active' },
          { key: 'new', label: 'New' },
          { key: 'preparing', label: 'Preparing' },
          { key: 'ready', label: 'Ready' },
          { key: 'served', label: 'Served' },
          { key: 'all', label: 'All' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filter === f.key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.new;
            const StatusIcon = status.icon;
            return (
              <button
                key={order.id}
                onClick={() => navigate(`/pos/order/${order.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">#{order.order_number || order.id?.slice(0, 6)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{formatTime(order.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {order.table_id === 'takeaway' ? '🛍️ Takeaway' : `🪑 Table ${order.table_number}`}
                    {' · '}{order.items?.length || 0} items
                  </span>
                  <span className="font-bold text-purple-600">${order.total?.toFixed(2)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClipboardList(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
    </svg>
  );
}
