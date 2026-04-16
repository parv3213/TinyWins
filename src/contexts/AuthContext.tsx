'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAnonymously: async () => {},
  signOut: async () => {},
});

const ANON_DISPLAY_NAME = 'Anonymous Forester';
const ANON_PHOTO_URL = '/avatars/anon.svg';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          try {
            const displayName =
              user.displayName ?? (user.isAnonymous ? ANON_DISPLAY_NAME : null);
            const photoURL =
              user.photoURL ?? (user.isAnonymous ? ANON_PHOTO_URL : null);
            const email =
              user.email ?? (user.isAnonymous ? `anon+${user.uid}@habbit.invalid` : null);

            await setDoc(userRef, {
              displayName,
              email,
              photoURL,
              isAnonymous: user.isAnonymous,
              authProvider: user.isAnonymous ? 'anonymous' : 'google',
              createdAt: serverTimestamp(),
              shareEnabled: false
            });
          } catch(e) {
               console.error("Error creating user document", e);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const signInAnonymously = async () => {
    try {
      await firebaseSignInAnonymously(auth);

      // Anonymous users don't have email and often have no profile. Set defaults
      // so the UI and Firestore doc creation get sensible values.
      if (auth.currentUser?.isAnonymous) {
        await updateProfile(auth.currentUser, {
          displayName: auth.currentUser.displayName ?? ANON_DISPLAY_NAME,
          photoURL: auth.currentUser.photoURL ?? ANON_PHOTO_URL
        });
      }
    } catch (error) {
      console.error('Error signing in anonymously', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInAnonymously, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
