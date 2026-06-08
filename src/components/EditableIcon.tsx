import React, { useState } from 'react';
import { useContent } from '../firebase/ContentContext';
import { LucideIcon, Image as ImageIcon } from 'lucide-react';
import { GalleryModal } from './EditableImage';

interface EditableIconProps {
  path: string;
  defaultIcon: LucideIcon;
  className?: string;
  iconClassName?: string;
  containerClassName?: string;
}

export const EditableIcon: React.FC<EditableIconProps> = ({ 
  path, 
  defaultIcon: DefaultIcon, 
  className = '', 
  iconClassName = '',
  containerClassName = 'relative group'
}) => {
  const { draftContent, isEditing, updateDraft } = useContent();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const getIconUrl = () => {
    if (!draftContent) return null;
    const keys = path.split('.');
    let current: any = draftContent;
    for (const key of keys) {
      if (!current || current[key] === undefined) return null;
      current = current[key];
    }
    return typeof current === 'string' ? current : null;
  };

  const iconUrl = getIconUrl();

  return (
    <div className={containerClassName}>
      {iconUrl ? (
        <img 
          src={iconUrl} 
          alt="Icon" 
          className={iconClassName || className} 
          referrerPolicy="no-referrer"
        />
      ) : (
        <DefaultIcon className={iconClassName || className} />
      )}

      {isEditing && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsGalleryOpen(true);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-brand-orange text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
          title="Cambiar Icono"
        >
          <ImageIcon size={12} />
        </button>
      )}

      <GalleryModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(url) => updateDraft(path, url)}
      />
    </div>
  );
};
