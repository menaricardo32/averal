import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './firebase/AuthContext';
import { BrandingProvider, useBranding } from './firebase/BrandingContext';
import { ContentProvider } from './firebase/ContentContext';
import { FavoritesProvider } from './firebase/FavoritesContext';
import { CartProvider } from './firebase/CartContext';
import { FloatingToolbar } from './components/FloatingToolbar';
import { FloatingEditButton } from './components/FloatingEditButton';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Preloader from './components/Preloader';
import { ScreenSnakeTransition } from './components/ScreenSnakeTransition';
import { WhatsAppBubble } from './components/WhatsAppBubble';
import { FloatingTrackingButton } from './components/FloatingTrackingButton';
import { CartDrawer } from './components/CartDrawer';
import { FlyToHeart } from './components/FlyToHeart';
import { incrementVisits } from './firebase/services';

// Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import FavoritesPage from './pages/FavoritesPage';
import Checkout from './pages/Checkout';

function AppContent() {
  const location = useLocation();
  const { branding } = useBranding();
  const isHome = location.pathname === '/';
  const [showPreloader, setShowPreloader] = useState(() => {
    // Check if we've already shown the preloader in this session
    return !sessionStorage.getItem('ph_preloader_shown');
  });

  useEffect(() => {
    // Increment visits once per session
    if (!sessionStorage.getItem('ph_visit_counted')) {
      incrementVisits();
      sessionStorage.setItem('ph_visit_counted', 'true');
    }
  }, []);

  // Track visited sections in localStorage
  useEffect(() => {
    const visited = JSON.parse(localStorage.getItem('ph_visited_sections') || '[]');
    if (!visited.includes(location.pathname)) {
      const newVisited = [...visited, location.pathname];
      localStorage.setItem('ph_visited_sections', JSON.stringify(newVisited));
    }
  }, [location.pathname]);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
    sessionStorage.setItem('ph_preloader_shown', 'true');
  };

  const shouldShowPreloader = showPreloader && branding?.showPreloader !== false;
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {shouldShowPreloader && <Preloader onComplete={handlePreloaderComplete} />}
      <ScreenSnakeTransition />
      <ScrollToTop />
      <FlyToHeart />
      <Navbar />
      <CartDrawer />
      <main className="flex-grow" style={!isHome ? { paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))' } : undefined}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      {!isAdminPath && <Footer />}
      {!isAdminPath && <WhatsAppBubble />}
      {!isAdminPath && <FloatingTrackingButton />}
      <FloatingToolbar />
      <FloatingEditButton />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrandingProvider>
        <ContentProvider>
          <FavoritesProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </FavoritesProvider>
        </ContentProvider>
      </BrandingProvider>
    </AuthProvider>
  );
}
