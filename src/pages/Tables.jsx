import { useNavigate } from 'react-router-dom';
import { useTables } from '../hooks/useTables';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

const statusColors = {
  available: 'bg-green-50 border-green-300 hover:border-green-500',
  occupied: 'bg-red-50 border-red-300',
  reserved: 'bg-yellow-50 border-yellow-300',
};

const statusDots = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  reserved: 'bg-yellow-500',
};

export default function Tables() {
  const { tables, loading } = useTables();
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const handleTableClick = (table) => {
    if (table.status === 'occupied' && table.current_order_id) {
      navigate(`/pos/order/${table.current_order_id}`);
    } else if (table.status === 'available') {
      navigate('/pos/new-order');
    }
  };

  const toggleReserved = async (e, table) => {
    e.stopPropagation();
    if (!hasRole('manager', 'cashier')) return;
    const newStatus = table.status === 'reserved' ? 'available' : 'reserved';
    await supabase.from('tables').update({ status: newStatus }).eq('id', table.id);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Table Management</h1>

      {/* Legend */}
      <div className="flex gap-4 mb-6">
        {[
          { status: 'available', label: 'Available' },
          { status: 'occupied', label: 'Occupied' },
          { status: 'reserved', label: 'Reserved' },
        ].map((s) => (
          <div key={s.status} className="flex items-center gap-2 text-sm text-gray-600">
            <div className={`w-3 h-3 rounded-full ${statusDots[s.status]}`} />
            {s.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => handleTableClick(table)}
            className={`p-6 rounded-xl border-2 transition text-center relative ${statusColors[table.status]}`}
          >
            <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${statusDots[table.status]}`} />
            <span className="text-3xl">🪑</span>
            <p className="text-lg font-bold text-gray-900 mt-2">Table {table.number}</p>
            <p className={`text-sm capitalize mt-1 ${
              table.status === 'available' ? 'text-green-600' :
              table.status === 'occupied' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {table.status}
            </p>
            {table.capacity && (
              <p className="text-xs text-gray-400 mt-1">Seats: {table.capacity}</p>
            )}
            {table.status === 'available' && hasRole('manager', 'cashier') && (
              <button
                onClick={(e) => toggleReserved(e, table)}
                className="mt-2 text-xs text-yellow-600 hover:text-yellow-700 underline"
              >
                Reserve
              </button>
            )}
            {table.status === 'reserved' && hasRole('manager', 'cashier') && (
              <button
                onClick={(e) => toggleReserved(e, table)}
                className="mt-2 text-xs text-green-600 hover:text-green-700 underline"
              >
                Unreserve
              </button>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
