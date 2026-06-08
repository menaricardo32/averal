import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Edit3, ShoppingBag } from 'lucide-react';
import { useFavorites } from '../firebase/FavoritesContext';
import { useContent } from '../firebase/ContentContext';
import { useAuth } from '../firebase/AuthContext';
import { useCart } from '../firebase/CartContext';
import { fireRealisticConfetti } from '../lib/confetti';
import ProductEditModal from './ProductEditModal';

interface ProductCardProps {
  product: Product;
  key?: string;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [searchParams] = useSearchParams();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { isEditing } = useContent();
  const { isAdmin } = useAuth();
  const { addItem } = useCart();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const favorite = isFavorite(product.id);

  const currentCategory = searchParams.get('category');
  const detailLink = currentCategory 
    ? `/product/${product.id}?fromCategory=${currentCategory}`
    : `/product/${product.id}`;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group relative"
    >
      <div className="absolute top-4 right-4 z-20">
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id, e);
          }}
          className={`p-2 rounded-full shadow-lg transition-all ${
            favorite ? 'bg-red-500 text-white' : 'bg-brand-orange text-white hover:bg-brand-orange/90'
          }`}
        >
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </motion.button>
      </div>

      <Link to={detailLink} className="block aspect-square overflow-hidden relative bg-gray-50">
        {/* Primary Image */}
        <motion.img
          src={product.images?.[0] || 'https://picsum.photos/seed/product/800/600'}
          alt={product.name}
          initial={false}
          animate={{ 
            scale: isHovered && product.images.length > 1 ? 1.15 : 1,
            opacity: isHovered && product.images.length > 1 ? 0 : 1,
            filter: isHovered && product.images.length > 1 ? 'blur(4px)' : 'blur(0px)'
          }}
          transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />

        {/* Secondary Image (Hover) */}
        {product.images.length > 1 && (
          <motion.img
            src={product.images[1]}
            alt={product.name}
            initial={false}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 1.1
            }}
            transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}

        <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
          <span className="bg-brand-orange text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            {product.category}
          </span>
          {product.subcategory && (
            <span className="bg-brand-black/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
              {product.subcategory}
            </span>
          )}
        </div>
      </Link>
      <div className="p-6 text-center">
        <div className="flex justify-center mb-2">
          <Link to={detailLink} className="hover:text-brand-orange transition-colors">
            <h3 className="font-bold text-lg text-brand-black leading-tight">{product.name}</h3>
          </Link>
        </div>
        {product.price !== undefined && product.price !== null && (
          <p className="text-xl font-black text-brand-orange mb-4">
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              maximumFractionDigits: 0,
            }).format(product.price)} MXN
          </p>
        )}
        
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addItem(product);
            fireRealisticConfetti();
          }}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-brand-orange/5 text-brand-orange hover:bg-brand-orange hover:text-white rounded-xl font-bold text-sm transition-all group/button"
        >
          <ShoppingBag size={18} className="transition-transform group-hover/button:scale-110" />
          <span>Agregar a Bolsa</span>
        </button>

        {isAdmin && isEditing && (
          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditModalOpen(true);
              }}
              className="flex items-center space-x-1 text-brand-orange hover:text-brand-orange/80 transition-colors"
            >
              <Edit3 size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Editar</span>
            </button>
          </div>
        )}
      </div>

      <ProductEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={product}
        onSuccess={() => {
          // The page will refresh via Firestore snapshot if needed, 
          // but we might want to force a reload or just rely on the real-time update.
        }}
      />
    </motion.div>
  );
}
