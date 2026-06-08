import React, { useState } from 'react';
import { useBranding } from '../firebase/BrandingContext';

interface SmartLogoProps {
  variant?: 'auto' | 'light' | 'dark';
  type?: 'logo' | 'isotype';
  className?: string;
  isDarkBackground?: boolean;
}

export default function SmartLogo({ 
  variant = 'auto', 
  type = 'logo', 
  className = "h-8 w-auto",
  isDarkBackground = false 
}: SmartLogoProps) {
  const { branding, loading } = useBranding();
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine which logo to use
  const getLogoUrl = () => {
    if (!branding) return null;

    const isLight = variant === 'light' || (variant === 'auto' && isDarkBackground);
    
    if (type === 'logo') {
      return isLight ? (branding.logoLight || branding.logoDark) : (branding.logoDark || branding.logoLight);
    } else {
      return isLight ? (branding.isotypeLight || branding.isotypeDark) : (branding.isotypeDark || branding.isotypeLight);
    }
  };

  const logoUrl = getLogoUrl();

  // If we have a logoUrl, we render the img tag immediately.
  // The skeleton will only show if the image hasn't finished loading yet.
  
  if (loading && !branding) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
  }

  if (!logoUrl) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-brand-orange p-1.5 rounded">
          <span className="text-white font-black text-xl tracking-tighter">A</span>
        </div>
        <span className={`font-black text-lg tracking-tight ${isDarkBackground ? 'text-white' : 'text-brand-black'} hidden sm:block`}>
          AVERAL
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-block leading-[0]">
      <img
        src={logoUrl}
        alt="Averal"
        className={`${className} object-contain transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={(e) => {
          setIsLoaded(true);
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
