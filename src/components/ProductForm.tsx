import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { 
  X, Save, Plus, Trash2, MapPin, Settings, Upload, Loader2, FileDown, Wand2, ChevronLeft, Image as ImageIcon, Package, Check, Sliders, AlertCircle
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { Product, Category, Location, Atributo, VarianteProducto } from '../types';
import { getCategories, getLocations, updateProduct, addProduct as addProductService } from '../firebase/services';
import { GalleryModal, ImageWithFallback } from './EditableImage';

const productSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  category: z.string().min(1, 'Categoría requerida'),
  subcategory: z.string().optional(),
  price: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().optional()),
  stock: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().optional()),
  description: z.string(),
  images: z.array(z.string()),
  pdfUrl: z.string(),
  location: z.string().optional(),
  specs: z.record(z.string(), z.string()),
});

type ProductFormData = {
  name: string;
  category: string;
  subcategory?: string;
  price?: number;
  stock?: number;
  description: string;
  images: string[];
  pdfUrl: string;
  location?: string;
  specs: Record<string, string>;
};

function SortableImage({ url, index, onRemove }: { url: string, index: number, onRemove: () => void, key?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative aspect-square rounded-xl overflow-hidden group border border-gray-100 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <ImageWithFallback
        src={url}
        alt=""
        className="w-full h-full object-cover pointer-events-none"
      />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-lg hover:bg-red-700 z-10"
      >
        <Trash2 size={14} />
      </button>
      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity">
        #{index + 1}
      </div>
    </div>
  );
}

