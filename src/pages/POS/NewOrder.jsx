import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenuContext } from '../../contexts/MenuContext';
import { useTables } from '../../hooks/useTables';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc as firestoreDoc, updateDoc } from 'firebase/firestore';
import { Search, Plus, Minus, ShoppingCart, ArrowLeft, Check } from 'lucide-react';

export default function NewOrder() {
  const { items: menuItems, categories } = useMenuContext();
  const { tables } = useTables();
  const { createOrder } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=table, 2=menu, 3=review
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredItems = useMemo(() => {
    let filtered = menuItems.filter((i) => i.available !== false);
    if (selectedCategory !== 'All') filtered = filtered.filter((i) => i.category === selectedCategory);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((i) => i.name.toLowerCase().includes(s) || i.nameKh?.includes(s));
    }
    return filtered;
  }, [menuItems, selectedCategory, search]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) return prev.map((c) => c.menuItemId === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, nameKh: item.nameKh, price: item.price, qty: 1, notes: '' }];
    });
  };

  const updateQty = (menuItemId, delta) => {
    setCart((prev) =>
      prev.map((c) => c.menuItemId === menuItemId ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
        .filter((c) => c.qty > 0)
    );
  };

  const updateItemNotes = (menuItemId, notes) => {
    setCart((prev) => prev.map((c) => c.menuItemId === menuItemId ? { ...c, notes } : c));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const subtotal = cartTotal;
      const packaging = selectedTable === 'takeaway' ? 2 : 0;
      const total = subtotal + packaging;

      const tableObj = tables.find((t) => t.id === selectedTable);
      const orderId = await createOrder({
        tableId: selectedTable,
        tableNumber: tableObj?.number || selectedTable,
        items: cart,
        subtotal,
        tax: 0,
        total,
        notes: orderNotes,
        createdBy: user.uid,
        orderNumber: Date.now(), // Will be replaced with daily counter
      });

      // Update table status
      if (selectedTable !== 'takeaway') {
        await updateDoc(firestoreDoc(db, 'tables', selectedTable), {
          status: 'occupied',
          currentOrderId: orderId,
        });
      }

      navigate('/pos');
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableTables = tables.filter((t) => t.status === 'available');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Steps header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/pos')} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          {[{ n: 1, l: 'Table' }, { n: 2, l: 'Items' }, { n: 3, l: 'Review' }].map((s) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s.n ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-sm ${step >= s.n ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s.l}</span>
              {s.n < 3 && <div className={`w-12 h-0.5 ${step > s.n ? 'bg-purple-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Table Selection */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Table</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            <button
              onClick={() => { setSelectedTable('takeaway'); setStep(2); }}
              className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition text-center"
            >
              <span className="text-2xl">🛍️</span>
              <p className="text-sm font-medium mt-1">Takeaway</p>
            </button>
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => {
                  if (table.status === 'available') { setSelectedTable(table.id); setStep(2); }
                }}
                disabled={table.status !== 'available'}
                className={`p-4 rounded-xl border-2 transition text-center ${
                  table.status === 'available'
                    ? 'border-green-300 bg-green-50 hover:border-purple-500 hover:bg-purple-50'
                    : table.status === 'occupied'
                    ? 'border-red-300 bg-red-50 opacity-60 cursor-not-allowed'
                    : 'border-yellow-300 bg-yellow-50 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl">🪑</span>
                <p className="text-sm font-medium mt-1">Table {table.number}</p>
                <p className={`text-xs capitalize ${
                  table.status === 'available' ? 'text-green-600' : table.status === 'occupied' ? 'text-red-600' : 'text-yellow-600'
                }`}>{table.status}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Menu Items */}
      {step === 2 && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Menu panel */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search menu..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {['All', ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const inCart = cart.find((c) => c.menuItemId === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:shadow-md transition relative"
                  >
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-full h-20 object-cover rounded-lg mb-2" />
                    )}
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1" style={{ fontFamily: 'var(--font-khmer)' }}>{item.nameKh}</p>
                    <p className="text-sm font-bold text-purple-600 mt-1">${item.price?.toFixed(2)}</p>
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {inCart.qty}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart sidebar */}
          <div className="w-full lg:w-80 bg-white rounded-xl border border-gray-200 p-4 h-fit lg:sticky lg:top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Order Items</h3>
              <span className="text-sm text-gray-500">{cartCount} items</span>
            </div>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No items added yet</p>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateItemNotes(item.menuItemId, e.target.value)}
                        placeholder="Note..."
                        className="mt-1 w-full text-xs px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.menuItemId, -1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                      <button onClick={() => updateQty(item.menuItemId, 1)} className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-900 w-14 text-right">${(item.price * item.qty).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 mt-3 pt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">${cartTotal.toFixed(2)}</span>
              </div>
              {selectedTable === 'takeaway' && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Packaging</span>
                  <span className="font-medium">$2.00</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total</span>
                <span className="text-purple-600">${(cartTotal + (selectedTable === 'takeaway' ? 2 : 0)).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={cart.length === 0}
              className="w-full mt-3 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Review Order
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Review Order</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-500">Table</span>
              <span className="font-medium">
                {selectedTable === 'takeaway' ? 'Takeaway' : `Table ${tables.find((t) => t.id === selectedTable)?.number}`}
              </span>
            </div>

            <div className="border-t border-gray-100 py-3 space-y-2">
              {cart.map((item) => (
                <div key={item.menuItemId} className="flex justify-between text-sm">
                  <span>{item.qty}x {item.name}</span>
                  <span className="font-medium">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              {selectedTable === 'takeaway' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Packaging</span>
                  <span>$2.00</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-1">
                <span>Total</span>
                <span className="text-purple-600">${(cartTotal + (selectedTable === 'takeaway' ? 2 : 0)).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes</label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                placeholder="Special instructions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting...' : 'Send to Kitchen'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
