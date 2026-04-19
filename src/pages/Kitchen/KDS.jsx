import { useEffect, useRef } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { ChefHat, Clock, ArrowRight } from 'lucide-react';

export default function KDS() {
  const { orders, updateOrderStatus } = useOrders({
    statuses: ['sent_to_kitchen', 'preparing', 'ready'],
  });
  const prevCountRef = useRef(0);
  const audioRef = useRef(null);

  // Audio notification for new orders
  useEffect(() => {
    const kitchenOrders = orders.filter((o) => o.status === 'sent_to_kitchen');
    if (kitchenOrders.length > prevCountRef.current) {
      try {
        audioRef.current?.play();
      } catch {}
    }
    prevCountRef.current = kitchenOrders.length;
  }, [orders]);

  const columns = [
    { status: 'sent_to_kitchen', label: 'New Orders', color: 'border-yellow-400 bg-yellow-50', nextStatus: 'preparing', nextLabel: 'Start' },
    { status: 'preparing', label: 'Preparing', color: 'border-orange-400 bg-orange-50', nextStatus: 'ready', nextLabel: 'Ready' },
    { status: 'ready', label: 'Ready to Serve', color: 'border-green-400 bg-green-50', nextStatus: null, nextLabel: null },
  ];

  const getElapsedMinutes = (order) => {
    if (!order.created_at) return 0;
    const created = new Date(order.created_at);
    return Math.floor((Date.now() - created.getTime()) / 60000);
  };

  const getTimeColor = (minutes) => {
    if (minutes < 10) return 'text-green-600';
    if (minutes < 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAdvance = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus, user.id);
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)]">
      {/* Notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAABkZGRkZGRkZGRkZGRkZA==" type="audio/wav" />
      </audio>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
        </div>
        <p className="text-sm text-gray-500">
          {orders.length} active order{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 h-full">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex flex-col">
              <div className={`px-4 py-2 rounded-t-xl border-t-4 ${col.color} flex items-center justify-between`}>
                <h2 className="font-bold text-gray-900">{col.label}</h2>
                <span className="text-sm font-medium text-gray-500">{colOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-b-xl">
                {colOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No orders</div>
                ) : (
                  colOrders.map((order) => {
                    const elapsed = getElapsedMinutes(order);
                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-900">
                            #{order.order_number || order.id?.slice(0, 6)}
                          </span>
                          <div className={`flex items-center gap-1 text-sm font-medium ${getTimeColor(elapsed)}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {elapsed}m
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mb-2">
                          {order.table_id === 'takeaway' ? '🛍️ Takeaway' : `🪑 Table ${order.table_number}`}
                        </p>

                        <div className="space-y-1.5 mb-3">
                          {order.items?.map((item, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-medium">{item.qty}x</span>{' '}
                              <span className="text-gray-800">{item.name}</span>
                              {item.notes && (
                                <p className="text-xs text-orange-600 ml-5">⚠ {item.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mb-3">
                            📝 {order.notes}
                          </div>
                        )}

                        {col.nextStatus && (
                          <button
                            onClick={() => handleAdvance(order.id, col.nextStatus)}
                            className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center justify-center gap-1"
                          >
                            {col.nextLabel} <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
