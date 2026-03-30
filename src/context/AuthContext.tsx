import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth, db, onAuthStateChanged, doc, getDoc, signOut } from '../firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  isLoading: boolean;
  login: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...userData, id: firebaseUser.uid });
          } else {
            // Handle case where user exists in Auth but not in Firestore
            // This might happen if registration was interrupted
            setUser(null);
          }
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    // Token is handled by onAuthStateChanged
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, logout, updateUser, isLoading, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
