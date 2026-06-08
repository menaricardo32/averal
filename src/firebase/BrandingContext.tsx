import React, { createContext, useContext, useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './config';
import { BrandingSettings } from '../types';

interface BrandingContextType {
  branding: BrandingSettings | null;
  loading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: null,
  loading: true,
});

export const useBranding = () => useContext(BrandingContext);

const DEFAULT_BRANDING: BrandingSettings = {
  isotypeLight: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596660417_1_12._Negativo.webp?alt=media&token=a4328aeb-a952-4aba-9ed1-0f492f052ef1",
  logoLight: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596574312_1_2._Versio_n_1.webp?alt=media&token=5246013c-48ef-481d-966d-dc8b19ddd7d4",
  whatsappMessage: "",
  isotypeDark: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596645793_1_7._Si_mbolo_Oficial.webp?alt=media&token=af4e2dc4-b078-4890-9592-853367e92d81",
  whatsapp: "527223683836",
  logoDark: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596538716_1_1._Marca_Oficial.webp?alt=media&token=95a5058e-565a-460b-8619-950d4d233656",
  phones: ["527223683836"],
  emails: ["info@averal.com.mx"],
  colors: {
    background: "#e9eaec",
    text: "#000000",
    secondary: "#1d2425",
    primary: "#93767e"
  }
};

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(() => {
    // Try to load from localStorage for instant initial render
    const saved = localStorage.getItem('ph_branding_cache');
    if (saved) {
      const data = JSON.parse(saved) as BrandingSettings;
      // Apply colors immediately if available in cache
      if (data.colors) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', data.colors.primary);
        root.style.setProperty('--secondary-color', data.colors.secondary);
        root.style.setProperty('--bg-color', data.colors.background);
        root.style.setProperty('--text-color', data.colors.text);
      }
      return data;
    }
    // Fallback to DEFAULT_BRANDING on initial load
    if (DEFAULT_BRANDING.colors) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', DEFAULT_BRANDING.colors.primary);
      root.style.setProperty('--secondary-color', DEFAULT_BRANDING.colors.secondary);
      root.style.setProperty('--bg-color', DEFAULT_BRANDING.colors.background);
      root.style.setProperty('--text-color', DEFAULT_BRANDING.colors.text);
    }
    return DEFAULT_BRANDING;
  });
  const [loading, setLoading] = useState(false); // No loading screen needed since we have a direct robust default

  useEffect(() => {
    const docRef = doc(db, 'settings', 'branding');
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as BrandingSettings;
        setBranding({ ...DEFAULT_BRANDING, ...data });
        localStorage.setItem('ph_branding_cache', JSON.stringify({ ...DEFAULT_BRANDING, ...data }));
        
        // Apply colors to CSS variables
        if (data.colors) {
          const root = document.documentElement;
          root.style.setProperty('--primary-color', data.colors.primary);
          root.style.setProperty('--secondary-color', data.colors.secondary);
          root.style.setProperty('--bg-color', data.colors.background);
          root.style.setProperty('--text-color', data.colors.text);
        }
      } else {
        // Fallback to default branding if document is deleted/not found
        setBranding(DEFAULT_BRANDING);
        if (DEFAULT_BRANDING.colors) {
          const root = document.documentElement;
          root.style.setProperty('--primary-color', DEFAULT_BRANDING.colors.primary);
          root.style.setProperty('--secondary-color', DEFAULT_BRANDING.colors.secondary);
          root.style.setProperty('--bg-color', DEFAULT_BRANDING.colors.background);
          root.style.setProperty('--text-color', DEFAULT_BRANDING.colors.text);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to branding settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};
