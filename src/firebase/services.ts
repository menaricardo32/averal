import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  increment
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";
import { Product, Category, BrandingSettings, GalleryImage, WebContent, FAQ, Location, Review, Order, Atributo, Promotion, ShippingMethod, ShippingRestrictions, PayPalSettings } from "../types";

const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";
const SETTINGS_COLLECTION = "settings";
const GALLERY_COLLECTION = "galeria";
const FAQS_COLLECTION = "faqs";
const LOCATIONS_COLLECTION = "locations";
const REVIEWS_COLLECTION = "reviews";
const ORDERS_COLLECTION = "orders";
const ALLOWED_ADMINS_COLLECTION = "allowed_admins";
const ATRIBUTOS_COLLECTION = "atributos";
const CONTENT_COLLECTION = "settings";
const CONTENT_DOC = "content";
const PROMOTIONS_COLLECTION = "promotions";
const SHIPPING_METHODS_COLLECTION = "shipping_methods";
const SHIPPING_RESTRICTIONS_COLLECTION = "shipping_restrictions";

export const productsRef = collection(db, PRODUCTS_COLLECTION);
export const categoriesRef = collection(db, CATEGORIES_COLLECTION);
export const galleryRef = collection(db, GALLERY_COLLECTION);
export const faqsRef = collection(db, FAQS_COLLECTION);
export const locationsRef = collection(db, LOCATIONS_COLLECTION);
export const reviewsRef = collection(db, REVIEWS_COLLECTION);
export const ordersRef = collection(db, ORDERS_COLLECTION);
export const allowedAdminsRef = collection(db, ALLOWED_ADMINS_COLLECTION);
export const atributosRef = collection(db, ATRIBUTOS_COLLECTION);
export const promotionsRef = collection(db, PROMOTIONS_COLLECTION);
export const shippingMethodsRef = collection(db, SHIPPING_METHODS_COLLECTION);

// Atributos
export const getAtributos = async () => {
  const q = query(atributosRef, orderBy("nombre", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    // Normalizar valores para manejar arrays de strings antiguos y asegurar que todos tengan ID
    const valores = (data.valores || []).map((v: any, index: number) => {
      if (typeof v === 'string') {
        return {
          id: `${doc.id}-v${index}`,
          nombre: v,
          tipoValor: 'texto'
        };
      }
      // Si ya es un objeto pero no tiene ID (pudo pasar en alguna versión intermedia)
      if (typeof v === 'object' && !v.id) {
        return { ...v, id: `${doc.id}-v${index}` };
      }
      return v;
    });
    return { id: doc.id, ...data, valores } as Atributo;
  });
};

export const addAtributo = (atributo: Omit<Atributo, 'id'>) => {
  return addDoc(atributosRef, atributo);
};

export const updateAtributo = (id: string, atributo: Partial<Atributo>) => {
  return updateDoc(doc(db, ATRIBUTOS_COLLECTION, id), atributo);
};

export const deleteAtributo = (id: string) => {
  return deleteDoc(doc(db, ATRIBUTOS_COLLECTION, id));
};

// Orders
export const getOrders = async () => {
  const q = query(ordersRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const addOrder = async (order: Omit<Order, "id" | "createdAt">) => {
  const docRef = await addDoc(ordersRef, {
    ...order,
    createdAt: serverTimestamp()
  });

  try {
    const formattedTotal = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(order.totalPrice);

    const clientName = order.customerName || 'Cliente de Averal';

    // Disparar en segundo plano la notificación push sin retrasar la respuesta
    fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🛒 ¡Nuevo Pedido Recibido!',
        body: `Total: ${formattedTotal} - de ${clientName}`,
        url: '/admin'
      })
    }).catch(err => console.warn('Disparo silencioso de push omitido:', err));
  } catch (e) {
    console.warn('Error al preparar datos de notificación:', e);
  }

  return docRef;
};

export const updateOrder = (id: string, order: Partial<Order>) => {
  return updateDoc(doc(db, ORDERS_COLLECTION, id), order);
};

export const deleteOrder = (id: string) => {
  return deleteDoc(doc(db, ORDERS_COLLECTION, id));
};

// Allowed Admins
export const getAllowedAdmins = async () => {
  const snapshot = await getDocs(allowedAdminsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, email: doc.data().email }));
};

export const addAllowedAdmin = (email: string) => {
  const cleanEmail = email.toLowerCase().trim();
  return setDoc(doc(db, ALLOWED_ADMINS_COLLECTION, cleanEmail), { email: cleanEmail });
};

export const deleteAllowedAdmin = (email: string) => {
  return deleteDoc(doc(db, ALLOWED_ADMINS_COLLECTION, email));
};

