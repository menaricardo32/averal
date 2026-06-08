import React from 'react';
import { useContent } from '../firebase/ContentContext';

interface EditableTextProps {
  path: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

export const EditableText: React.FC<EditableTextProps> = ({ path, className = '', as: Component = 'span' }) => {
  const { draftContent, isEditing, updateDraft } = useContent();

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

  const handleChange = (e: React.FormEvent<HTMLSpanElement>) => {
    updateDraft(path, e.currentTarget.innerText);
  };

  const value = getValue();

  if (!isEditing) {
    return <Component className={className}>{value}</Component>;
  }

  return (
    <Component
      contentEditable
      suppressContentEditableWarning
      onBlur={handleChange}
      className={`${className} outline-none focus:ring-2 focus:ring-brand-orange/50 rounded px-1 transition-all bg-brand-orange/5 border border-dashed border-brand-orange/30`}
    >
      {value}
    </Component>
  );
};
