import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchStaffProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchStaffProfile(session.user.id);
      } else {
        setUser(null);
        setStaffProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchStaffProfile = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', uid)
        .eq('active', true)
        .single();

      if (error || !data) {
        setStaffProfile(null);
        await supabase.auth.signOut();
      } else {
        setStaffProfile(data);
      }
    } catch {
      setStaffProfile(null);
      await supabase.auth.signOut();
    }
  };


  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // Magic Link (passwordless) sign-in
  const signInWithMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return true;
  };

  const logout = () => supabase.auth.signOut();

  const role = staffProfile?.role || null;
  const hasRole = (...roles) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ user, staffProfile, role, hasRole, login, logout, signInWithMagicLink, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
