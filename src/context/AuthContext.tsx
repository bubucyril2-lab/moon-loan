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
        // Run a precise inactivity check during initial rehydration / mounting session
        const lastActive = localStorage.getItem('lastActive');
        if (lastActive) {
          const timeSinceLastActive = Date.now() - Number(lastActive);
          if (timeSinceLastActive >= 5 * 60 * 1000) {
            await signOut(auth);
            setUser(null);
            setToken(null);
            localStorage.removeItem('lastActive');
            setIsLoading(false);
            window.location.href = '/login?reason=inactivity';
            return;
          }
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...userData, id: firebaseUser.uid });
            localStorage.setItem('lastActive', Date.now().toString());
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

  // Set up active listening loops to track and log user out after 5 minutes of total inactivity
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('lastActive');
      return;
    }

    // Set initial activity timestamp
    localStorage.setItem('lastActive', Date.now().toString());

    const updateActivity = () => {
      localStorage.setItem('lastActive', Date.now().toString());
    };

    // Listen to standard interaction triggers
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'mousemove'];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Run a high-frequency polling interval to clear expired sessions immediately
    const checkInterval = setInterval(() => {
      const lastActive = localStorage.getItem('lastActive');
      if (lastActive) {
        const timeSinceLastActive = Date.now() - Number(lastActive);
        if (timeSinceLastActive >= 5 * 60 * 1000) {
          clearInterval(checkInterval);
          console.log('Logging out due to inactivity');
          logout().then(() => {
            window.location.href = '/login?reason=inactivity';
          });
        }
      }
    }, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(checkInterval);
    };
  }, [user]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('lastActive', Date.now().toString());
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    localStorage.removeItem('lastActive');
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
