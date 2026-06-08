import React, { useState } from 'react';
import { useContent } from '../firebase/ContentContext';
import { Image as ImageIcon, Youtube, X, Save, Volume2, VolumeX, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryModal } from './EditableImage';

interface HeroBackgroundEditorProps {
  path: string;
  videoPath?: string;
  className?: string;
}

export const HeroBackgroundEditor: React.FC<HeroBackgroundEditorProps> = ({ 
  path, 
  videoPath,
  className = "absolute right-8 top-1/2 -translate-y-1/2 z-30"
}) => {
  const { draftContent, isEditing, updateDraft } = useContent();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);

  if (!isEditing || !draftContent) return null;

  const getVideoSettings = () => {
    if (!videoPath) return null;
    const keys = videoPath.split('.');
    let current: any = draftContent;
    for (const key of keys) {
      if (!current || current[key] === undefined) return null;
      current = current[key];
    }
    return current;
  };

  const videoSettings = getVideoSettings();

  return (
    <>
      <div className={`${className} flex flex-col gap-4`}>
        <button
          onClick={() => setIsGalleryOpen(true)}
          className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-brand-orange hover:border-brand-orange transition-all shadow-xl group"
          title="Cambiar Imagen de Fondo"
        >
          <ImageIcon size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        {videoPath && (
          <button
            onClick={() => setIsYoutubeModalOpen(true)}
            className={`w-12 h-12 backdrop-blur-md border rounded-full flex items-center justify-center transition-all shadow-xl group ${
              videoSettings?.enabled 
                ? 'bg-brand-orange border-brand-orange text-white' 
                : 'bg-white/10 border-white/20 text-white hover:bg-brand-orange hover:border-brand-orange'
            }`}
            title="Configurar Video de YouTube"
          >
            <Youtube size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      <GalleryModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(url) => updateDraft(path, url)}
      />

      {videoPath && (
        <YoutubeSettingsModal 
          isOpen={isYoutubeModalOpen}
          onClose={() => setIsYoutubeModalOpen(false)}
          videoPath={videoPath}
        />
      )}
    </>
  );
};

const YoutubeSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; videoPath: string }> = ({ isOpen, onClose, videoPath }) => {
  const { draftContent, updateDraft } = useContent();
  
  if (!draftContent) return null;
  
  const getVideoSettings = () => {
    const keys = videoPath.split('.');
    let current: any = draftContent;
    for (const key of keys) {
      if (!current || current[key] === undefined) return {
        enabled: false,
        url: '',
        muted: true,
        startTime: 0,
        endTime: 0
      };
      current = current[key];
    }
    return current;
  };

  const video = getVideoSettings();

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                  <Youtube className="text-red-600" />
                  Video de Fondo
                </h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Toggle Enabled */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="font-bold text-sm">Activar Video</p>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Reemplaza la imagen de fondo</p>
                </div>
                <button 
                  onClick={() => updateDraft(`${videoPath}.enabled`, !video.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    video.enabled ? 'bg-brand-orange' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    video.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link de YouTube</label>
                <input 
                  type="text"
                  value={video.url}
                  onChange={(e) => updateDraft(`${videoPath}.url`, e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Time */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Clock size={10} /> Inicio (HH:MM:SS)
                  </label>
                  <input 
                    type="text"
                    value={formatTime(video.startTime)}
                    onChange={(e) => updateDraft(`${videoPath}.startTime`, parseTime(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none text-sm font-mono"
                  />
                </div>
                {/* End Time */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Clock size={10} /> Fin (HH:MM:SS)
                  </label>
                  <input 
                    type="text"
                    value={formatTime(video.endTime)}
                    onChange={(e) => updateDraft(`${videoPath}.endTime`, parseTime(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none text-sm font-mono"
                  />
                </div>
              </div>

              {/* Muted Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  {video.muted ? <VolumeX className="text-gray-400" size={20} /> : <Volume2 className="text-brand-orange" size={20} />}
                  <div>
                    <p className="font-bold text-sm">Silenciar Video</p>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Recomendado para fondos</p>
                  </div>
                </div>
                <button 
                  onClick={() => updateDraft(`${videoPath}.muted`, !video.muted)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    video.muted ? 'bg-brand-orange' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    video.muted ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <button 
                onClick={onClose}
                className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                <Save size={20} />
                <span>Aplicar Configuración</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
