import { useState } from 'react';
import { useMenuContext } from '../../contexts/MenuContext';
import { supabase } from '../../supabase';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Save } from 'lucide-react';

const defaultItem = {
  name: '', name_kh: '', category: 'Food', price: 0,
  image: '', description: '', ingredients: [],
  available: true, sort_order: 0,
};

export default function MenuManagement() {
  const { items, categories } = useMenuContext();
  const [editing, setEditing] = useState(null); // null = list, 'new' or item object
  const [form, setForm] = useState(defaultItem);
  const [ingredientInput, setIngredientInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [uploading, setUploading] = useState(false);

  const filteredItems = filterCategory === 'All' ? items : items.filter((i) => i.category === filterCategory);

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...defaultItem, ...item });
    setIngredientInput('');
  };

  const openNew = () => {
    setEditing('new');
    setForm({ ...defaultItem, sort_order: items.length });
    setIngredientInput('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `menu/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('menu-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('menu-images').getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, image: publicUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addIngredient = () => {
    if (!ingredientInput.trim()) return;
    setForm((prev) => ({ ...prev, ingredients: [...prev.ingredients, ingredientInput.trim()] }));
    setIngredientInput('');
  };

  const removeIngredient = (idx) => {
    setForm((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      alert('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name,
        name_kh: form.name_kh,
        category: form.category,
        price: parseFloat(form.price),
        image: form.image,
        description: form.description,
        ingredients: form.ingredients,
        available: form.available,
        sort_order: parseInt(form.sort_order) || 0,
        updated_at: new Date().toISOString(),
      };

      if (editing === 'new') {
        data.created_at = new Date().toISOString();
        const { error } = await supabase.from('menu').insert(data);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('menu').update(data).eq('id', editing.id);
        if (error) throw error;
      }
      setEditing(null);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('menu').delete().eq('id', item.id);
      if (error) throw error;
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const { error } = await supabase.from('menu').update({ available: !item.available }).eq('id', item.id);
      if (error) throw error;
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  // Edit Form
  if (editing !== null) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {editing === 'new' ? 'Add Menu Item' : 'Edit Menu Item'}
          </h1>
          <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Khmer)</label>
              <input
                value={form.name_kh}
                onChange={(e) => setForm({ ...form, name_kh: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                style={{ fontFamily: 'var(--font-khmer)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {['Food', 'Appetizers', 'One Plate', 'Stir Fried', 'Deep Fried', 'Soups', 'Curry', 'Salad & Steamed', 'Desserts'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <div className="flex gap-3 items-start">
              {form.image && (
                <img src={form.image} alt="" className="w-20 h-20 rounded-lg object-cover border" />
              )}
              <div className="flex-1">
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="Image URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none mb-2"
                />
                <label className="inline-block px-3 py-1.5 bg-gray-100 rounded-lg text-sm cursor-pointer hover:bg-gray-200">
                  {uploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
            <div className="flex gap-2 mb-2">
              <input
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                placeholder="Add ingredient..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button onClick={addIngredient} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.ingredients.map((ing, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1">
                  {ing}
                  <button onClick={() => removeIngredient(i)} className="text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm text-gray-700">Available for ordering</span>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <button
          onClick={openNew}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filterCategory === cat ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-khmer)' }}>{item.name_kh}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{item.category}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">${item.price?.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      item.available !== false
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.available !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {item.available !== false ? 'Available' : 'Hidden'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-purple-600 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
