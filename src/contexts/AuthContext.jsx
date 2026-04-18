import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const staffDoc = await getDoc(doc(db, 'staff', firebaseUser.uid));
          if (staffDoc.exists() && staffDoc.data().active !== false) {
            setStaffProfile({ id: staffDoc.id, ...staffDoc.data() });
          } else {
            // No staff document or account disabled — deny access
            setStaffProfile(null);
            await signOut(auth);
          }
        } catch {
          setStaffProfile(null);
          await signOut(auth);
        }
      } else {
        setUser(null);
        setStaffProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  const role = staffProfile?.role || null;
  const hasRole = (...roles) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ user, staffProfile, role, hasRole, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
