import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTables = async () => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .order('number', { ascending: true });
    if (data) setTables(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTables();

    const channel = supabase
      .channel('tables-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
        fetchTables();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { tables, loading };
}
