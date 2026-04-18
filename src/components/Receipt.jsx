import { forwardRef } from 'react';

const Receipt = forwardRef(({ order, restaurantName = 'Khmer Surin Restaurant' }, ref) => {
  if (!order) return null;

  const date = order.createdAt?.toDate?.() || new Date();

  return (
    <div ref={ref} className="receipt-print bg-white p-4 max-w-[80mm] mx-auto font-mono text-xs">
      <div className="text-center mb-3">
        <h2 className="text-sm font-bold">{restaurantName}</h2>
        <p className="text-[10px] text-gray-500">Thank you for dining with us!</p>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      <div className="flex justify-between mb-1">
        <span>Order #:</span>
        <span className="font-bold">{order.orderNumber || order.id?.slice(0, 8)}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span>Date:</span>
        <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span>Table:</span>
        <span>{order.tableId === 'takeaway' ? 'Takeaway' : `Table ${order.tableNumber || order.tableId}`}</span>
      </div>
      {order.paymentMethod && (
        <div className="flex justify-between mb-1">
          <span>Payment:</span>
          <span className="capitalize">{order.paymentMethod}</span>
        </div>
      )}

      <div className="border-t border-dashed border-gray-400 my-2" />

      <table className="w-full mb-2">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-1">Item</th>
            <th className="text-center py-1">Qty</th>
            <th className="text-right py-1">Price</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1 pr-2 max-w-[120px] truncate">{item.name}</td>
              <td className="text-center py-1">{item.qty}</td>
              <td className="text-right py-1">${(item.price * item.qty).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-gray-400 my-2" />

      <div className="flex justify-between mb-1">
        <span>Subtotal:</span>
        <span>${order.subtotal?.toFixed(2)}</span>
      </div>
      {order.tax > 0 && (
        <div className="flex justify-between mb-1">
          <span>Tax:</span>
          <span>${order.tax?.toFixed(2)}</span>
        </div>
      )}
      {order.tableId === 'takeaway' && (
        <div className="flex justify-between mb-1">
          <span>Packaging:</span>
          <span>$2.00</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-sm mt-1">
        <span>TOTAL:</span>
        <span>${order.total?.toFixed(2)}</span>
      </div>

      {order.paymentMethod === 'cash' && order.amountPaid > 0 && (
        <>
          <div className="flex justify-between mt-1">
            <span>Paid:</span>
            <span>${order.amountPaid?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Change:</span>
            <span>${(order.amountPaid - order.total).toFixed(2)}</span>
          </div>
        </>
      )}

      <div className="border-t border-dashed border-gray-400 my-3" />

      <div className="text-center text-[10px] text-gray-500">
        <p>Thank you! / អរគុណ!</p>
        <p className="mt-1">Please come again</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;