export const isEmailAllowedAdmin = async (email: string): Promise<boolean> => {
  if (email === 'menaricardo333@gmail.com') return true; // Super admin
  const docRef = doc(db, ALLOWED_ADMINS_COLLECTION, email.toLowerCase().trim());
  const snapshot = await getDoc(docRef);
  return snapshot.exists();
};

// Branding Settings
export const getBranding = async (): Promise<BrandingSettings | null> => {
  const docRef = doc(db, SETTINGS_COLLECTION, "branding");
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as BrandingSettings;
  }
  return null;
};

export const updateBranding = (branding: Partial<BrandingSettings>) => {
  const docRef = doc(db, SETTINGS_COLLECTION, "branding");
  return setDoc(docRef, branding, { merge: true });
};

// Production Mode Settings
export const getProductionStatus = async (): Promise<{ isProduction: boolean }> => {
  const docRef = doc(db, SETTINGS_COLLECTION, "production");
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as { isProduction: boolean };
  }
  return { isProduction: false };
};

export const updateProductionStatus = (isProduction: boolean) => {
  const docRef = doc(db, SETTINGS_COLLECTION, "production");
  return setDoc(docRef, { isProduction }, { merge: true });
};

export const saveProductionBaseline = async (branding: any, content: any) => {
  const docRef = doc(db, SETTINGS_COLLECTION, "production_baseline");
  return setDoc(docRef, { 
    branding, 
    content, 
    updatedAt: new Date().toISOString() 
  });
};

export const getProductionBaseline = async (): Promise<{ branding: BrandingSettings; content: WebContent } | null> => {
  const docRef = doc(db, SETTINGS_COLLECTION, "production_baseline");
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as { branding: BrandingSettings; content: WebContent };
  }
  return null;
};

