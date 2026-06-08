import { useState, useEffect } from 'react';
import { Heart, Search, ArrowLeft } from 'lucide-react';
import { getProducts } from '../firebase/services';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';
import { useFavorites } from '../firebase/FavoritesContext';
import { Link } from 'react-router-dom';

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites } = useFavorites();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsData = await getProducts();
        // Filter products that are in the favorites list
        const favoriteProducts = productsData.filter(p => favorites.includes(p.id));
        setProducts(favoriteProducts);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [favorites]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-brand-black text-white py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/catalog" className="inline-flex items-center space-x-2 text-brand-orange hover:text-white transition-colors mb-6 font-bold uppercase text-sm">
            <ArrowLeft size={16} />
            <span>Volver al catálogo</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase text-white">
            Mis Favoritos
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Aquí encontrarás las piezas que has marcado como favoritas para consultar más tarde.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-96 rounded-2xl" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart size={48} className="text-gray-200" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-brand-black uppercase mb-4">Aún no tienes favoritos</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Explora nuestro catálogo y marca con un corazón las piezas que más te interesen.
              </p>
              <Link to="/catalog" className="btn-primary inline-flex items-center space-x-2 px-8 py-4">
                <Search size={20} />
                <span>Explorar Catálogo</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
