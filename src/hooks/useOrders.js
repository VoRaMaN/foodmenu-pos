import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export function useOrders(filters = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (filters.statuses && filters.statuses.length > 0) {
      q = q.in('status', filters.statuses);
    } else if (filters.status) {
      q = q.eq('status', filters.status);
    }

    const { data } = await q;
    if (data) setOrders(data);
    setLoading(false);
  }, [filters.status, filters.statuses?.join(',')]);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const createOrder = useCallback(async (orderData) => {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderData.orderNumber,
        table_id: orderData.tableId,
        table_number: orderData.tableNumber,
        items: orderData.items,
        subtotal: orderData.subtotal,
        tax: orderData.tax || 0,
        total: orderData.total,
        notes: orderData.notes || '',
        status: 'new',
        payment_status: 'unpaid',
        payment_method: null,
        amount_paid: 0,
        created_by: orderData.createdBy,
        status_history: [{
          status: 'new',
          timestamp: new Date().toISOString(),
          staffUID: orderData.createdBy,
        }],
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }, []);

  const updateOrderStatus = useCallback(async (orderId, newStatus, staffUID) => {
    const order = orders.find(o => o.id === orderId);
    const history = [...(order?.status_history || []), {
      status: newStatus,
      timestamp: new Date().toISOString(),
      staffUID,
    }];

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, status_history: history })
      .eq('id', orderId);

    if (error) throw error;
  }, [orders]);

  const updateOrderPayment = useCallback(async (orderId, paymentData) => {
    const { error } = await supabase
      .from('orders')
      .update({
        ...paymentData,
        payment_status: 'paid',
        status: 'completed',
      })
      .eq('id', orderId);

    if (error) throw error;
  }, []);

  return { orders, loading, createOrder, updateOrderStatus, updateOrderPayment };
}
