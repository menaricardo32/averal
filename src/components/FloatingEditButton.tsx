import React from 'react';
import { useAuth } from '../firebase/AuthContext';
import { useContent } from '../firebase/ContentContext';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const FloatingEditButton: React.FC = () => {
  const { isAdmin } = useAuth();
  const { isEditing, setIsEditing } = useContent();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  if (!isAdmin || isAdminPath || isEditing) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setIsEditing(true)}
      className="fixed left-8 z-[350] bg-brand-orange text-white p-4 rounded-full shadow-2xl hover:shadow-brand-orange/20 transition-all flex items-center justify-center"
      style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      title="Activar Modo Edición"
    >
      <Edit3 size={24} />
    </motion.button>
  );
};
