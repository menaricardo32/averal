import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../firebase/FavoritesContext';

interface Particle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

const COLORS = ['#ef4444', '#f43f5e', '#ec4899', '#d946ef', '#f87171'];

export const FlyToHeart: React.FC = () => {
  const { flyToHeartEvent, clearFlyEvent } = useFavorites();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (flyToHeartEvent) {
      // Find the target element in the navbar
      const targetId = window.innerWidth >= 768 ? 'navbar-heart-desktop' : 'navbar-heart-mobile';
      const targetEl = document.getElementById(targetId);
      
      if (!targetEl) {
        clearFlyEvent();
        return;
      }

      const targetRect = targetEl.getBoundingClientRect();
      const endX = targetRect.left + targetRect.width / 2;
      const endY = targetRect.top + targetRect.height / 2;

      // Create a dense swarm of small hearts
      const newParticles: Particle[] = Array.from({ length: 24 }).map((_, i) => {
        // Add random offset to end position for a more natural cluster
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        
        return {
          id: `${flyToHeartEvent.id}-${i}`,
          startX: flyToHeartEvent.x + (Math.random() - 0.5) * 30,
          startY: flyToHeartEvent.y + (Math.random() - 0.5) * 30,
          endX: endX + offsetX,
          endY: endY + offsetY,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 8 + Math.random() * 12,
          delay: i * 0.02, // Faster staggering
          duration: 0.7 + Math.random() * 0.5
        };
      });

      setParticles(prev => [...prev, ...newParticles]);

      // Trigger jump effect on navbar icon after arrival
      setTimeout(() => {
        targetEl.classList.add('animate-heart-jump');
        setTimeout(() => targetEl.classList.remove('animate-heart-jump'), 500);
      }, 800);

      clearFlyEvent();
    }
  }, [flyToHeartEvent, clearFlyEvent]);

  const removeParticle = (id: string) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              x: p.startX, 
              y: p.startY, 
              scale: 0, 
              opacity: 0,
              rotate: Math.random() * 360
            }}
            animate={{ 
              x: p.endX, 
              y: p.endY, 
              scale: [0, 1.2, 0.5], 
              opacity: [0, 1, 0.8, 0],
              rotate: p.duration * 360
            }}
            transition={{ 
              duration: p.duration, 
              delay: p.delay, 
              ease: [0.34, 1.56, 0.64, 1] 
            }}
            onAnimationComplete={() => removeParticle(p.id)}
            className="absolute -ml-2 -mt-2"
          >
            <Heart 
              size={p.size} 
              fill={p.color} 
              className="text-white/20" 
              style={{ color: p.color }} 
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
