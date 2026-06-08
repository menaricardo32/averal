import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useBranding } from '../firebase/BrandingContext';
import { motion, AnimatePresence } from 'motion/react';

export const WhatsAppBubble: React.FC = () => {
  const { branding } = useBranding();
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If footer is intersecting, hide the bubble
        setIsVisible(!entry.isIntersecting);
      },
      {
        threshold: 0.1, // Trigger when 10% of the footer is visible
      }
    );

    const footer = document.getElementById('main-footer');
    if (footer) {
      observer.observe(footer);
    }

    return () => {
      if (footer) {
        observer.unobserve(footer);
      }
    };
  }, []);

  const whatsappNumber = branding?.whatsapp || '525569143901';
  const defaultMessage = branding?.whatsappMessage || 'Hola, me gustaría obtener más información sobre sus productos.';

  if (!whatsappNumber) return null;

  const message = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.a
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={32} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">
            Ventas
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
};
