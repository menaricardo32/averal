import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { UserProfile } from '../types';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check if email is allowed admin
        const isSuperAdmin = firebaseUser.email === 'menaricardo333@gmail.com';
        let allowed = isSuperAdmin;
        
        if (!allowed && firebaseUser.email) {
          const q = query(collection(db, 'allowed_admins'), where("email", "==", firebaseUser.email.toLowerCase()));
          const snapshot = await getDocs(q);
          allowed = !snapshot.empty;
        }
        
        setIsAdmin(allowed);

        // Fetch or create profile
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          // Sync role if it changed in allowed_admins
          if (allowed && profileData.role !== 'admin') {
            await setDoc(docRef, { ...profileData, role: 'admin' }, { merge: true });
            setProfile({ ...profileData, role: 'admin' });
          } else if (!allowed && profileData.role === 'admin' && !isSuperAdmin) {
            await setDoc(docRef, { ...profileData, role: 'user' }, { merge: true });
            setProfile({ ...profileData, role: 'user' });
          } else {
            setProfile(profileData);
          }
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            role: allowed ? 'admin' : 'user'
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      // Usamos explícitamente signInWithPopup en lugar de signInWithRedirect para evitar el error
      // 'Unable to process request due to missing initial state' en WebViews de Capacitor iOS y Android.
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error durante el inicio de sesión con Google:", error);
      // Proveer feedback útil si ocurre un fallo de autenticación en WebView
      if (error?.code === 'auth/operation-not-supported-in-this-environment') {
        alert("El inicio de sesión mediante popup no está soportado en este entorno. Asegúrate de estar ejecutando la app en un entorno web o con los plugins de Capacitor correspondientes.");
      } else {
        alert(`Error al iniciar sesión: ${error?.message || error}`);
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
