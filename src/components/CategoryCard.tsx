import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Category } from '../types';

interface CategoryCardProps {
  cat: Category;
  index: number;
  allCategories?: Category[];
  key?: string | number;
}

export default function CategoryCard({ cat, index, allCategories = [] }: CategoryCardProps) {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Find parent category if it exists
  const parentCat = cat.parentId ? allCategories.find(c => c.id === cat.parentId) : null;
  
  // Construct the URL
  const catalogUrl = parentCat 
    ? `/catalog?category=${parentCat.name}&subcategory=${cat.name}`
    : `/catalog?category=${cat.name}`;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress: entranceProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  const { scrollYProgress: exitProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Basic mobile entrance
  const entranceScale = useTransform(entranceProgress, [0, 1], [0.85, 1]);
  const entranceOpacity = useTransform(entranceProgress, [0, 1], [0.5, 1]);
  const entranceY = useTransform(entranceProgress, [0, 1], [50, 0]);

  // Mobile stacking/exit (being covered)
  const darkenOverlay = useTransform(exitProgress, [0, 1], [0, 0.5]);

  const combinedScale = useTransform([entranceProgress, exitProgress], (latest) => {
    const ent = latest[0] as number;
    const exit = latest[1] as number;
    if (exit > 0) return 1 - (exit * 0.06); 
    return 0.85 + (ent * 0.15);
  });

  return (
    <div 
      ref={containerRef} 
      className={`relative ${isMobile ? 'sticky top-24 mb-10' : ''}`}
      style={isMobile ? { zIndex: index + 1 } : {}}
    >
      <motion.div
        style={isMobile ? { 
          scale: combinedScale,
          opacity: entranceOpacity,
          y: entranceY
        } : {}}
        whileHover={!isMobile ? { y: -12 } : {}}
        whileTap={{ scale: 0.98 }}
        className="group relative bg-white rounded-[40px] overflow-hidden shadow-xl border border-gray-100 aspect-[4/5] cursor-pointer"
      >
        <Link to={catalogUrl} className="absolute inset-0 z-20" />
        
        <div className="absolute inset-0">
          <img 
            src={cat.imageUrl || 'https://picsum.photos/seed/lifestyle/800/1000'} 
            alt={cat.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
          
          {/* Stacking Darken Overlay (Only for Mobile) */}
          {isMobile && (
            <motion.div 
              style={{ opacity: darkenOverlay }}
              className="absolute inset-0 bg-brand-black pointer-events-none z-10"
            />
          )}
        </div>

        {/* Number indicator */}
        <div className="absolute top-8 left-8 z-10">
          <span className="text-4xl font-black text-brand-orange/30 tracking-tighter">
            {(index + 1).toString().padStart(2, '0')}
          </span>
        </div>

        <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end z-10">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-[1.1]">
              {cat.name}
            </h3>
            <div className="h-0.5 w-full bg-white/20 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                EXPLORAR
              </span>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-black transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 shadow-lg">
                <ArrowUpRight size={24} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
