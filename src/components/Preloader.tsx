import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SmartLogo from './SmartLogo';
import { useBranding } from '../firebase/BrandingContext';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const { branding } = useBranding();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Wait for exit animation
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-brand-black flex flex-col items-center justify-center"
        >
          <div className="w-full max-w-xs px-6 flex flex-col items-center">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-12 flex justify-center"
            >
              {branding?.logoLight ? (
                <img 
                  src={branding.logoLight} 
                  alt="Averal" 
                  className="h-16 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <SmartLogo variant="light" type="logo" className="h-16 w-auto" isDarkBackground={true} />
              )}
            </motion.div>

            {/* Progress Bar Container */}
            <div className="w-full space-y-4">
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand-orange"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange"
                >
                  Cargando catálogo
                </motion.span>
                <span className="text-[10px] font-black text-white/40">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-orange/5 blur-[120px] rounded-full" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
