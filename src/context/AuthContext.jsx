import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { requestNotificationPermission, subscribeToPushNotifications } from '../lib/notifications';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register service worker for notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((err) => {
          console.log('Service Worker registration failed:', err);
        });
    }
  }, []);

  useEffect(() => {
    let unsubscribeUserData = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Subscribe to user document in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeUserData = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData(null);
          }
          setLoading(false);
          
          // Request notification permission after user data loads
          if (docSnap.exists() && docSnap.data().onboardingDone) {
            requestNotificationPermission().then((granted) => {
              if (granted) {
                console.log('Notifications enabled');
                // Subscribe to push notifications
                subscribeToPushNotifications();
              }
            });
          }
        }, (error) => {
          console.error('Error fetching user data:', error);
          setUserData(null);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
        if (unsubscribeUserData) {
          unsubscribeUserData();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserData) {
        unsubscribeUserData();
      }
    };
  }, []);

  // Role-based helper functions
  const userRole = userData?.role || null;
  
  const isNeedHelp = userRole === 'seeker' || userRole === 'both';
  const isCanHelp = userRole === 'helper' || userRole === 'both';
  const isAdmin = userRole === 'admin';
  const hasBothRoles = userRole === 'both';
  
  const value = {
    user,
    userData,
    loading,
    isAuthenticated: !!user,
    isOnboardingComplete: userData?.onboardingDone === true,
    // Role-based properties
    userRole,
    isNeedHelp,
    isCanHelp,
    isAdmin,
    hasBothRoles,
    // Helper functions
    canAccessNeedHelp: () => isNeedHelp || isAdmin,
    canAccessCanHelp: () => isCanHelp || isAdmin,
    canAccessBoth: () => hasBothRoles || isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
