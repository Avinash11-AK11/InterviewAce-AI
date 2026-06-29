import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  logOut,
  resetPassword,
  updateUserProfile,
} from '../firebase/authService';
import { calculateLevel, getRank } from '../utils/helpers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        // Real-time listener on user profile
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const currentXp = data.xp || 0;
              
              // Automatically fix level and rank if XP was modified manually in Firebase
              const expectedLevel = calculateLevel(currentXp);
              const expectedRank = getRank(expectedLevel);
              
              if (data.level !== expectedLevel || data.rank !== expectedRank) {
                updateUserProfile(user.uid, { level: expectedLevel, rank: expectedRank }).catch(console.error);
                data.level = expectedLevel;
                data.rank = expectedRank;
              }
              
              setUserProfile({ id: snap.id, ...data });
            }
            setLoading(false);
          },
          (error) => {
            console.error('Profile listener error:', error);
            setLoading(false);
          }
        );

        // Sync real-time stats (tests, coding, badges, xp, level)
        import('../utils/syncStats').then(({ syncUserStats }) => {
          syncUserStats(user.uid);
        }).catch(err => console.error("Failed to load syncStats", err));
      } else {
        setUserProfile(null);
        setLoading(false);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin,
    // Auth methods
    signUp: signUpWithEmail,
    signIn: signInWithEmail,
    signInGoogle: signInWithGoogle,
    logout: logOut,
    forgotPassword: resetPassword,
    updateProfile: (data) => updateUserProfile(currentUser?.uid, data),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
