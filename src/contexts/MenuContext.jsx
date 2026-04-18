import { createContext, useContext } from 'react';
import { useMenu } from '../hooks/useMenu';

const MenuContext = createContext(null);

export function useMenuContext() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenuContext must be used within MenuProvider');
  return ctx;
}

export function MenuProvider({ children }) {
  const { items, categories, loading, error } = useMenu();

  return (
    <MenuContext.Provider value={{ items, categories, loading, error }}>
      {children}
    </MenuContext.Provider>
  );
}
