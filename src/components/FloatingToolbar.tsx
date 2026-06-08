import React from 'react';
import { useContent } from '../firebase/ContentContext';
import { motion, AnimatePresence } from 'motion/react';
import { Save, X, Loader2 } from 'lucide-react';

export const FloatingToolbar: React.FC = () => {
  const { isEditing, saveChanges, cancelChanges } = useContent();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveChanges();
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isEditing && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400] w-full max-w-md px-4"
        >
          <div className="bg-brand-black text-white p-4 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">Modo Edición</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={cancelChanges}
                disabled={isSaving}
                className="p-3 hover:bg-white/10 rounded-2xl transition-colors text-gray-400 hover:text-white"
                title="Cancelar"
              >
                <X size={20} />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-brand-orange text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Save size={20} />
                    <span>Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
