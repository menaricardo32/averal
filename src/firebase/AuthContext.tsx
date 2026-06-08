import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithCredential,
  GoogleAuthProvider,
  signOut, 
  User 
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { UserProfile } from '../types';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  loginWithPassword: (username: string, password: string) => Promise<boolean>;
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
      if (firebaseUser) {
        setUser(firebaseUser);
        
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
        // No Firebase user, check if there is a custom logged in user
        const customSession = localStorage.getItem('custom_auth_session');
        if (customSession) {
          try {
            const sessionData = JSON.parse(customSession);
            if (sessionData.username === 'averal5258') {
              const mockUser = {
                uid: 'averal5258',
                email: 'averal5258@averal.mx',
                displayName: 'Administrador Averal',
                photoURL: 'https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596645793_1_7._Si_mbolo_Oficial.webp?alt=media&token=af4e2dc4-b078-4890-9592-853367e92d81'
              } as any;
              const mockProfile: UserProfile = {
                uid: 'averal5258',
                email: 'averal5258@averal.mx',
                displayName: 'Admin Averal',
                photoURL: 'https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596645793_1_7._Si_mbolo_Oficial.webp?alt=media&token=af4e2dc4-b078-4890-9592-853367e92d81',
                role: 'admin'
              };
              setUser(mockUser);
              setProfile(mockProfile);
              setIsAdmin(true);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error loading custom session", e);
          }
        }
        setProfile(null);
        setIsAdmin(false);
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        console.log("Iniciando sesión nativa con Google Auth de Capacitor...");
        
        // Obtener configuración personalizada de Firestore o usar valores por defecto del usuario
        let clientId = '713282007540-pur3iksqjq7fg2lofifnrmipu7bsndf9.apps.googleusercontent.com';
        try {
          const docRef = doc(db, 'settings', 'google_auth');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            clientId = docSnap.data().clientId || clientId;
          }
        } catch (dbErr) {
          console.warn("No se pudo obtener la configuración de Google de Firestore, usando valores predeterminados:", dbErr);
        }

        // Inicializar Google Auth en Capacitor
        GoogleAuth.initialize({
          clientId: clientId,
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });

        // Iniciar sesión nativamente
        const googleUser = await GoogleAuth.signIn();
        if (googleUser && googleUser.authentication && googleUser.authentication.idToken) {
          const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
          await signInWithCredential(auth, credential);
          console.log("Sesión nativa con Google Auth exitosa.");
        } else {
          throw new Error('No se recibió token de autenticación de Google Auth.');
        }
      } else {
        // Fallback para entorno Web estándar
        await signInWithPopup(auth, googleProvider);
      }
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

  const loginWithPassword = async (username: string, password: string): Promise<boolean> => {
    if (username === 'averal5258' && password === '52as4852as48') {
      const mockUser = {
        uid: 'averal5258',
        email: 'averal5258@averal.mx',
        displayName: 'Administrador Averal',
        photoURL: 'https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596645793_1_7._Si_mbolo_Oficial.webp?alt=media&token=af4e2dc4-b078-4890-9592-853367e92d81'
      } as any;
      const mockProfile: UserProfile = {
        uid: 'averal5258',
        email: 'averal5258@averal.mx',
        displayName: 'Admin Averal',
        photoURL: 'https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596645793_1_7._Si_mbolo_Oficial.webp?alt=media&token=af4e2dc4-b078-4890-9592-853367e92d81',
        role: 'admin'
      };

      localStorage.setItem('custom_auth_session', JSON.stringify({ username }));
      setUser(mockUser);
      setProfile(mockProfile);
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    localStorage.removeItem('custom_auth_session');
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, login, loginWithPassword, logout }}>
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
