import { useParams, Link, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { doc, getDoc, query, collection, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product, Location, Atributo, VarianteProducto } from '../types';
import { motion } from 'motion/react';
import { useBranding } from '../firebase/BrandingContext';
import { useFavorites } from '../firebase/FavoritesContext';
import { useContent } from '../firebase/ContentContext';
import { useAuth } from '../firebase/AuthContext';
import { useCart } from '../firebase/CartContext';
import { fireRealisticConfetti } from '../lib/confetti';
import ProductCard from '../components/ProductCard';
import ProductEditModal from '../components/ProductEditModal';
import ReviewsSlider from '../components/ReviewsSlider';
import VariationSelector from '../components/VariationSelector';
import { ArrowLeft, Phone, MessageCircle, Calendar, Tag, Box, FileDown, Settings, Cpu, Zap, Timer, Hash, Heart, X, ChevronLeft, ChevronRight, Maximize2, Share2, Copy, Check, MapPin, ExternalLink, Edit3, ShoppingBag, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { getAtributos } from '../firebase/services';

export default function ProductDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [globalAttributes, setGlobalAttributes] = useState<Atributo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const { branding } = useBranding();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { isEditing } = useContent();
  const { isAdmin } = useAuth();
  const { addItem } = useCart();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VarianteProducto | null>(null);
  const favorite = id ? isFavorite(id) : false;
  
  const whatsappNumber = branding?.whatsapp || '525569143901';

  const fromCategory = searchParams.get('fromCategory');
  const catalogLink = fromCategory ? `/catalog?category=${fromCategory}` : '/catalog';
  const productUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `Mira esta pieza que encontré en Averal: ${product?.name}\n${productUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product;
          
          // Set product and remove loading screen immediately so product details and primary images render instantly!
          setProduct(productData);
          setLoading(false);
          
          // Fetch non-critical secondary details in the background concurrently and parallelly
          Promise.all([
            // 1. Fetch global attributes for the variation selector
            getAtributos()
              .then(attrs => setGlobalAttributes(attrs))
              .catch(err => console.error("Error fetching attributes in background:", err)),

            // 2. Fetch related products in background
            (async () => {
              const q = query(
                collection(db, 'products'),
                where('category', '==', productData.category),
                limit(10)
              );
              const querySnapshot = await getDocs(q);
              const related = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Product))
                .filter(p => p.id !== id)
                .slice(0, 4);
              setRelatedProducts(related);
            })().catch(err => console.error("Error fetching related products in background:", err)),

            // 3. Fetch locations in background
            (async () => {
              const locsQuery = query(collection(db, 'locations'), orderBy('order', 'asc'));
              const locsSnapshot = await getDocs(locsQuery);
              const locsData = locsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
              setLocations(locsData);
            })().catch(err => console.error("Error fetching locations in background:", err))
          ]);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        setLoading(false);
      }
    };
    fetchProductAndRelated();
    // Scroll to top when product changes
    window.scrollTo(0, 0);
    setActiveImage(0);
    setSelectedVariant(null);
  }, [id]);

  useEffect(() => {
    if (selectedVariant?.imagen && product?.images) {
      const idx = product.images.indexOf(selectedVariant.imagen);
      if (idx !== -1) {
        setActiveImage(idx);
      } else {
        setActiveImage(0);
      }
    } else {
      setActiveImage(0);
    }
  }, [selectedVariant, product]);

  const videoId = product?.pdfUrl ? null : null; // Placeholder for future video logic if needed

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % product!.images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + product!.images.length) % product!.images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
        <Link to={catalogLink} className="btn-primary">Volver al catálogo</Link>
      </div>
    );
  }

  const currentPrice = selectedVariant?.precio !== undefined ? selectedVariant.precio : product.price;
  const isOutOfStock = product.hasVariations 
    ? (selectedVariant ? selectedVariant.stock === 0 : false) 
    : (product.stock !== undefined && product.stock !== null ? product.stock <= 0 : false);
  const canAddToCart = product.hasVariations 
    ? (!!selectedVariant && selectedVariant.stock > 0) 
    : (product.stock !== undefined && product.stock !== null ? product.stock > 0 : true);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <Link to={catalogLink} className="inline-flex items-center space-x-2 text-gray-500 hover:text-brand-orange transition-colors">
            <ArrowLeft size={20} />
            <span className="font-bold">Volver al catálogo</span>
          </Link>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {isAdmin && isEditing && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-grow sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2 bg-brand-orange/10 text-brand-orange rounded-xl font-bold hover:bg-brand-orange hover:text-white transition-all"
              >
                <Edit3 size={18} />
                <span className="text-sm">Editar</span>
              </button>
            )}
            <button
              onClick={handleShareWhatsApp}
              className="flex-grow sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] rounded-xl font-bold hover:bg-[#25D366] hover:text-white transition-all"
              title="Compartir por WhatsApp"
            >
              <Share2 size={18} />
              <span className="text-sm">Compartir</span>
            </button>
            <button
              onClick={handleCopyLink}
              className={`flex-grow sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all ${
                copied ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Copiar enlace"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span className="text-sm">{copied ? 'Copiado' : 'Copiar enlace'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const swipeThreshold = 50;
                if (info.offset.x < -swipeThreshold) {
                  setActiveImage((prev) => (prev + 1) % product.images.length);
                } else if (info.offset.x > swipeThreshold) {
                  setActiveImage((prev) => (prev - 1 + product.images.length) % product.images.length);
                }
              }}
              className="aspect-square rounded-3xl overflow-hidden bg-gray-100 border border-gray-100 relative group cursor-grab active:cursor-grabbing"
              onClick={() => openLightbox(activeImage)}
            >
              <div className="absolute top-6 right-6 z-20">
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(product.id, e);
                  }}
                  className={`p-3 rounded-full shadow-xl transition-all ${
                    favorite ? 'bg-red-500 text-white' : 'bg-brand-orange text-white hover:bg-brand-orange/90'
                  }`}
                >
                  <Heart size={24} fill={favorite ? 'currentColor' : 'none'} />
                </motion.button>
              </div>
              <img
                src={product.images[activeImage] || 'https://picsum.photos/seed/product/1200/800'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="bg-white/90 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
                  <Maximize2 className="text-brand-orange" size={24} />
                </div>
              </div>
            </motion.div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative group ${
                    activeImage === idx ? 'border-brand-orange' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {img ? (
                    <img 
                      src={img} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Box className="text-gray-300" size={20} />
                    </div>
                  )}
                  <div 
                    className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(idx);
                    }}
                  >
                    <Maximize2 className="text-white" size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8 flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2 mb-4 w-full">
              <span className="bg-brand-orange/10 text-brand-orange text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block text-center">
                {product.category}
              </span>
              {product.subcategory && (
                <span className="bg-brand-black/10 text-brand-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block text-center">
                  {product.subcategory}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 flex-grow text-center w-full">{product.name}</h1>
            
            <div className="flex items-baseline justify-center space-x-3 w-full">
              {currentPrice !== undefined && currentPrice !== null && (
                <p className="text-4xl font-black text-brand-orange text-center">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    maximumFractionDigits: 0,
                  }).format(currentPrice)} MXN
                </p>
              )}
              {selectedVariant && selectedVariant.sku && (
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                  SKU: {selectedVariant.sku}
                </span>
              )}
            </div>

            {/* Stock status indicator */}
            {((product.hasVariations && selectedVariant) || (!product.hasVariations && product.stock !== undefined && product.stock !== null)) && (
              <div className="flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-widest mt-1 w-full text-center">
                <span className="text-gray-400">Existencias:</span>
                {(() => {
                  const stockAmount = product.hasVariations ? selectedVariant?.stock : product.stock;
                  if (stockAmount === undefined || stockAmount === null) return <span className="text-gray-500">Ilimitado</span>;
                  if (stockAmount > 0) {
                    return (
                      <span className="text-green-600 flex items-center justify-center gap-1.5 font-bold">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        {stockAmount} {stockAmount === 1 ? 'pieza disponible' : 'piezas disponibles'}
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-red-500 flex items-center justify-center gap-1.5 font-bold">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                        Sin existencias
                      </span>
                    );
                  }
                })()}
              </div>
            )}

            <VariationSelector 
              product={product} 
              globalAttributes={globalAttributes}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
            />

            <div className="pt-4 space-y-4 w-full flex flex-col items-center">
              {product.hasVariations && !selectedVariant && (
                <div className="flex items-center justify-center space-x-2 text-brand-orange bg-brand-orange/10 p-4 rounded-2xl w-full text-center">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-widest">Por favor, selecciona las opciones arriba</p>
                </div>
              )}
              
              <button
                disabled={!canAddToCart}
                onClick={() => {
                  addItem(product, selectedVariant || undefined);
                  fireRealisticConfetti();
                }}
                className={`w-full flex items-center justify-center space-x-3 py-5 rounded-3xl font-black text-xl shadow-xl transition-all group ${
                  canAddToCart 
                    ? 'bg-brand-orange text-white shadow-brand-orange/20 hover:scale-[1.02] active:scale-[0.98]' 
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <ShoppingBag size={24} className={canAddToCart ? "transition-transform group-hover:scale-110" : ""} />
                <span>{isOutOfStock ? 'Sin existencias' : 'Agregar a Bolsa'}</span>
              </button>
            </div>


            {/* Specifications Grid */}
            {product.specs && Object.values(product.specs).some(v => v) && (
              <div className="grid grid-cols-2 gap-4 py-6 border-t border-gray-100 mt-6 w-full">
                {Object.entries(product.specs).map(([label, value]) => (
                  value && (
                    <div key={label} className="flex flex-col items-center justify-center text-center p-2">
                      <div className="bg-gray-50 p-2.5 rounded-xl">
                        <Settings className="text-brand-orange" size={20} />
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">{label}</p>
                        <p className="font-bold text-sm text-center">{value}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-3 pt-6 border-t border-gray-100 w-full text-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 text-center">Descripción</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm text-justify">
                  {product.description}
                </p>
              </div>
            )}

            <div className="pt-8 space-y-4 border-t border-gray-100 w-full flex flex-col items-center">
              <div className="flex flex-col gap-4 w-full items-center">
                {product.pdfUrl && (
                  <a
                    href={product.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline w-full flex items-center justify-center space-x-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white animate-pulse"
                  >
                    <FileDown size={20} className="shrink-0" />
                    <span>Descargar Ficha Técnica (PDF)</span>
                  </a>
                )}
                
                <p className="font-bold text-gray-400 text-sm uppercase tracking-widest mt-4 text-center w-full">¿Te interesa este producto?</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                      branding?.whatsappMessage 
                        ? `${branding.whatsappMessage}\n\nProducto: ${product.name}`
                        : `Hola, me interesa el producto: ${product.name}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary flex-grow flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#128C7E] w-full"
                  >
                    <MessageCircle size={20} className="shrink-0" />
                    <span>Contactar por WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${(branding?.phones?.[0] || branding?.phone || '525569143901').replace(/\D/g, '')}`}
                    className="btn-outline flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <Phone size={20} className="shrink-0" />
                    <span>Llamar ahora</span>
                  </a>
                </div>
              </div>
            </div>

            {product.location && (
              <div className="space-y-4 pt-6 border-t border-gray-100 mt-6 w-full flex flex-col items-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center justify-center space-x-2 w-full text-center">
                  <MapPin size={14} className="text-brand-orange shrink-0" />
                  <span>Ubicación</span>
                </h3>
                <div className="bg-gray-50 p-6 rounded-2xl space-y-3 w-full flex flex-col items-center text-center">
                  <p className="font-bold text-gray-900 text-lg text-center w-full">{product.location}</p>
                  {(() => {
                    const matchedLoc = locations.find(l => l.title === product.location);
                    if (matchedLoc?.address) {
                      return (
                        <div className="space-y-4 w-full flex flex-col items-center text-center">
                          <div className="space-y-2 w-full flex flex-col items-center text-center">
                            {matchedLoc.googleMapsUrl ? (
                              <a 
                                href={matchedLoc.googleMapsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-500 text-sm leading-relaxed hover:text-brand-orange transition-colors block text-center w-full"
                              >
                                {matchedLoc.address}
                              </a>
                            ) : (
                              <p className="text-gray-500 text-sm leading-relaxed text-center w-full">
                                {matchedLoc.address}
                              </p>
                            )}
                            {matchedLoc.hours && (
                              <p className="text-brand-orange text-[10px] font-black uppercase tracking-widest mt-2 text-center w-full">
                                Horario: {matchedLoc.hours}
                              </p>
                            )}
                          </div>
                          
                          {matchedLoc.googleMapsUrl && (
                            <a 
                              href={matchedLoc.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center space-x-2 text-xs font-bold text-brand-orange bg-brand-orange/10 px-3 py-2 rounded-lg hover:bg-brand-orange hover:text-white transition-all w-fit"
                            >
                              <ExternalLink size={14} className="shrink-0" />
                              <span>Ver en Google Maps</span>
                            </a>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-gray-100">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-3xl font-black tracking-tighter mb-4 uppercase">Productos Relacionados</h2>
            <div className="h-1.5 w-20 bg-brand-orange mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
      <ReviewsSlider />

      {product && (
        <ProductEditModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={product}
          onSuccess={() => {
            // Firestore real-time updates should handle the UI refresh
          }}
        />
      )}

    {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center select-none"
            onClick={closeLightbox}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
              <div className="text-white/70 font-bold tracking-widest text-xs uppercase">
                {lightboxIndex + 1} / {product.images.length}
              </div>
              <button
                onClick={closeLightbox}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90"
              >
                <X size={28} />
              </button>
            </div>

            {/* Main Image Container */}
            <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxIndex}
                  src={product.images[lightboxIndex]}
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.5}
                  onDragEnd={(_, info) => {
                    const swipeThreshold = 50;
                    if (info.offset.x < -swipeThreshold) {
                      nextImage();
                    } else if (info.offset.x > swipeThreshold) {
                      prevImage();
                    }
                  }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg cursor-grab active:cursor-grabbing"
                  onClick={(e) => e.stopPropagation()}
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Navigation Buttons */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 md:left-8 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all group"
                  >
                    <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 md:right-8 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all group"
                  >
                    <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails Strip */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center gap-2 overflow-x-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    lightboxIndex === idx ? 'border-brand-orange scale-110' : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