// Products
export const getProducts = async () => {
  const q = query(productsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = (product: Omit<Product, "id" | "createdAt">) => {
  return addDoc(productsRef, {
    ...product,
    createdAt: serverTimestamp()
  });
};

export const updateProduct = (id: string, product: Partial<Product>) => {
  return updateDoc(doc(db, PRODUCTS_COLLECTION, id), product);
};

export const deleteProduct = (id: string) => {
  return deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
};

// Categories
export const getCategories = async () => {
  const snapshot = await getDocs(categoriesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const addCategory = (category: Omit<Category, "id">) => {
  return addDoc(categoriesRef, category);
};

export const updateCategory = (id: string, category: Partial<Category>) => {
  return updateDoc(doc(db, CATEGORIES_COLLECTION, id), category);
};

export const deleteCategory = (id: string) => {
  return deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
};

// Gallery
export const addGalleryImage = (image: Omit<GalleryImage, "id" | "createdAt">) => {
  return addDoc(galleryRef, {
    ...image,
    createdAt: serverTimestamp()
  });
};

export const deleteGalleryImage = (id: string) => {
  return deleteDoc(doc(db, GALLERY_COLLECTION, id));
};

// Web Content
export const getContent = async (): Promise<WebContent | null> => {
  const docRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as WebContent;
  }
  return null;
};

export const updateContent = (content: Partial<WebContent>) => {
  const docRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC);
  return setDoc(docRef, content, { merge: true });
};

// FAQs
export const getFAQs = async () => {
  const q = query(faqsRef, orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ));
};

export const addFAQ = (faq: Omit<FAQ, "id">) => {
  return addDoc(faqsRef, faq);
};

export const updateFAQ = (id: string, faq: Partial<FAQ>) => {
  return updateDoc(doc(db, FAQS_COLLECTION, id), faq);
};

export const deleteFAQ = (id: string) => {
  return deleteDoc(doc(db, FAQS_COLLECTION, id));
};

// Locations
export const getLocations = async () => {
  const q = query(locationsRef, orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};

export const addLocation = (location: Omit<Location, "id">) => {
  return addDoc(locationsRef, location);
};

export const updateLocation = (id: string, location: Partial<Location>) => {
  return updateDoc(doc(db, LOCATIONS_COLLECTION, id), location);
};

export const deleteLocation = (id: string) => {
  return deleteDoc(doc(db, LOCATIONS_COLLECTION, id));
};

// Visit Counter
export const incrementVisits = async () => {
  const docRef = doc(db, "stats", "visits");
  await setDoc(docRef, { count: increment(1) }, { merge: true });
};

export const getVisits = async (): Promise<number> => {
  const docRef = doc(db, "stats", "visits");
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data().count || 0;
  }
  return 0;
};

// Reviews
export const getReviews = async () => {
  const q = query(reviewsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};

export const addReview = (review: Omit<Review, "id" | "createdAt">) => {
  return addDoc(reviewsRef, {
    ...review,
    createdAt: serverTimestamp()
  });
};

export const updateReview = (id: string, review: Partial<Review>) => {
  return updateDoc(doc(db, REVIEWS_COLLECTION, id), review);
};

export const deleteReview = (id: string) => {
  return deleteDoc(doc(db, REVIEWS_COLLECTION, id));
};

// Image Utilities
const convertToWebPOnClient = (file: File): Promise<Blob | File> => {
  return new Promise((resolve) => {
    if (!window.FileReader || !window.HTMLCanvasElement) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Smart Resizing: Max width 1920px if larger
          if (width > 1920) {
            height = Math.round((height * 1920) / width);
            width = 1920;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          }, 'image/webp', 0.85); // 85% quality, equivalent to server optimization
        } catch (e) {
          console.error("Canvas conversion to WebP failed, returning original file:", e);
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

export const uploadAndOptimizeImage = async (file: File, path: string): Promise<string> => {
  try {
    // 1. Optimize on client side (convert to WebP format)
    const optimizedBlob = await convertToWebPOnClient(file);
    
    // 2. Build clean name
    const safeName = (file.name || 'image').replace(/[^a-zA-Z0-9.]/g, '_');
    const isWebP = optimizedBlob.type === 'image/webp';
    const extension = isWebP ? '.webp' : '';
    // Strip original extension to append .webp correctly
    const lastDotIndex = safeName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex !== -1 ? safeName.substring(0, lastDotIndex) : safeName;
    const fileName = `${path}/${Date.now()}_${nameWithoutExt}${extension}`;
    
    const sRef = storageRef(storage, fileName);
    
    // 3. Upload to Firebase Storage
    await uploadBytes(sRef, optimizedBlob, { 
      contentType: isWebP ? 'image/webp' : file.type 
    });
    
    return await getDownloadURL(sRef);
  } catch (error) {
    console.warn('Client-side WebP optimization or upload failed, trying direct original file upload', error);
    
    // Fallback: Upload original file if anything fails
    const safeName = (file.name || 'image').replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${path}/${Date.now()}_${safeName}`;
    const sRef = storageRef(storage, fileName);
    await uploadBytes(sRef, file);
    return await getDownloadURL(sRef);
  }
};

// Promotions (Coupons)
export const getPromotions = async () => {
  const snapshot = await getDocs(query(promotionsRef, orderBy("createdAt", "desc")));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    // Normalize timestamps
    return { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : null
    };
  }) as Promotion[];
};

export const addPromotion = (promotion: Omit<Promotion, "id" | "createdAt">) => {
  return addDoc(promotionsRef, {
    ...promotion,
    createdAt: serverTimestamp()
  });
};

export const updatePromotion = (id: string, promotion: Partial<Promotion>) => {
  return updateDoc(doc(db, PROMOTIONS_COLLECTION, id), promotion);
};

export const deletePromotion = (id: string) => {
  return deleteDoc(doc(db, PROMOTIONS_COLLECTION, id));
};

// Shipping Methods
export const getShippingMethods = async () => {
  const snapshot = await getDocs(query(shippingMethodsRef, orderBy("createdAt", "desc")));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : null
    };
  }) as ShippingMethod[];
};

export const addShippingMethod = (shippingMethod: Omit<ShippingMethod, "id" | "createdAt">) => {
  return addDoc(shippingMethodsRef, {
    ...shippingMethod,
    createdAt: serverTimestamp()
  });
};

export const updateShippingMethod = (id: string, shippingMethod: Partial<ShippingMethod>) => {
  return updateDoc(doc(db, SHIPPING_METHODS_COLLECTION, id), shippingMethod);
};

export const deleteShippingMethod = (id: string) => {
  return deleteDoc(doc(db, SHIPPING_METHODS_COLLECTION, id));
};

// Shipping Restrictions
export const getShippingRestrictions = async (): Promise<ShippingRestrictions> => {
  const docRef = doc(db, SHIPPING_RESTRICTIONS_COLLECTION, "global");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ShippingRestrictions;
  }
  return {
    id: "global",
    blockedStates: [],
    blockedPrefixes: [],
    customMessage: "Lo sentimos, por el momento no contamos con cobertura de envío para tu código postal."
  };
};

export const updateShippingRestrictions = async (restrictions: Partial<ShippingRestrictions>) => {
  const docRef = doc(db, SHIPPING_RESTRICTIONS_COLLECTION, "global");
  return setDoc(docRef, restrictions, { merge: true });
};

// PayPal Settings
export const getPayPalSettings = async (): Promise<PayPalSettings> => {
  const docRef = doc(db, SETTINGS_COLLECTION, "paypal");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as PayPalSettings;
  }
  return {
    mode: 'sandbox',
    sandboxClientId: '',
    sandboxClientSecret: '',
    productionClientId: '',
    productionClientSecret: '',
  };
};

export const updatePayPalSettings = async (paypal: Partial<PayPalSettings>) => {
  const docRef = doc(db, SETTINGS_COLLECTION, "paypal");
  return setDoc(docRef, paypal, { merge: true });
};


