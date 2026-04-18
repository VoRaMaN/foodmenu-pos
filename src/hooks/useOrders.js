import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, doc, serverTimestamp, Timestamp
} from 'firebase/firestore';

export function useOrders(filters = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    if (filters.status) {
      q = query(collection(db, 'orders'), where('status', '==', filters.status), orderBy('createdAt', 'desc'));
    }
    if (filters.statuses && filters.statuses.length > 0) {
      q = query(collection(db, 'orders'), where('status', 'in', filters.statuses), orderBy('createdAt', 'desc'));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(data);
      setLoading(false);
    });
    return unsub;
  }, [filters.status, filters.statuses?.join(',')]);

  const createOrder = useCallback(async (orderData) => {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      status: 'new',
      paymentStatus: 'unpaid',
      paymentMethod: null,
      amountPaid: 0,
      createdAt: serverTimestamp(),
      statusHistory: [{
        status: 'new',
        timestamp: Timestamp.now(),
        staffUID: orderData.createdBy,
      }],
    });
    return docRef.id;
  }, []);

  const updateOrderStatus = useCallback(async (orderId, newStatus, staffUID) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      [`statusHistory`]: [...(orders.find(o => o.id === orderId)?.statusHistory || []), {
        status: newStatus,
        timestamp: Timestamp.now(),
        staffUID,
      }],
    });
  }, [orders]);

  const updateOrderPayment = useCallback(async (orderId, paymentData) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      ...paymentData,
      paymentStatus: 'paid',
      status: 'completed',
    });
  }, []);

  return { orders, loading, createOrder, updateOrderStatus, updateOrderPayment };
}
