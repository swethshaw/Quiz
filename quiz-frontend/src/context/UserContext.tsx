import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarColor: string;
}

interface UserContextType {
  user: User | null;
  isAuthLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  useEffect(() => {
    const restoreSession = async () => {
      const storedUserId = localStorage.getItem('quiz_user_id');
      if (storedUserId) {
        try {
          const res = await fetch(`http://localhost:5000/api/users/${storedUserId}`);
          const data = await res.json();
          if (data.success) {
            setUser(data.data);
          } else {
            localStorage.removeItem('quiz_user_id');
          }
        } catch (err) {
          console.error("Failed to restore session");
        }
      }
      setIsAuthLoading(false);
    };
    restoreSession();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('quiz_user_id', userData._id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('quiz_user_id');
  };

  return (
    <UserContext.Provider value={{ user, isAuthLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUser must be used within UserProvider');
  return context;
};