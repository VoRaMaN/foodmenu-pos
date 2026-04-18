import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Clock, ChefHat, CheckCircle, XCircle, CreditCard, Printer } from 'lucide-react';

const statusFlow = {
  new: { next: 'sent_to_kitchen', label: 'Send to Kitchen', roles: ['cashier', 'waiter', 'manager'] },
  sent_to_kitchen: { next: 'preparing', label: 'Start Preparing', roles: ['kitchen', 'manager'] },
  preparing: { next: 'ready', label: 'Mark Ready', roles: ['kitchen', 'manager'] },
  ready: { next: 'served', label: 'Mark Served', roles: ['cashier', 'waiter', 'manager'] },
  served: { next: null, label: 'Process Payment', roles: ['cashier', 'manager'] },
};

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  sent_to_kitchen: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  served: 'bg-purple-100 text-purple-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateOrderStatus } = useOrders();
  const { user, role } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', id), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleStatusAdvance = async () => {
    const flow = statusFlow[order.status];
    if (!flow) return;

    if (order.status === 'served') {
      navigate(`/pos/payment/${order.id}`);
      return;
    }

    try {
      await updateOrderStatus(order.id, flow.next, user.uid);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await updateOrderStatus(order.id, 'cancelled', user.uid);
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-400">Order not found</div>;
  }

  const flow = statusFlow[order.status];
  const canAdvance = flow && flow.roles.includes(role);
  const canCancel = role === 'manager' && !['completed', 'cancelled'].includes(order.status);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber || order.id?.slice(0, 6)}</h1>
            <p className="text-sm text-gray-500">
              {order.tableId === 'takeaway' ? '🛍️ Takeaway' : `🪑 Table ${order.tableNumber}`}
              {' · '}{formatTime(order.createdAt)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {order.status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>

        {/* Items */}
        <div className="border-t border-gray-100 py-4 space-y-3">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.qty}x {item.name}</p>
                {item.notes && <p className="text-xs text-gray-500 mt-0.5">Note: {item.notes}</p>}
              </div>
              <p className="text-sm font-medium">${(item.price * item.qty).toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>${order.subtotal?.toFixed(2)}</span>
          </div>
          {order.tableId === 'takeaway' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Packaging</span>
              <span>$2.00</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>Total</span>
            <span className="text-purple-600">${order.total?.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment info */}
        {order.paymentStatus === 'paid' && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-700">
              Paid via {order.paymentMethod} {order.amountPaid > 0 && `($${order.amountPaid.toFixed(2)})`}
            </p>
            {order.paymentMethod === 'cash' && order.amountPaid > order.total && (
              <p className="text-sm text-green-600">Change: ${(order.amountPaid - order.total).toFixed(2)}</p>
            )}
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs font-medium text-yellow-700 mb-1">Notes</p>
            <p className="text-sm text-yellow-800">{order.notes}</p>
          </div>
        )}

        {/* Status History */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Status History</h3>
          <div className="space-y-2">
            {order.statusHistory?.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="capitalize text-gray-700">{entry.status.replace(/_/g, ' ')}</span>
                <span className="text-gray-400">
                  {entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {!['completed', 'cancelled'].includes(order.status) && (
          <div className="mt-6 flex gap-3">
            {canAdvance && (
              <button
                onClick={handleStatusAdvance}
                className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                {order.status === 'served' ? <CreditCard className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {flow.label}
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-lg font-medium border border-red-300 text-red-600 hover:bg-red-50 transition flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        )}

        {order.status === 'completed' && (
          <div className="mt-6">
            <button
              onClick={() => window.print()}
              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
