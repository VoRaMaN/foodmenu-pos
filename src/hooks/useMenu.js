import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useMenu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMenu = async () => {
    const { data, error: err } = await supabase
      .from('menu')
      .select('*')
      .order('sort_order', { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMenu();

    const channel = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, () => {
        fetchMenu();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const categories = [...new Set(items.map((i) => i.category))];

  return { items, categories, loading, error };
}
