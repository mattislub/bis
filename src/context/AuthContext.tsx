import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface User {
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => void;
  register: (username: string, password: string) => void;
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
  const [users, setUsers] = useLocalStorage<User[]>('users', []);
  const [user, setUser] = useLocalStorage<User | null>('currentUser', null);

  const login = (username: string, password: string) => {
    const existing = users.find(u => u.username === username && u.password === password);
    if (!existing) {
      throw new Error('שם משתמש או סיסמה שגויים');
    }
    setUser(existing);
  };

  const register = (username: string, password: string) => {
    if (users.find(u => u.username === username)) {
      throw new Error('שם משתמש כבר קיים');
    }
    const newUser = { username, password };
    setUsers([...users, newUser]);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
