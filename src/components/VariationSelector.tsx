import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Atributo, Product, VarianteProducto } from '../types';
import { Check } from 'lucide-react';

interface VariationSelectorProps {
  product: Product;
  globalAttributes: Atributo[];
  selectedVariant: VarianteProducto | null;
  onVariantChange: (variant: VarianteProducto | null) => void;
}

const colorMap: { [key: string]: string } = {
  'Negro': '#000000',
  'Blanco': '#FFFFFF',
  'Rojo': '#FF0000',
  'Azul': '#0000FF',
  'Verde': '#00FF00',
  'Amarillo': '#FFFF00',
  'Gris': '#808080',
  'Naranja': '#FFA500',
  'Marrón': '#A52A2A',
  'Cafe': '#A52A2A',
  'Oro': '#D4AF37',
  'Plata': '#C0C0C0',
  'Nogal': '#5D4037',
  'Roble': '#8D6E63',
  'Parota': '#4E342E',
  'Beige': '#F5F5DC',
  'Chocolate': '#3E2723',
};

export default function VariationSelector({ product, globalAttributes, selectedVariant, onVariantChange }: VariationSelectorProps) {
  // Current partial selection
  const [selections, setSelections] = React.useState<{ [key: string]: string }>({});

  const applicableAttrs = useMemo(() => {
    return product.applicableAttributes?.map(aa => {
      const global = globalAttributes.find(g => g.id === aa.attributeId);
      return {
        id: aa.attributeId,
        name: aa.attributeName || global?.nombre || 'Desconocido',
        values: aa.selectedValues
      };
    }) || [];
  }, [product.applicableAttributes, globalAttributes]);

  const variations = product.variations || [];

  // Initialize selections with the first valid combination if none selected
  React.useEffect(() => {
    if (variations.length > 0 && Object.keys(selections).length === 0 && !selectedVariant) {
      // Keep empty first for clarity
    }
  }, [variations]);

  const isOptionAvailable = (attrName: string, value: string) => {
    // An option is available if there's a variant that matches ALL OTHER current selections
    // AND this specific value.
    return variations.some(v => {
      // Check if variant matches other current selections
      const matchesOthers = Object.entries(selections).every(([sName, sVal]) => {
        if (sName === attrName) return true; // Skip current attr
        const vVal = v.combinacion[sName] as string | undefined;
        return vVal && sVal && vVal.toLowerCase() === (sVal as string).toLowerCase();
      });

      const currentVVal = v.combinacion[attrName] as string | undefined;
      return currentVVal && currentVVal.toLowerCase() === value.toLowerCase() && v.stock > 0;
    });
  };

  const handleSelect = (attrName: string, value: string) => {
    const newSelections = { ...selections, [attrName]: value };
    setSelections(newSelections);

    // Check if we have a complete combination
    const isComplete = applicableAttrs.every(aa => newSelections[aa.name]);
    if (isComplete) {
      const found = variations.find(v => 
        applicableAttrs.every(aa => {
          const selVal = newSelections[aa.name] as string | undefined;
          const vVal = v.combinacion[aa.name] as string | undefined;
          return vVal && selVal && vVal.toLowerCase() === selVal.toLowerCase();
        })
      );
      onVariantChange(found || null);
    } else {
      onVariantChange(null);
    }
  };

  const getStyleForOption = (attrId: string, value: string) => {
    const attr = globalAttributes.find(a => a.id === attrId);
    if (!attr || !attr.esVisual) return null;

    const option = attr.valores.find(v => v.nombre.toLowerCase() === value.toLowerCase());
    if (!option) return null;

    if (option.tipoValor === 'color') {
      return { backgroundColor: option.valorExtra };
    }
    if (option.tipoValor === 'imagen') {
      return { backgroundImage: `url(${option.valorExtra})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return null;
  };

  if (!product.hasVariations || applicableAttrs.length === 0) return null;

  return (
    <div className="space-y-8 py-6 border-t border-gray-100 w-full flex flex-col items-center">
      {applicableAttrs.map((attr) => {
        const globalRef = globalAttributes.find(g => g.id === attr.id);
        const isVisual = globalRef?.esVisual || false;
        
        return (
          <div key={attr.id} className="space-y-4 w-full flex flex-col items-center text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Seleccionar {attr.name}
              </h4>
              {selections[attr.name] && (
                <span className="text-[10px] font-bold text-brand-orange uppercase">
                  ({selections[attr.name]})
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {attr.values.map((val) => {
                const available = isOptionAvailable(attr.name, val);
                const isSelected = selections[attr.name] === val;
                const visualStyle = getStyleForOption(attr.id, val);
                
                if (isVisual && visualStyle) {
                  return (
                    <button
                      key={val}
                      onClick={() => available && handleSelect(attr.name, val)}
                      disabled={!available}
                      className={`relative w-11 h-11 rounded-full transition-all group ${
                        !available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                      } ${
                        isSelected ? 'ring-4 ring-brand-orange ring-offset-2' : 'ring-1 ring-gray-200'
                      }`}
                      title={val}
                    >
                      <div 
                        className="w-full h-full rounded-full border border-black/5"
                        style={visualStyle as React.CSSProperties}
                      />
                      {!available && (
                         <div className="absolute inset-0 flex items-center justify-center transform rotate-45 pointer-events-none">
                            <div className="w-full h-px bg-gray-400" />
                         </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-brand-orange text-white rounded-full p-0.5 shadow-lg">
                          <Check size={10} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={val}
                    onClick={() => available && handleSelect(attr.name, val)}
                    disabled={!available}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all relative overflow-hidden flex items-center justify-center min-w-[70px] ${
                      !available 
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-40' 
                        : isSelected
                          ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/20'
                          : 'bg-white text-gray-500 border border-stone-200 hover:border-brand-orange hover:text-brand-orange'
                    }`}
                  >
                    {val}
                    {!available && (
                      <div className="absolute inset-0 flex items-center justify-center transform rotate-12 pointer-events-none">
                         <div className="w-full h-px bg-gray-300" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
