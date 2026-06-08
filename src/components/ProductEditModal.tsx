import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Product } from '../types';
import ProductForm from './ProductForm';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess?: () => void;
}

export default function ProductEditModal({ isOpen, onClose, product, onSuccess }: ProductEditModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-black/90 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="absolute top-8 right-8 z-20">
            <button onClick={onClose} className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-all">
              <X size={24} />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar p-8 md:p-12">
            <ProductForm 
              product={product} 
              onSuccess={() => {
                onSuccess?.();
                onClose();
              }}
              onCancel={onClose}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

