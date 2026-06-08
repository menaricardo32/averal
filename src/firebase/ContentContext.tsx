import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import { getContent, updateContent } from './services';
import { WebContent } from '../types';
import { useAuth } from './AuthContext';

interface ContentContextType {
  content: WebContent | null;
  draftContent: WebContent | null;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  updateDraft: (path: string, value: any) => void;
  saveChanges: () => Promise<void>;
  cancelChanges: () => void;
  loading: boolean;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

const DEFAULT_CONTENT: WebContent = {
  hero: {
    badge: "AVERAL COSMÉTICOS MÉXICO",
    title: "DESCUBRE NUESTRA AMPLIA GAMA DE PRODUCTOS, PARA VERTE Y SENTIRTE AÚN MAS BELLA",
    subtitle: "Cosméticos 100% naturales y orgánicos para el cuidado de tu piel y cabello. Sin químicos agresivos, solo lo mejor que la naturaleza tiene para ti.",
    image: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780543732832_averel_1.webp?alt=media&token=3d6e81b3-9421-474c-858a-b18a7485a9c3",
    video: {
      enabled: true,
      url: "https://www.youtube.com/watch?v=Y4naInbLQxM",
      muted: true,
      startTime: 0,
      endTime: 0
    }
  },
  featured: {
    title: "ÚLTIMAS NOVEDADES"
  },
  features: {
    quality: { 
      title: "100% naturales", 
      desc: "Ingredientes orgánicos sin parabenos ni sulfatos.",
      image: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780544939158_AVERAL_1.webp?alt=media&token=5d2d965f-a0f9-42a2-bbe2-6f301c021cbd"
    },
    delivery: { 
      title: "Resultados reales", 
      desc: "Formulaciones efectivas respaldadas por la naturaleza.",
      image: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780546341716_producto2.webp?alt=media&token=ef599bd5-c84d-41d3-b1fc-7b6cd3e66beb"
    },
    support: { 
      title: "Ecológicos", 
      desc: "Comprometidos con el cuidado del medio ambiente.",
      image: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780547198836_producto_2.webp?alt=media&token=63f608bb-70f7-42db-aded-58d56e92d93e"
    }
  },
  cta: {
    title: "¿QUIERES VENDER PRODUCTOS AVERAL ?",
    desc: "Conviértete en distribuidor Averal. Vende productos naturales que la gente ama y genera ingresos desde donde estés. ¡Contáctanos hoy y da el primer paso!",
    image: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780545630092_averal_9.webp?alt=media&token=9ed6b667-dd56-4df3-b1af-aad5eabcbe18",
    button: "Contactar Ahora"
  },
  mercadopago: {
    title: "¡Encuéntranos en Mercado Libre!",
    desc: "Visita nuestra tienda oficial y descubre todas nuestras ofertas y facilidades de pago.",
    button: "VISITAR TIENDA"
  },
  about: {
    heroTitle: "Ingredientes reales, resultados reales.\n",
    heroSubtitle: "Hoy, Averal es más que una marca — es una invitación a reconectar con lo natural y a tratarte con lo que mereces.",
    historyTitle: "NUESTRA HISTORIA",
    historyText1: "El origen: Averal Cosméticos nació de una idea simple pero poderosa: que el cuidado personal no debería estar lleno de químicos agresivos ni ingredientes artificiales. Desde el principio, nuestra apuesta fue clara — crear productos formulados con lo mejor de la naturaleza, accesibles para todas las personas que buscan una rutina de belleza más consciente y saludable.",
    historyText2: "El camino: Con el tiempo, fuimos construyendo una línea completa de cosméticos naturales que abarca el cuidado de la piel, el rostro and el cabello. Cada producto lleva consigo el compromiso de usar ingredientes orgánicos, procesos cuidadosos y fórmulas que realmente funcionan. Hoy, Averal es más que una marca — es una invitación a reconectar con lo natural y a tratarte con lo que mereces.",
    statsExperience: "10+",
    statsExperienceLabel: "Años de trayectoria",
    statsEquipments: "5k+",
    statsEquipmentsLabel: "Clientes felices",
    missionTitle: "MISIÓN",
    missionText: "Ofrecer productos cosméticos naturales y orgánicos que cuiden la piel y el cabello de manera efectiva, accesible y responsable, usando el poder de los ingredientes que la naturaleza nos da, sin comprometer la salud de las personas ni del planeta.",
    visionTitle: "VISIÓN",
    visionText: "Ser la marca de cosmética natural de referencia en México, reconocida por la calidad de sus productos, su compromiso con el bienestar y su respeto por el medio ambiente.",
    image: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780546341716_producto2.webp?alt=media&token=ef599bd5-c84d-41d3-b1fc-7b6cd3e66beb",
    backgroundImage: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780543732832_averel_1.webp?alt=media&token=3d6e81b3-9421-474c-858a-b18a7485a9c3"
  },
  contact: {
    heroTitle: "CONTACTO",
    heroSubtitle: "Estamos listos para asesorarte. Contáctanos por cualquiera de nuestros canales o visítanos.",
    cardsTitle1: "Llámanos",
    cardsDesc1: "Atención personalizada",
    cardsTitle2: "WhatsApp",
    cardsDesc2: "Respuesta rápida",
    cardsTitle3: "Email",
    cardsDesc3: "Consultas y pedidos",
    locationsTitle: "NUESTRAS UBICACIONES",
    location1Title: "Showroom Principal",
    location1Address: "Calle General Pedro María Anaya 41, Barrio de San Lorenzo, Zumpango de Ocampo, Estado de México, Mexico C.P. 55604",
    location1Hours: "Lun - Sáb: 9:00 AM - 6:00 PM",
    location2Title: "Punto de Venta",
    location2Address: "Carretera Federal México-Pachuca km 7 con sentido a CDMX, Zapotlán de Juárez, Hidalgo C.P. 42190",
    location2Hours: "Lun - Sáb: 9:00 AM - 6:00 PM",
    formTitle: "ENVÍANOS UN MENSAJE",
    backgroundImage: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596832834_averal_9.webp?alt=media&token=b6ffcdb6-aa9a-4498-93fe-c77283ab662a"
  },
  faq: {
    heroTitle: "PREGUNTAS FRECUENTES",
    heroSubtitle: "Resolvemos tus dudas más comunes sobre nuestras piezas y procesos de entrega.",
    ctaTitle: "¿TIENES OTRA PREGUNTA?",
    ctaSubtitle: "Estamos aquí para ayudarte. Contáctanos directamente por WhatsApp para una respuesta inmediata.",
    backgroundImage: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596977832_concept_new_year_celebration_winter_holidays_close_up_beautiful_woman_dressed_party_bl.webp?alt=media&token=f9e481e6-f90f-4266-a9ed-dcbc7cbe227c"
  },
  catalog: {
    heroTitle: "NUESTRAS COLECCIONES",
    heroSubtitle: "Explora nuestra selección de piezas exclusivas para tu hogar y bienestar personal.",
    backgroundImage: "https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780597163118_beauty_beautiful_female_model_with_happy_face_smiling_showing_make_up_brush_with_blushes_standing_blue_background.webp?alt=media&token=51f2ca79-6733-4afd-8047-7f6936563069"
  },
  footer: {
    description: "Productos 100% naturales y orgánicos para el cuidado de tu piel y cabello. Porque la mejor cosmética nace de la naturaleza."
  },
  legal: {
    privacyPolicy: "En Verity, nos tomamos muy en serio la privacidad de sus datos...",
    termsAndConditions: "Al acceder y utilizar este sitio web, usted acepta los siguientes términos..."
  }
};

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<WebContent | null>(null);
  const [draftContent, setDraftContent] = useState<WebContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    // 1. Subscribe to production status
    const prodDocRef = doc(db, 'settings', 'production');
    const unsubProd = onSnapshot(prodDocRef, (prodDoc) => {
      const isProduction = prodDoc.exists() ? prodDoc.data().isProduction : false;
      
      // 2. Subscribe to proper collection based on production settings
      const baselineRef = doc(db, 'settings', 'production_baseline');
      const standardRef = doc(db, 'settings', 'content');
      
      const targetDocRef = isProduction ? baselineRef : standardRef;
      
      const unsubContent = onSnapshot(targetDocRef, (snap) => {
        if (snap.exists()) {
          const rawData = snap.data();
          const data = (isProduction ? rawData.content : rawData) as WebContent;
          if (data) {
            // Merge with default content to ensure all new fields exist
            const mergedContent: WebContent = {
              ...DEFAULT_CONTENT,
              ...data,
              hero: { ...DEFAULT_CONTENT.hero, ...(data.hero || {}) },
              featured: { ...DEFAULT_CONTENT.featured, ...(data.featured || {}) },
              features: { ...DEFAULT_CONTENT.features, ...(data.features || {}) },
              cta: { ...DEFAULT_CONTENT.cta, ...(data.cta || {}) },
              mercadopago: { ...DEFAULT_CONTENT.mercadopago, ...(data.mercadopago || {}) },
              about: { ...DEFAULT_CONTENT.about, ...(data.about || {}) },
              contact: { ...DEFAULT_CONTENT.contact, ...(data.contact || {}) },
              faq: { ...DEFAULT_CONTENT.faq, ...(data.faq || {}) },
              footer: { ...DEFAULT_CONTENT.footer, ...(data.footer || {}) },
              legal: { ...DEFAULT_CONTENT.legal, ...(data.legal || {}) },
            };
            setContent(mergedContent);
            if (!isEditing) setDraftContent(mergedContent);
          }
        } else {
          setContent(DEFAULT_CONTENT);
          if (!isEditing) setDraftContent(DEFAULT_CONTENT);
        }
        setLoading(false);
      });
      
      return () => unsubContent();
    });

    return () => unsubProd();
  }, [isEditing]);

  const updateDraft = (path: string, value: any) => {
    setDraftContent(prev => {
      if (!prev) return null;
      
      // Deep clone to avoid mutation issues
      const newDraft = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newDraft;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // Create missing intermediate objects if they don't exist
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
      return newDraft;
    });
  };

  const saveChanges = async () => {
    if (!draftContent || !isAdmin) return;
    try {
      await updateContent(draftContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving content:", error);
      throw error;
    }
  };

  const cancelChanges = () => {
    setDraftContent(content);
    setIsEditing(false);
  };

  return (
    <ContentContext.Provider value={{ 
      content, 
      draftContent, 
      isEditing, 
      setIsEditing, 
      updateDraft, 
      saveChanges, 
      cancelChanges,
      loading 
    }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