interface ProductFormProps {
  product?: Product | null;
  globalAttributes?: Atributo[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface VariationImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  onSelect: (url: string) => void;
}

function VariationImageModal({ isOpen, onClose, images, onSelect }: VariationImageModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
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
        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black tracking-tighter uppercase">Asignar Imagen a Variante</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Selecciona una imagen de la galería de este producto</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {images.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <ImageIcon size={48} className="text-gray-100 mx-auto mb-4" />
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Sube imágenes a la galería del producto primero</p>
            </div>
          ) : (
            images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelect(url);
                  onClose();
                }}
                className="aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-brand-orange transition-all group relative"
              >
                <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-brand-orange/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Check className="text-white" size={32} />
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export default function ProductForm({ product, globalAttributes = [], onSuccess, onCancel }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Variation Image Selection State
  const [variationImageModal, setVariationImageModal] = useState<{ isOpen: boolean; variationIdx: number | null }>({
    isOpen: false,
    variationIdx: null
  });

  // Variations State
  const [hasVariations, setHasVariations] = useState(product?.hasVariations || false);
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: string[] }>(
    product?.applicableAttributes?.reduce((acc, curr) => ({
      ...acc,
      [curr.attributeId]: curr.selectedValues
    }), {}) || {}
  );
  const [variations, setVariations] = useState<VarianteProducto[]>(product?.variations || []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      category: '',
      subcategory: '',
      price: undefined,
      stock: undefined,
      description: '',
      images: [],
      pdfUrl: '',
      location: '',
      specs: {}
    }
  });

  const productImages = watch('images') || [];
  const pdfUrl = watch('pdfUrl');

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDescriptions, setAiDescriptions] = useState<string[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const generateAiDescriptions = async () => {
    const values = watch();
    if (!values.name) {
      alert("Por favor, ingresa al menos el nombre del producto.");
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai/generate-descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          category: values.category,
          subcategory: values.subcategory,
          currentDescription: values.description,
          images: values.images
        })
      });

      if (!response.ok) throw new Error('Failed to generate');
      const data = await response.json();
      setAiDescriptions(data.descriptions);
      setIsAiModalOpen(true);
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Error al generar las descripciones. Por favor, intenta de nuevo.");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const [cats, locs] = await Promise.all([getCategories(), getLocations()]);
      setCategories(cats);
      setLocations(locs);
    };
    fetchData();
    
    if (product) {
      reset({
        name: product.name,
        category: product.category,
        subcategory: product.subcategory || '',
        price: product.price,
        stock: product.stock,
        description: product.description || '',
        images: product.images || [],
        pdfUrl: product.pdfUrl || '',
        location: product.location || '',
        specs: product.specs || {}
      });
      setHasVariations(product.hasVariations || false);
      setVariations(product.variations || []);
      const appAttrs = product.applicableAttributes?.reduce((acc, curr) => ({
        ...acc,
        [curr.attributeId]: curr.selectedValues
      }), {}) || {};
      setSelectedAttributes(appAttrs);
    } else {
      reset({
        name: '',
        category: '',
        subcategory: '',
        price: undefined,
        stock: undefined,
        description: '',
        images: [],
        pdfUrl: '',
        location: '',
        specs: {}
      });
    }
  }, [product, reset]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = productImages.indexOf(active.id as string);
      const newIndex = productImages.indexOf(over?.id as string);
      setValue('images', arrayMove(productImages, oldIndex, newIndex));
    }
  };

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      const cleanData = Object.entries(data).reduce((acc: any, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      // Add Variations Data
      cleanData.hasVariations = hasVariations;
      if (hasVariations) {
        cleanData.variations = variations;
        cleanData.applicableAttributes = Object.entries(selectedAttributes)
          .filter(([_, values]) => Array.isArray(values) && (values as string[]).length > 0)
          .map(([id, values]) => {
            const attr = globalAttributes.find(a => a.id === id);
            return {
              attributeId: id,
              attributeName: attr?.nombre || 'Desconocido',
              selectedValues: values as string[]
            };
          });
        // If it has variations, we might want to clear the main price if desired, 
        // but user usually sets a "base price" too. 
        // The prompt says "Si se activa, debe ocultar visualmente el precio/stock genérico".
        // We keep the value in state but the UI hides it.
      } else {
        cleanData.variations = [];
        cleanData.applicableAttributes = [];
      }

      if (product) {
        await updateProduct(product.id, cleanData);
      } else {
        await addProductService(cleanData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const generateVariations = () => {
    const selectedAttrsList = globalAttributes
      .filter(attr => selectedAttributes[attr.id]?.length > 0)
      .map(attr => ({
        name: attr.nombre,
        id: attr.id,
        values: selectedAttributes[attr.id]
      }));

    if (selectedAttrsList.length === 0) return;

    // Cartesian Product logic
    const combine = (input: any[]): any[] => {
      if (input.length === 0) return [[]];
      const result: any[] = [];
      const [first, ...rest] = input;
      const combinations = combine(rest);
      first.values.forEach((val: string) => {
        combinations.forEach((combo: any) => {
          result.push([{ attrName: first.name, attrId: first.id, value: val }, ...combo]);
        });
      });
      return result;
    };

    const combinations = combine(selectedAttrsList);
    
    const newVariations: VarianteProducto[] = combinations.map(combo => {
      const combiMap: { [key: string]: string } = {};
      const comboTextParts: string[] = [];
      
      combo.forEach((item: any) => {
        combiMap[item.attrName] = item.value;
        comboTextParts.push(item.value);
      });

      const comboText = comboTextParts.join(' / ');
      const basePrice = watch('price') || 0;
      const skuBase = watch('name').substring(0, 3).toUpperCase();
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        sku: `${skuBase}-${comboTextParts.map(t => t.substring(0, 2).toUpperCase()).join('-')}`,
        precio: basePrice,
        stock: 0,
        combinacion: combiMap,
        textoCombinacion: comboText
      };
    });

    setVariations(newVariations);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={onCancel}
          className="flex items-center space-x-2 text-gray-400 hover:text-brand-orange transition-colors group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Volver al Listado</span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="bg-brand-orange/10 p-2 rounded-xl">
            <Package size={20} className="text-brand-orange" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter uppercase">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Nombre del Producto</label>
              <input {...register('name')} placeholder="Crema para peinar" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-orange transition-all font-bold" />
              {errors.name && <p className="text-red-500 text-[10px] font-black pl-2 mt-1 uppercase tracking-tighter">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Categoría Principal</label>
              <select {...register('category')} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-orange font-bold">
                <option value="">Seleccionar...</option>
                {categories.filter(c => !c.parentId).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {errors.category && <p className="text-red-500 text-[10px] font-black pl-2 mt-1 uppercase tracking-tighter">{errors.category.message}</p>}
            </div>

            {(() => {
              const selectedCatName = watch('category');
              const selectedCat = categories.find(c => c.name === selectedCatName && !c.parentId);
              const subcategories = categories.filter(c => c.parentId === selectedCat?.id);
              
              if (subcategories.length === 0) return null;
              
              return (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Subcategoría (Opcional)</label>
                  <select {...register('subcategory')} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-orange font-bold">
                    <option value="">Ninguna</option>
                    {subcategories.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              );
            })()}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Ubicación del Producto</label>
              <select {...register('location')} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-orange font-bold">
                <option value="">Sin ubicación</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.title}>{loc.title}</option>
                ))}
              </select>
            </div>

            {!hasVariations && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">Precio (MXN)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-orange font-black">$</span>
                    <input 
                      type="number" 
                      step="any"
                      {...register('price', { valueAsNumber: true })} 
                      className="w-full pl-10 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-orange font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-[10px] font-black pl-2 mt-1 uppercase tracking-tighter">{errors.price.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">Stock (Existencias)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      {...register('stock', { valueAsNumber: true })} 
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-orange font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      placeholder="Ej: 10"
                    />
                  </div>
                  {errors.stock && <p className="text-red-500 text-[10px] font-black pl-2 mt-1 uppercase tracking-tighter">{errors.stock.message}</p>}
                </div>
              </>
            )}
          </div>

          {/* VARIATIONS SYSTEM */}
          <div className="space-y-8 bg-brand-orange/5 p-8 md:p-10 rounded-[3rem] border border-brand-orange/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sliders size={80} className="text-brand-orange" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                  <Sliders size={20} className="text-brand-orange" />
                  Variaciones de Producto
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Habilita opciones como color, material o tamaño con precios y stocks independientes.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={hasVariations}
                  onChange={(e) => {
                    setHasVariations(e.target.checked);
                    if (!e.target.checked) {
                      setVariations([]);
                      setSelectedAttributes({});
                    }
                  }}
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
                <span className="ml-3 text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-brand-orange transition-colors">
                  {hasVariations ? 'Variaciones Activas' : '¿Tiene variaciones?'}
                </span>
              </label>
            </div>

            <AnimatePresence>
              {hasVariations && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-10 overflow-hidden"
                >
                  {/* Step 1: Attribute Selection */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 text-brand-orange">
                      <div className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center text-[10px] font-black">1</div>
                      <h4 className="text-xs font-black uppercase tracking-widest">Selector de Atributos Aplicables</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {globalAttributes.map((attr) => {
                        const isAttrSelected = (selectedAttributes[attr.id] || []).length > 0;
                        return (
                          <div 
                            key={attr.id} 
                            className={`bg-white p-6 rounded-[2rem] border-2 transition-all ${
                              isAttrSelected ? 'border-brand-orange shadow-md' : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-black uppercase tracking-tighter">{attr.nombre}</span>
                              {isAttrSelected && (
                                <div className="bg-green-500 text-white p-1 rounded-full">
                                  <Check size={10} strokeWidth={4} />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {(attr.valores || []).map((opp, oIdx) => {
                                const isValSelected = selectedAttributes[attr.id]?.includes(opp.nombre);
                                return (
                                  <button
                                    key={opp.id || `${attr.id}-opp-${oIdx}`}
                                    type="button"
                                    onClick={() => {
                                      const current = selectedAttributes[attr.id] || [];
                                      const updated = current.includes(opp.nombre)
                                        ? current.filter(v => v !== opp.nombre)
                                        : [...current, opp.nombre];
                                      setSelectedAttributes({
                                        ...selectedAttributes,
                                        [attr.id]: updated
                                      });
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-2 ${
                                      isValSelected 
                                        ? 'bg-brand-orange text-white' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                                  >
                                    {opp.tipoValor === 'color' && (
                                      <div className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: opp.valorExtra }} />
                                    )}
                                    {opp.tipoValor === 'imagen' && (
                                      <img src={opp.valorExtra} className="w-3 h-3 rounded-full object-cover border border-black/5" />
                                    )}
                                    {opp.nombre}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={generateVariations}
                        disabled={Object.values(selectedAttributes).every((v: string[]) => v.length === 0)}
                        className="flex items-center space-x-2 bg-brand-black text-white px-8 py-4 rounded-2xl hover:bg-brand-orange transition-all disabled:opacity-20 disabled:cursor-not-allowed group shadow-lg"
                      >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Generar Variaciones</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Variations Table */}
                  {variations.length > 0 && (
                    <div className="space-y-6 pt-6 border-t border-brand-orange/10">
                      <div className="flex items-center space-x-3 text-brand-orange">
                        <div className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center text-[10px] font-black">2</div>
                        <h4 className="text-xs font-black uppercase tracking-widest">Matriz de Variaciones</h4>
                      </div>

                      <div className="bg-white rounded-[2rem] border border-stone-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-200">
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Imagen</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Combinación</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">SKU</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Precio ($)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Stock piezas</th>
                                <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {variations.map((variant, idx) => (
                                <tr key={variant.id} className="hover:bg-stone-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    {variant.imagen ? (
                                      <div className="relative group w-12 h-12">
                                        <img src={variant.imagen} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            const newVar = [...variations];
                                            newVar[idx].imagen = undefined;
                                            setVariations(newVar);
                                          }}
                                          className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                          <X size={10} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setVariationImageModal({ isOpen: true, variationIdx: idx })}
                                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                                        >
                                          <span className="text-[8px] font-black text-white uppercase tracking-tighter">Cambiar</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setVariationImageModal({ isOpen: true, variationIdx: idx })}
                                        className="w-12 h-12 rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 hover:border-brand-orange hover:text-brand-orange transition-all"
                                      >
                                        <Plus size={16} />
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-xs font-black text-brand-black uppercase">{variant.textoCombinacion}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <input 
                                      type="text" 
                                      value={variant.sku}
                                      onChange={(e) => {
                                        const newVar = [...variations];
                                        newVar[idx].sku = e.target.value;
                                        setVariations(newVar);
                                      }}
                                      className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-orange"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-[10px]">$</span>
                                      <input 
                                        type="number" 
                                        value={variant.precio || ''}
                                        onChange={(e) => {
                                          const newVar = [...variations];
                                          newVar[idx].precio = e.target.value === '' ? undefined : Number(e.target.value);
                                          setVariations(newVar);
                                        }}
                                        className="w-32 bg-gray-50 border-none rounded-lg pl-5 pr-3 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-orange"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <input 
                                      type="number" 
                                      value={variant.stock}
                                      onChange={(e) => {
                                        const newVar = [...variations];
                                        newVar[idx].stock = Number(e.target.value);
                                        setVariations(newVar);
                                      }}
                                      className="w-24 bg-gray-50 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-orange"
                                    />
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setVariations(variations.filter((_, i) => i !== idx));
                                      }}
                                      className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-brand-orange/10 p-4 rounded-2xl text-brand-orange">
                        <AlertCircle size={16} />
                        <p className="text-[10px] font-bold uppercase tracking-wider">
                          Se han generado {variations.length} combinaciones posibles. Puedes editarlas o eliminar las que no utilices.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Specifications */}
          {(() => {
            const selectedCatName = watch('category');
            const selectedSubName = watch('subcategory');
            
            const selectedCat = categories.find(c => c.name === selectedCatName && !c.parentId);
            const selectedSub = categories.find(c => c.name === selectedSubName && c.parentId === selectedCat?.id);
            
            const specs = selectedSub?.specifications?.length ? selectedSub.specifications : (selectedCat?.specifications || []);
            const displayName = selectedSubName || selectedCatName;
            
            if (specs.length === 0) return null;
            
            return (
              <div className="space-y-6 pt-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4 flex items-center space-x-3">
                  <Settings size={16} className="text-brand-orange" />
                  <span>Especificaciones Técnicas para {displayName}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {specs.map((spec) => (
                    <div key={spec} className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">{spec}</label>
                      <input 
                        {...register(`specs.${spec}` as any)} 
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-orange font-bold" 
                        placeholder={`Ej: ${spec}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Galería de Imágenes</label>
                <p className="text-[10px] text-gray-400 mt-1">Sube al menos una imagen. Arrastra para reordenar el orden de visualización.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(true)}
                className="flex items-center space-x-2 text-brand-orange hover:text-brand-orange/80 transition-colors"
              >
                <ImageIcon size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Abrir Galería</span>
              </button>
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-gray-50/50 rounded-3xl border border-gray-100 border-dashed">
                <SortableContext 
                  items={productImages}
                  strategy={rectSortingStrategy}
                >
                  {productImages.map((url, index) => (
                    <SortableImage 
                      key={url} 
                      url={url} 
                      index={index} 
                      onRemove={() => {
                        const newImages = productImages.filter((_, i) => i !== index);
                        setValue('images', newImages);
                      }}
                    />
                  ))}
                </SortableContext>
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(true)}
                  className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-brand-orange hover:text-brand-orange transition-all group bg-white"
                >
                  <Plus size={32} className="group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Añadir</span>
                </button>
              </div>
            </DndContext>
          </div>

          <GalleryModal 
            isOpen={isGalleryModalOpen}
            onClose={() => setIsGalleryModalOpen(false)}
            multiple={true}
            onSelect={(urls) => {
              const newUrls = urls.filter(url => !productImages.includes(url));
              if (newUrls.length > 0) {
                setValue('images', [...productImages, ...newUrls]);
              }
            }}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción Comercial</label>
              <button
                type="button"
                onClick={generateAiDescriptions}
                disabled={isAiLoading}
                className="flex items-center space-x-2 text-brand-orange hover:text-brand-orange/80 transition-colors disabled:opacity-50 group px-3 py-1.5 bg-brand-orange/5 rounded-full"
              >
                {isAiLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Wand2 size={14} className="group-hover:rotate-12 transition-transform" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">Sugerir con AI</span>
              </button>
            </div>
            <textarea 
              {...register('description')} 
              rows={6} 
              placeholder="Describe detalladamente el producto para tus clientes..."
              className="w-full px-6 py-5 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-brand-orange resize-none font-medium leading-relaxed"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">Ficha Técnica (PDF)</label>
              <div className="flex items-center space-x-4">
                {pdfUrl ? (
                  <div className="flex-grow flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="bg-brand-orange/10 p-2 rounded-lg">
                        <FileDown className="text-brand-orange flex-shrink-0" size={20} />
                      </div>
                      <span className="text-sm font-bold truncate">Ficha_Tecnica_{product?.name || 'Producto'}.pdf</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setValue('pdfUrl', '')}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ) : (
                  <label className={`flex-grow flex items-center justify-center space-x-3 px-6 py-6 border-2 border-dashed border-gray-200 rounded-[2rem] cursor-pointer hover:border-brand-orange hover:bg-brand-orange/5 transition-all group bg-gray-50/30 ${isPdfUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isPdfUploading ? (
                      <Loader2 className="animate-spin text-brand-orange" size={24} />
                    ) : (
                      <Upload className="text-gray-400 group-hover:text-brand-orange" size={24} />
                    )}
                    <span className="text-xs font-black text-gray-400 group-hover:text-brand-orange uppercase tracking-widest">
                      {isPdfUploading ? 'Subiendo Documento...' : 'Subir Ficha Técnica PDF'}
                    </span>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setIsPdfUploading(true);
                        try {
                          const sRef = storageRef(storage, `products/pdfs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
                          await uploadBytes(sRef, file);
                          const url = await getDownloadURL(sRef);
                          setValue('pdfUrl', url);
                        } catch (error) {
                          console.error("Error uploading PDF:", error);
                        } finally {
                          setIsPdfUploading(false);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-brand-orange text-white py-6 rounded-[2rem] flex items-center justify-center space-x-3 shadow-xl shadow-brand-orange/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <Save size={24} />
                )}
                <span className="text-lg font-black uppercase tracking-tighter">
                  {product ? 'Actualizar Producto' : 'Publicar Producto'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <VariationImageModal 
        isOpen={variationImageModal.isOpen}
        onClose={() => setVariationImageModal({ isOpen: false, variationIdx: null })}
        images={productImages}
        onSelect={(url) => {
          if (variationImageModal.variationIdx !== null) {
            const newVar = [...variations];
            newVar[variationImageModal.variationIdx].imagen = url;
            setVariations(newVar);
          }
        }}
      />

      {isAiModalOpen && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiModalOpen(false)}
              className="absolute inset-0 bg-brand-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-brand-orange/10 rounded-xl">
                    <Wand2 size={24} className="text-brand-orange" />
                  </div>
                  <h3 className="text-xl font-black tracking-tighter uppercase">Ideas Mágicas</h3>
                </div>
                <button onClick={() => setIsAiModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">Selecciona la descripción que más te guste:</p>
                {aiDescriptions.map((desc, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    type="button"
                    onClick={() => {
                      setValue('description', desc);
                      setIsAiModalOpen(false);
                    }}
                    className="w-full text-left p-6 rounded-3xl border border-gray-100 hover:border-brand-orange hover:bg-brand-orange/5 transition-all group relative overflow-hidden"
                  >
                    <p className="text-sm leading-relaxed text-gray-700 group-hover:text-brand-black transition-colors font-medium">
                      {desc}
                    </p>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={20} className="text-brand-orange" />
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="p-6 bg-gray-50/50 flex justify-end text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                Impulsado por Gemini AI 2.0
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// Re-using Product from types.ts
