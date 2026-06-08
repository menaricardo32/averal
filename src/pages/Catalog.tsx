import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, X, Tags, Info, Sparkles } from 'lucide-react';
import { getProducts, getCategories } from '../firebase/services';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { EditableText } from '../components/EditableText';
import { HeroBackgroundEditor } from '../components/HeroBackgroundEditor';
import { useContent } from '../firebase/ContentContext';
import { useBranding } from '../firebase/BrandingContext';
import SmartLogo from '../components/SmartLogo';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const { content } = useContent();
  const { branding } = useBranding();
  const productsRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarControls = useAnimation();

  // Search enhancements state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Normalization helper: convert to lowercase, remove accents (normalize NFD), and remove punctuation
  const normalizeString = (str: string): string => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics/accents
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '') // remove punctuation
      .trim();
  };

  // Close auto-suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFilterClick = () => {
    setShowFilters(!showFilters);
  };

  useEffect(() => {
    if (selectedCategory !== 'all' && !loading) {
      productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedCategory, loading]);

  useEffect(() => {
    if (searchParams.get('filter') === 'open') {
      setShowFilters(true);
      // Clean up the URL after opening
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('filter');
      setSearchParams(newParams, { replace: true });
    }
    
    if (searchParams.get('reset') === 'true') {
      setSelectedCategory('all');
      setSearchTerm('');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('reset');
      newParams.delete('category');
      newParams.delete('search');
      setSearchParams(newParams, { replace: true });
    }

    const searchParam = searchParams.get('search');
    if (searchParam !== null && searchParam !== searchTerm) {
      setSearchTerm(searchParam);
    }

    const categoryParam = searchParams.get('category') || 'all';
    if (categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams, setSearchParams, selectedCategory, searchTerm]);

  const handleCategoryChange = (category: string, subcategory?: string) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
      newParams.delete('subcategory');
    } else {
      newParams.set('category', category);
      if (subcategory) {
        newParams.set('subcategory', subcategory);
      } else {
        newParams.delete('subcategory');
      }
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSearchParams({}, { replace: true });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching catalog data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const normalizedSearch = normalizeString(searchTerm);

  const filteredProducts = products.filter(product => {
    const matchesSearch = normalizedSearch === '' || normalizeString(product.name).includes(normalizedSearch);
    
    const categoryParam = searchParams.get('category') || 'all';
    const subcategoryParam = searchParams.get('subcategory');
    
    // Find the category object that matches the categoryParam (either by name or slug)
    const categoryObj = categories.find(c => 
      !c.parentId && (
        c.name.toLowerCase() === categoryParam.toLowerCase() || 
        c.slug === categoryParam
      )
    );

    const matchesCategory = categoryParam === 'all' || 
                            product.category.toLowerCase() === categoryParam.toLowerCase() ||
                            (categoryObj && product.category.toLowerCase() === categoryObj.name.toLowerCase());
    
    const matchesSubcategory = !subcategoryParam || 
                               product.subcategory?.toLowerCase() === subcategoryParam.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Autocomplete suggestions mapping
  const matchingSuggestions = searchTerm.trim() !== ''
    ? products.filter(product => {
        const prodNormalized = normalizeString(product.name);
        return prodNormalized.includes(normalizedSearch);
      }).slice(0, 5)
    : [];

  // Similar products fallback helper when no result is found
  const getSimilarProducts = (term: string, allProducts: Product[]) => {
    const termNormalized = normalizeString(term);
    const searchWords = termNormalized.split(/\s+/).filter(w => w.length > 2);
    if (searchWords.length === 0) {
      return allProducts.slice(0, 4);
    }
    
    const scored = allProducts.map(p => {
      const nameNormalized = normalizeString(p.name);
      const descNormalized = p.description ? normalizeString(p.description) : '';
      let score = 0;
      
      searchWords.forEach(word => {
        if (nameNormalized.includes(word)) score += 10;
        
        // Match partial word starts or ends
        const nameWords = nameNormalized.split(/\s+/);
        nameWords.forEach(nw => {
          if (nw.startsWith(word) || word.startsWith(nw)) score += 5;
        });
        
        if (descNormalized.includes(word)) score += 2;
      });
      
      return { product: p, score };
    });

    const matches = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);

    if (matches.length > 0) {
      return matches.slice(0, 4);
    }

    return allProducts.slice(0, 4);
  };

  const similarProducts = searchTerm.trim() !== '' ? getSimilarProducts(searchTerm, products) : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-brand-black text-white py-16 relative overflow-hidden min-h-[300px] flex items-center">
        {content?.catalog?.backgroundImage && (
          <div className="absolute inset-0 z-0">
            <img 
              src={content.catalog.backgroundImage} 
              alt="" 
              className="w-full h-full object-cover opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase text-white">
            {selectedCategory === 'all' ? (
              <EditableText path="catalog.heroTitle" />
            ) : (
              categories.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase() || c.slug === selectedCategory)?.name || selectedCategory
            )}
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            <EditableText path="catalog.heroSubtitle" />
          </p>
        </div>
        <HeroBackgroundEditor path="catalog.backgroundImage" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-12 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full" ref={searchContainerRef}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            
            <AnimatePresence>
              {showSuggestions && matchingSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-150 z-50 overflow-hidden divide-y divide-gray-100"
                >
                  <div className="p-3 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Sugerencias de productos</span>
                    <span className="text-[9px] text-gray-400/80 font-medium">Coincidencia en tiempo real</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {matchingSuggestions.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setSearchTerm(product.name);
                          // Reset the category to the matching category of the product, or 'all' to guarantee it is displayed
                          const catObj = categories.find(c => c.name.toLowerCase() === product.category.toLowerCase());
                          if (catObj) {
                            handleCategoryChange(catObj.name);
                          } else {
                            handleCategoryChange('all');
                          }
                          setShowSuggestions(false);
                        }}
                        className="w-full px-5 py-3.5 hover:bg-brand-orange/5 text-left flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          {product.images && product.images[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name} 
                              className="w-9 h-9 rounded-xl object-cover border border-gray-100" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-450 border border-gray-100">
                              <Search size={14} />
                            </div>
                          )}
                          <div>
                            <p className="font-black text-xs text-brand-black group-hover:text-brand-orange transition-colors">{product.name}</p>
                            <p className="text-[9px] text-gray-400 uppercase font-black tracking-wider mt-0.5">{product.category}</p>
                          </div>
                        </div>
                        <span className="text-brand-black font-black text-xs px-2.5 py-1 bg-gray-50 group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-colors rounded-lg">
                          ${product.price}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={handleFilterClick}
            className="flex items-center space-x-3 px-6 py-3 bg-gray-50 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-all md:w-auto w-full justify-center group"
          >
            <div className="flex-shrink-0">
              <SmartLogo type="isotype" className="h-6 w-auto" />
            </div>
            <span>Categorías</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {/* Product Grid */}
          <div className="scroll-mt-32" ref={productsRef}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="animate-pulse bg-white h-96 rounded-xl" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-gray-150 shadow-sm max-w-4xl mx-auto animate-fadeIn">
                <div className="p-4 bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-gray-400">
                  <Search size={28} />
                </div>
                <h3 className="text-2xl font-black text-brand-black tracking-tight mb-2">
                  {searchTerm.trim() !== '' 
                    ? `No encontramos resultados para "${searchTerm}"` 
                    : 'No se encontraron productos'}
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-8 font-medium">
                  {searchTerm.trim() !== '' 
                    ? 'Intenta verificar la ortografía o buscar con otras palabras clave.' 
                    : 'Intenta ajustar tus filtros para encontrar lo que buscas.'}
                </p>
                
                {similarProducts.length > 0 ? (
                  <div className="border-t border-gray-100 pt-10">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center justify-center space-x-2">
                      <Sparkles size={14} className="text-brand-orange" />
                      <span>Quizás quisiste decir:</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                      {similarProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleResetFilters}
                    className="px-6 py-3 bg-brand-orange text-white font-black text-sm rounded-xl hover:bg-brand-orange/90 transition-all active:scale-95 shadow-lg shadow-brand-orange/10"
                  >
                    Ver todo el catálogo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Modal/Drawer (Left side) */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-brand-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-full max-w-sm bg-white z-[110] p-8 md:p-10 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black flex items-center space-x-3 uppercase tracking-tighter">
                  <div className="flex-shrink-0">
                    <SmartLogo type="isotype" className="h-8 w-auto" />
                  </div>
                  <span className="text-brand-black">Categorías</span>
                </h3>
                <button 
                  onClick={() => setShowFilters(false)} 
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors text-brand-black"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto flex-grow -mx-4 px-4 custom-scrollbar">
                <div className="space-y-1.5">
                  <button
                    onClick={() => {handleCategoryChange('all'); setShowFilters(false);}}
                    className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                      selectedCategory === 'all' 
                        ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20 scale-[1.02]' 
                        : 'bg-gray-50 text-brand-black hover:bg-gray-100'
                    }`}
                  >
                    Ver Todo
                  </button>

                  <div className="h-4" /> {/* Spacer */}

                  {categories.filter(c => !c.parentId).map((cat) => (
                    <div key={cat.id} className="space-y-1.5">
                      <button
                        onClick={() => {handleCategoryChange(cat.name); setShowFilters(false);}}
                        className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                          (selectedCategory.toLowerCase() === cat.name.toLowerCase() || selectedCategory === cat.slug) && !searchParams.get('subcategory') 
                            ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20 scale-[1.02]' 
                            : 'bg-gray-50 text-brand-black hover:bg-gray-100'
                        }`}
                      >
                        {cat.name}
                      </button>
                      
                      <div className="pl-4 space-y-1">
                        {categories.filter(sub => sub.parentId === cat.id).map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => {handleCategoryChange(cat.name, sub.name); setShowFilters(false);}}
                            className={`w-full text-left px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                              searchParams.get('subcategory') === sub.name 
                                ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' 
                                : 'text-gray-500 hover:text-brand-black hover:bg-gray-50'
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
