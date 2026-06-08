export interface BrandingSettings {
  logoDark: string;
  logoLight: string;
  isotypeDark: string;
  isotypeLight: string;
  showPreloader?: boolean;
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  phones?: string[];
  emails?: string[];
  website?: string;
  whatsapp?: string;
  whatsappMessage?: string;
  colors?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;
    mercadopago?: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price?: number;
  images: string[];
  createdAt: any;
  pdfUrl?: string;
  location?: string;
  stock?: number;
  specs?: { [key: string]: string };
  hasVariations?: boolean;
  variations?: VarianteProducto[];
  applicableAttributes?: {
    attributeId: string;
    attributeName: string;
    selectedValues: string[];
  }[];
}

export interface VarianteProducto {
  id: string;
  sku: string;
  precio?: number;
  stock: number;
  combinacion: { [key: string]: string };
  textoCombinacion: string;
  imagen?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  specifications?: string[];
  imageUrl?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
}

export interface GalleryImage {
  id: string;
  url: string;
  name: string;
  size: number;
  createdAt: any;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface Location {
  id: string;
  title: string;
  address: string;
  hours?: string;
  googleMapsUrl?: string;
  order: number;
}

export interface Review {
  id: string;
  name: string;
  photoUrl: string;
  text: string;
  rating: number;
  role?: string;
  createdAt: any;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  zip: string;
  items: CartItem[];
  totalPrice: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
  paymentInfo?: {
    cardNumber?: string;
    expDate?: string;
    method?: string;
    mode?: string;
    status?: string;
  };
  couponCode?: string;
  discountApplied?: number;
  shippingMethodId?: string;
  shippingCost?: number;
  shippingProvider?: string;
  shippingService?: string;
  trackingNumber?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: VarianteProducto;
}

export interface OpcionAtributo {
  id: string;
  nombre: string;
  tipoValor: 'texto' | 'color' | 'imagen';
  valorExtra?: string;
}

export interface Atributo {
  id: string;
  nombre: string;
  esVisual: boolean;
  valores: OpcionAtributo[];
}

export interface WebContent {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    image: string;
    video?: {
      enabled: boolean;
      url: string;
      muted: boolean;
      startTime: number; // in seconds
      endTime: number; // in seconds
    };
  };
  featured: {
    title: string;
  };
  features: {
    quality: { title: string; desc: string; icon?: string; image?: string };
    delivery: { title: string; desc: string; icon?: string; image?: string };
    support: { title: string; desc: string; icon?: string; image?: string };
  };
  cta: {
    title: string;
    desc: string;
    image?: string;
    button?: string;
  };
  mercadopago?: {
    title: string;
    desc: string;
    button: string;
  };
  about: {
    heroTitle: string;
    heroSubtitle: string;
    historyTitle: string;
    historyText1: string;
    historyText2: string;
    statsExperience: string;
    statsExperienceLabel: string;
    statsEquipments: string;
    statsEquipmentsLabel: string;
    missionTitle: string;
    missionText: string;
    visionTitle: string;
    visionText: string;
    image: string;
    backgroundImage?: string;
    missionIcon?: string;
    visionIcon?: string;
    awardIcon?: string;
  };
  contact: {
    heroTitle: string;
    heroSubtitle: string;
    cardsTitle1: string;
    cardsDesc1: string;
    cardsIcon1?: string;
    cardsTitle2: string;
    cardsDesc2: string;
    cardsIcon2?: string;
    cardsTitle3: string;
    cardsDesc3: string;
    cardsIcon3?: string;
    locationsTitle: string;
    location1Title: string;
    location1Address: string;
    location1Hours: string;
    location2Title: string;
    location2Address: string;
    location2Hours: string;
    formTitle: string;
    backgroundImage?: string;
  };
  faq: {
    heroTitle: string;
    heroSubtitle: string;
    heroIcon?: string;
    ctaTitle: string;
    ctaSubtitle: string;
    backgroundImage?: string;
  };
  catalog: {
    heroTitle: string;
    heroSubtitle: string;
    backgroundImage?: string;
  };
  footer: {
    description: string;
  };
  legal: {
    privacyPolicy: string;
    termsAndConditions: string;
  };
}

export interface Promotion {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: any;
}

export interface ShippingMethod {
  id: string;
  providerName: string;   // e.g., DHL Express, FedEx, Estafeta
  serviceName: string;    // e.g., Express, Económico, Estándar
  deliveryDays: string;   // e.g., 3 días, 1-2 días, 3-5 días
  baseCost: number;       // base price charged to client
  minPurchaseForFree: number | null; // Subtotal for FREE shipping
  purchasedGuides: number; // Cantidad comprada de guías prepagadas
  usedGuides: number;      // Cantidad de guías usadas
  isActive: boolean;
  createdAt: any;
}

export interface ShippingRestrictions {
  id: string;
  blockedStates: string[]; // List of Mexican state names that are blocked
  blockedPrefixes: string[]; // List of prefixes (e.g., 880, 881) or absolute codes
  customMessage: string;
}

export interface PayPalSettings {
  mode: 'sandbox' | 'production';
  sandboxClientId: string;
  sandboxClientSecret: string;
  productionClientId: string;
  productionClientSecret: string;
}

export interface PWASettings {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  displayMode: 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser';
  orientation: 'any' | 'portrait' | 'landscape';
  icon192: string;
  icon512: string;
}export interface GoogleAuthSettings {
  clientId: string;
  reversedClientId: string;
  bundleId: string;
}


