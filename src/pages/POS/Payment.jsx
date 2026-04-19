import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { ArrowLeft, Banknote, CreditCard, QrCode, CheckCircle, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Receipt from '../../components/Receipt';

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const receiptRef = useRef();

  const handlePrint = useReactToPrint({ contentRef: receiptRef });

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (data) setOrder(data);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const change = paymentMethod === 'cash' && amountPaid ? Math.max(0, parseFloat(amountPaid) - (order?.total || 0)) : 0;

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && (!amountPaid || parseFloat(amountPaid) < order.total)) {
      alert('Amount paid must be at least the order total');
      return;
    }

    setProcessing(true);
    try {
      const statusHistory = [...(order.status_history || []), {
        status: 'completed',
        timestamp: new Date().toISOString(),
        staffUID: user.id,
      }];

      await supabase.from('orders').update({
        payment_method: paymentMethod,
        payment_status: 'paid',
        amount_paid: paymentMethod === 'cash' ? parseFloat(amountPaid) : order.total,
        status: 'completed',
        status_history: statusHistory,
      }).eq('id', orderId);

      // Free up table
      if (order.table_id && order.table_id !== 'takeaway') {
        await supabase.from('tables').update({ status: 'available', current_order_id: null }).eq('id', order.table_id);
      }

      setCompleted(true);
    } catch (err) {
      console.error('Payment failed:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!order) return <div className="text-center py-12 text-gray-400">Order not found</div>;

  if (completed) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Complete!</h2>
        {paymentMethod === 'cash' && change > 0 && (
          <p className="text-3xl font-bold text-green-600 mb-4">Change: ${change.toFixed(2)}</p>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={handlePrint}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <button
            onClick={() => navigate('/pos')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            Back to POS
          </button>
        </div>
        {/* Hidden receipt for printing */}
        <div className="hidden">
          <Receipt ref={receiptRef} order={order} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Process Payment</h1>
        <p className="text-sm text-gray-500 mb-6">Order #{order.order_number || order.id?.slice(0, 6)}</p>

        {/* Order summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm mb-1">
              <span>{item.qty}x {item.name}</span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-purple-600">${order.total?.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method */}
        <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Method</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { key: 'cash', icon: Banknote, label: 'Cash' },
            { key: 'card', icon: CreditCard, label: 'Card' },
            { key: 'khqr', icon: QrCode, label: 'ABA KHQR' },
          ].map((pm) => (
            <button
              key={pm.key}
              onClick={() => setPaymentMethod(pm.key)}
              className={`p-4 rounded-xl border-2 transition text-center ${
                paymentMethod === pm.key
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <pm.icon className={`w-6 h-6 mx-auto mb-1 ${paymentMethod === pm.key ? 'text-purple-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${paymentMethod === pm.key ? 'text-purple-700' : 'text-gray-600'}`}>{pm.label}</p>
            </button>
          ))}
        </div>

        {/* Cash amount */}
        {paymentMethod === 'cash' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              min={order.total}
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg"
              placeholder={`$${order.total?.toFixed(2)}`}
            />
            {amountPaid && parseFloat(amountPaid) >= order.total && (
              <p className="mt-2 text-lg font-bold text-green-600">
                Change: ${change.toFixed(2)}
              </p>
            )}
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-3">
              {[5, 10, 20, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmountPaid(amt.toString())}
                  className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card */}
        {paymentMethod === 'card' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">Manually process card payment on the terminal, then confirm below.</p>
          </div>
        )}

        {/* KHQR */}
        {paymentMethod === 'khqr' && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
            <QrCode className="w-16 h-16 mx-auto text-yellow-500 mb-2" />
            <p className="text-sm font-medium text-yellow-700">ABA KHQR Coming Soon</p>
            <p className="text-xs text-yellow-600 mt-1">Integration will be available in a future update</p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={processing || paymentMethod === 'khqr' || (paymentMethod === 'cash' && (!amountPaid || parseFloat(amountPaid) < order.total))}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          {processing ? 'Processing...' : `Confirm Payment - $${order.total?.toFixed(2)}`}
        </button>
      </div>

      {/* Hidden receipt */}
      <div className="hidden">
        <Receipt ref={receiptRef} order={{ ...order, paymentMethod, amountPaid: parseFloat(amountPaid) || order.total }} />
      </div>
    </div>
  );
}
