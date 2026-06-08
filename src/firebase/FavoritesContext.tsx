import React, { createContext, useContext, useState, useEffect } from 'react';

interface FlyToHeartEvent {
  id: string;
  x: number;
  y: number;
}

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (productId: string, event?: React.MouseEvent | { x: number; y: number }) => void;
  isFavorite: (productId: string) => boolean;
  flyToHeartEvent: FlyToHeartEvent | null;
  clearFlyEvent: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('ph_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [flyToHeartEvent, setFlyToHeartEvent] = useState<FlyToHeartEvent | null>(null);

  useEffect(() => {
    localStorage.setItem('ph_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (productId: string, event?: React.MouseEvent | { x: number; y: number }) => {
    const isAdding = !favorites.includes(productId);
    
    if (isAdding && event) {
      const coords = 'clientX' in event 
        ? { x: event.clientX, y: event.clientY } 
        : event;
      
      setFlyToHeartEvent({
        id: Math.random().toString(36).substr(2, 9),
        ...coords
      });
    }

    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const clearFlyEvent = () => setFlyToHeartEvent(null);

  const isFavorite = (productId: string) => favorites.includes(productId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, flyToHeartEvent, clearFlyEvent }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
