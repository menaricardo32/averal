import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useContent } from '../firebase/ContentContext';
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { galleryRef, addGalleryImage, uploadAndOptimizeImage } from '../firebase/services';
import { GalleryImage } from '../types';
import { storage } from '../firebase/config';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

interface EditableImageProps {
  path: string;
  className?: string;
  alt?: string;
}

export const EditableImage: React.FC<EditableImageProps> = ({ path, className = '', alt = '' }) => {
  const { draftContent, isEditing, updateDraft } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getValue = () => {
    if (!draftContent) return '';
    const keys = path.split('.');
    let current: any = draftContent;
    for (const key of keys) {
      if (current[key] === undefined) return '';
      current = current[key];
    }
    return current;
  };

  const value = getValue();

  if (!isEditing) {
    if (!value) return null;
    return <ImageWithFallback src={value} alt={alt} className={className} />;
  }

  return (
    <>
      <div className="relative group cursor-pointer h-full w-full min-h-[100px]" onClick={() => setIsModalOpen(true)}>
        {value ? (
          <ImageWithFallback src={value} alt={alt} className={`${className} transition-all duration-500`} />
        ) : (
          <div className={`${className} bg-gray-100 flex flex-col items-center justify-center p-6 border-2 border-dashed border-brand-orange/20`}>
            <ImageIcon className="text-gray-300 mb-2" size={40} />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Configurar Imagen</span>
          </div>
        )}
        
        {/* Subtle Indicator */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none group-hover:opacity-0 transition-opacity">
          <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg border border-brand-orange/20 text-brand-orange animate-pulse">
            <ImageIcon size={16} />
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-brand-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[inherit] z-30">
          <div className="bg-white p-3 rounded-full shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">
            <ImageIcon className="text-brand-orange" size={24} />
          </div>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
            {value ? 'Cambiar Imagen' : 'Subir Imagen'}
          </span>
        </div>
      </div>

      <GalleryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelect={(urls) => updateDraft(path, urls[0])} 
      />
    </>
  );
};

export const ImageWithFallback: React.FC<{
  src: string;
  alt?: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className={`relative ${className} bg-gray-100 overflow-hidden`}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-orange/30" size={24} />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <ImageIcon className="text-gray-300 mb-2" size={32} />
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest line-clamp-2">{alt || 'Sin imagen'}</span>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};

export const GalleryModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
}> = ({ isOpen, onClose, onSelect, multiple = false }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUrls([]);
      return;
    }
    const q = query(galleryRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage)));
    });
    return () => unsubscribe();
  }, [isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    const uploadedUrls: string[] = [];
    const totalFiles = files.length;
    const fileArray = Array.from(files) as File[];

    try {
      // Process and upload images sequentially using a strict promise chain queue
      await fileArray.reduce(async (chain: Promise<void>, file: File, idx: number) => {
        await chain;
        const currentProgress = (idx / totalFiles) * 100;
        setUploadProgress(currentProgress + 10);

        const url = await uploadAndOptimizeImage(file, 'galeria');
        
        await addGalleryImage({
          url,
          name: file.name,
          size: file.size // We use original size or could fetch blob size if needed, but file.size is fine for reference
        });

        uploadedUrls.push(url);
        setUploadProgress(((idx + 1) / totalFiles) * 100);
      }, Promise.resolve());

      if (multiple) {
        setSelectedUrls(prev => [...prev, ...uploadedUrls]);
      } else {
        onSelect([uploadedUrls[0]]);
        onClose();
      }
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleSelection = (url: string) => {
    if (!multiple) {
      onSelect([url]);
      onClose();
      return;
    }

    setSelectedUrls(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url) 
        : [...prev, url]
    );
  };

  const handleConfirm = () => {
    if (selectedUrls.length > 0) {
      onSelect(selectedUrls);
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
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
            className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col z-[1001]"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tighter uppercase">Seleccionar Imagen</h3>
                <p className="text-gray-400 text-sm">
                  {multiple ? 'Puedes seleccionar varias imágenes.' : 'Elige una imagen de tu galería o sube una nueva.'}
                </p>
                <div className="mt-2 flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-medium animate-pulse">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  <span>Tip: Si traes imágenes del chat, descárgalas primero a tu equipo para asegurar que se suban correctamente.</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {multiple && selectedUrls.length > 0 && (
                  <button 
                    onClick={handleConfirm}
                    className="bg-brand-orange text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-brand-orange/90 transition-colors shadow-lg"
                  >
                    Confirmar ({selectedUrls.length})
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="aspect-square border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-orange hover:bg-brand-orange/5 transition-all group">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleUpload} 
                    disabled={uploading} 
                    multiple={multiple}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="animate-spin text-brand-orange mb-2" size={32} />
                      <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-brand-orange"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="text-gray-300 group-hover:text-brand-orange mb-2" size={32} />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subir Nueva</span>
                    </>
                  )}
                </label>

                {images.map((img) => {
                  const isSelected = selectedUrls.includes(img.url);
                  return (
                    <div 
                      key={img.id} 
                      onClick={() => toggleSelection(img.url)}
                      className={`aspect-square rounded-3xl overflow-hidden border cursor-pointer transition-all relative group bg-gray-50 ${
                        isSelected ? 'ring-4 ring-brand-orange border-brand-orange' : 'border-gray-100 hover:ring-4 hover:ring-brand-orange/50'
                      }`}
                    >
                      <ImageWithFallback 
                        src={img.url} 
                        alt={img.name} 
                        className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`} 
                      />
                      <div className={`absolute inset-0 transition-opacity ${isSelected ? 'bg-brand-orange/20 opacity-100' : 'bg-brand-orange/10 opacity-0 group-hover:opacity-100'}`} />
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-brand-orange text-white rounded-full p-1 shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
