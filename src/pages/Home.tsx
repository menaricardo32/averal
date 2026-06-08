import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Search, ShoppingBag, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../firebase/services';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import { EditableText } from '../components/EditableText';
import { EditableImage } from '../components/EditableImage';
import { useContent } from '../firebase/ContentContext';
import { useBranding } from '../firebase/BrandingContext';
import { HeroBackgroundEditor } from '../components/HeroBackgroundEditor';

import ReviewsSlider from '../components/ReviewsSlider';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const { content, draftContent, isEditing } = useContent();
  const { branding } = useBranding();

  const activeContent = isEditing ? draftContent : content;
  const mercadoPagoLink = branding?.socialLinks?.mercadopago;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setFeaturedProducts(productsData.slice(0, 4));
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = activeContent?.hero.video?.url ? getYoutubeId(activeContent.hero.video.url) : null;
  const showVideo = activeContent?.hero.video?.enabled && videoId && !videoError;

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative min-h-[600px] md:min-h-[80vh] lg:h-screen flex items-center overflow-hidden bg-brand-black py-12 md:py-20">
        <div className="absolute inset-0 z-0">
          {showVideo ? (
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${activeContent?.hero.video?.muted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&enablejsapi=1&start=${activeContent?.hero.video?.startTime || 0}${activeContent?.hero.video?.endTime ? `&end=${activeContent.hero.video.endTime}` : ''}`}
                className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 opacity-50"
                allow="autoplay; encrypted-media"
                onError={() => setVideoError(true)}
              />
            </div>
          ) : (
            <EditableImage
              path="hero.image"
              alt="Home Style Background"
              className="w-full h-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
        </div>

        <HeroBackgroundEditor path="hero.image" videoPath="hero.video" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl text-center md:text-left mx-auto md:mx-0"
          >
            <EditableText 
              as="span"
              path="hero.badge"
              className="text-brand-orange font-bold tracking-[0.4em] uppercase text-xs md:text-sm mb-6 block"
            />
            <EditableText
              as="h1"
              path="hero.title"
              className="text-3xl md:text-5xl lg:text-[45px] font-black text-white leading-[1.2] mb-6 tracking-tight uppercase"
            />
            <EditableText
              as="p"
              path="hero.subtitle"
              className="text-gray-300 text-sm md:text-base lg:text-lg mb-8 leading-relaxed max-w-xl mx-auto md:mx-0"
            />
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/catalog" className="btn-primary flex items-center justify-center space-x-2">
                <span>Explorar Catálogo</span>
                <ArrowRight size={20} />
              </Link>
              <Link to="/contact" className="btn-outline flex items-center justify-center border-white text-white hover:bg-white hover:text-brand-black">
                Contactar Asesor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-16">
        <div className="flex flex-col items-center text-center mb-12 gap-4">
          {branding?.logoDark ? (
            <img 
              src={branding.logoDark} 
              alt={branding.companyName || 'Averal'} 
              className="w-[170px] h-auto object-contain mb-2"
              referrerPolicy="no-referrer"
            />
          ) : (
            <EditableText
              as="h2"
              path="featured.title"
              className="text-3xl md:text-4xl font-black tracking-tighter mb-2"
            />
          )}
          <div className="h-1.5 w-24 bg-brand-orange mx-auto" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-96 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {featuredProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <div className="flex justify-center">
              <Link 
                to="/catalog" 
                className="group relative inline-flex items-center justify-center px-10 py-5 font-black text-white transition-all duration-200 bg-brand-black rounded-2xl hover:bg-brand-orange hover:scale-105 active:scale-95 shadow-xl hover:shadow-brand-orange/20"
              >
                <span className="relative flex items-center space-x-3">
                  <ShoppingBag size={24} />
                  <span className="uppercase tracking-wider">Ver todo el catálogo</span>
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </span>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 uppercase">Nuestras Categorías</h2>
            <div className="h-1.5 w-24 bg-brand-orange mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 sm:gap-8">
            {categories.map((cat: Category, index: number) => (
              <CategoryCard key={cat.id} cat={cat} index={index} allCategories={categories} />
            ))}
          </div>
        </section>
      )}

      {/* Stats/Features */}
      <section className="py-24 relative overflow-hidden bg-brand-black">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-brand-orange rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-orange rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { path: 'quality', delay: 0 },
              { path: 'delivery', delay: 0.1 },
              { path: 'support', delay: 0.2 }
            ].map((feature) => (
              <motion.div
                key={feature.path}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
                className="group bg-white rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col overflow-hidden"
              >
                <div className="h-56 relative overflow-hidden bg-gray-50">
                  <EditableImage 
                    path={`features.${feature.path}.image`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={feature.path}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60 pointer-events-none" />
                </div>
                
                <div className="p-8 pt-0 flex flex-col items-center text-center -mt-6 relative z-10">
                  <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100 mb-6">
                    <EditableText 
                      as="h3" 
                      path={`features.${feature.path}.title`} 
                      className="text-xl font-black tracking-tighter uppercase" 
                    />
                  </div>
                  <EditableText 
                    as="p" 
                    path={`features.${feature.path}.desc`} 
                    className="text-gray-500 leading-relaxed text-sm" 
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="bg-brand-orange rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <Search size={400} className="text-white -mr-20 -mt-20" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center">
            <div className="p-12 md:p-20 relative z-10 md:w-3/5 text-center md:text-left">
              <EditableText
                as="h2"
                path="cta.title"
                className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter"
              />
              <EditableText
                as="p"
                path="cta.desc"
                className="text-white/90 text-lg mb-10"
              />
              <Link to="/contact" className="bg-brand-black text-white px-8 py-4 rounded-xl font-bold hover:bg-opacity-80 transition-all inline-block">
                <EditableText path="cta.button" />
              </Link>
            </div>
            
            <div className="md:w-2/5 h-64 md:h-[500px] w-full relative group z-20">
              <EditableImage
                path="cta.image"
                alt="Buscando el complemento perfecto"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent to-brand-orange pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Mercado Pago CTA */}
      {mercadoPagoLink && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-400 rounded-3xl p-10 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative z-10 text-center md:text-left">
              <EditableText
                as="h2"
                path="mercadopago.title"
                className="text-3xl md:text-4xl font-black text-brand-black mb-4 tracking-tighter uppercase"
              />
              <EditableText
                as="p"
                path="mercadopago.desc"
                className="text-brand-black/80 text-lg font-medium max-w-xl mx-auto md:mx-0"
              />
            </div>
            <a 
              href={mercadoPagoLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-brand-black text-white px-10 py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-xl flex items-center space-x-3 group whitespace-nowrap"
            >
              <ShoppingBag className="group-hover:rotate-12 transition-transform" />
              <EditableText path="mercadopago.button" />
            </a>
            
            {/* Decorative elements */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-brand-black/5 rounded-full blur-2xl pointer-events-none" />
          </div>
        </section>
      )}

      <ReviewsSlider />
    </div>
  );
}
