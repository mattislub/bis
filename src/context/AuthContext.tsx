import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { API_BASE_URL } from '../api';

interface User {
  email: string;
  gabbaiName?: string;
  phone?: string;
  synagogueName?: string;
  address?: string;
  city?: string;
  contactPhone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>('currentUser', null);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('שם משתמש או סיסמה שגויים');
      }
      throw new Error('שגיאה בהתחברות');
    }
    const data = await res.json();
    setUser(data.user);
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data } as User;
    setUser(updated);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
