import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2,
  Ticket, 
  Calendar, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  X, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Promotion } from '../types';
import { addPromotion, updatePromotion, deletePromotion } from '../firebase/services';
import { motion } from 'motion/react';

interface PromotionsManagerProps {
  promotions: Promotion[];
  onRefresh: () => void;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

export default function PromotionsManager({ promotions, onRefresh }: PromotionsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minPurchase, setMinPurchase] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinPurchase('');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setError(null);
    setEditingPromotion(null);
  };

  const handleEditClick = (promo: Promotion) => {
    setEditingPromotion(promo);
    setCode(promo.code);
    setDiscountType(promo.discountType);
    setDiscountValue(promo.discountValue);
    setMinPurchase(promo.minPurchase != null ? promo.minPurchase.toString() : '');
    setStartDate(promo.startDate || '');
    setEndDate(promo.endDate || '');
    setIsActive(promo.isActive);
    setIsAdding(true);
    setError(null);
    
    // Scroll smoothly to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      setError('El código del cupón es requerido.');
      return;
    }

    if (discountValue <= 0) {
      setError('El valor del descuento debe ser mayor a 0.');
      return;
    }

    if (discountType === 'percentage' && discountValue > 100) {
      setError('El porcentaje de descuento no puede ser mayor a 100%.');
      return;
    }

    // Check if code already exists
    const duplicate = promotions.find(p => p.code.toUpperCase() === cleanCode && p.id !== editingPromotion?.id);
    if (duplicate) {
      setError(`Ya existe una promoción con el código "${cleanCode}".`);
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedMinPurchase = minPurchase ? parseFloat(minPurchase) : null;
      
      const payload = {
        code: cleanCode,
        discountType,
        discountValue,
        minPurchase: parsedMinPurchase !== null && !isNaN(parsedMinPurchase) ? parsedMinPurchase : null,
        startDate: startDate || null,
        endDate: endDate || null,
        isActive
      };

      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, payload);
      } else {
        await addPromotion(payload);
      }

      resetForm();
      setIsAdding(false);
      onRefresh();
    } catch (err: any) {
      console.error('Error saving promotion:', err);
      setError('Error al guardar la promoción. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    try {
      await updatePromotion(promo.id, { isActive: !promo.isActive });
      onRefresh();
    } catch (err) {
      console.error('Error updating promotion state:', err);
    }
  };

  const handleDelete = async (id: string, codeStr: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el cupón "${codeStr}"?`)) {
      try {
        await deletePromotion(id);
        onRefresh();
      } catch (err) {
        console.error('Error deleting promotion:', err);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(price) + ' MXN';
  };

  return (
    <div className="space-y-8">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="bg-brand-orange/10 p-3 h-12 w-12 rounded-2xl flex items-center justify-center text-brand-orange flex-shrink-0">
            <Ticket size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total de Cupones</p>
            <p className="text-2xl font-black tracking-tight">{promotions.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="bg-green-50 p-3 h-12 w-12 rounded-2xl flex items-center justify-center text-green-500 flex-shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Cupones Activos</p>
            <p className="text-2xl font-black tracking-tight text-green-600">
              {promotions.filter(p => p.isActive).length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center sm:justify-start">
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              resetForm();
            }}
            className="w-full sm:w-auto h-full px-6 py-4 bg-brand-orange text-white font-black rounded-2xl hover:bg-brand-orange/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-orange/10"
          >
            {isAdding ? <X size={20} /> : <Plus size={20} />}
            <span>{isAdding ? 'Cancelar' : 'Crear Cupón'}</span>
          </button>
        </div>
      </div>

      {/* Add form */}
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-brand-orange/10 p-2.5 rounded-xl text-brand-orange">
              <Ticket size={20} />
            </div>
            <h3 className="text-xl font-black tracking-tight">
              {editingPromotion ? 'Editar Código de Descuento' : 'Generar Nuevo Código de Descuento'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 font-semibold text-sm">
                <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Promo Code */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Código del Cupón</label>
                <input 
                  required
                  type="text"
                  placeholder="Ej: HOTSALE15, BIENVENIDA10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black tracking-wider focus:ring-2 focus:ring-brand-orange uppercase text-center"
                />
                <p className="text-[10px] text-gray-400 font-bold pl-2">Sin espacios, guardado en mayúsculas automáticamente.</p>
              </div>

              {/* Discount Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Tipo de Descuento</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('percentage');
                      setDiscountValue(10);
                    }}
                    className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      discountType === 'percentage' 
                        ? 'bg-white shadow-sm text-brand-orange' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Percent size={16} />
                    <span>Porcentaje</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('fixed');
                      setDiscountValue(300);
                    }}
                    className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      discountType === 'fixed' 
                        ? 'bg-white shadow-sm text-brand-orange' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <DollarSign size={16} />
                    <span>Monto Fijo</span>
                  </button>
                </div>
              </div>

              {/* Value */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">
                  {discountType === 'percentage' ? 'Porcentaje de Descuento (%)' : 'Valor del Descuento (MXN)'}
                </label>
                <div className="relative">
                  <input 
                    required
                    type="number"
                    min="1"
                    max={discountType === 'percentage' ? '100' : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black focus:ring-2 focus:ring-brand-orange tracking-widest"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold p-1">
                    {discountType === 'percentage' ? '%' : 'MXN'}
                  </div>
                </div>
              </div>

              {/* Minimum purchase */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Compra Mínima Requerida (Opcional)</label>
                <div className="relative">
                  <input 
                    type="number"
                    min="0"
                    placeholder="Ej. 3000"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-brand-orange"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold p-1">
                    MXN
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold pl-2">Dejar vacío para aplicar sin compra mínima.</p>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2 flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>Fecha de Inicio (Opcional)</span>
                </label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-brand-orange"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2 flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>Fecha de Fin (Opcional)</span>
                </label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-brand-orange"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-2xl">
              <button 
                type="button" 
                onClick={() => setIsActive(!isActive)}
                className="text-brand-orange transition-colors"
              >
                {isActive ? <ToggleRight size={38} className="text-green-500" /> : <ToggleLeft size={38} className="text-gray-300" />}
              </button>
              <div>
                <p className="text-sm font-black tracking-tight">{isActive ? 'Guardar como Activo' : 'Guardar como Inactivo'}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Define si los clientes pueden usarlo inmediatamente</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  resetForm();
                }}
                className="px-6 py-4 bg-gray-100 font-bold rounded-2xl text-gray-600 hover:bg-gray-200 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-brand-orange text-white font-black rounded-2xl hover:bg-brand-orange/90 active:scale-95 transition-all shadow-md shadow-brand-orange/10 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : (editingPromotion ? 'Guardar Cambios' : 'Crear Cupón')}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Promotions list */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <h3 className="text-xl font-black tracking-tight">Cupones de Descuento Existentes</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Lista de promociones configuradas</p>
        </div>

        {promotions.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="bg-gray-50 h-16 w-16 text-gray-300 flex items-center justify-center rounded-3xl mx-auto">
              <Ticket size={28} />
            </div>
            <p className="text-gray-400 font-medium">No se han registrado cupones de descuento aún.</p>
            <button
              onClick={() => {
                setIsAdding(true);
                resetForm();
              }}
              className="text-brand-orange font-black text-sm hover:underline"
            >
              Crea tu primera promoción gratis
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                  <th className="py-5 px-8">Código</th>
                  <th className="py-5 px-6">Detalle Descuento</th>
                  <th className="py-5 px-6">Compra Mínima</th>
                  <th className="py-5 px-6">Vigencia (Fechas)</th>
                  <th className="py-5 px-6 text-center">Estado</th>
                  <th className="py-5 px-8 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {promotions.map((promo) => {
                  const hasDateRestriction = promo.startDate || promo.endDate;
                  
                  // Format validity duration nice text
                  let dateStr = 'Vigencia ilimitada';
                  if (promo.startDate && promo.endDate) {
                    dateStr = `Desde ${formatDate(promo.startDate)} al ${formatDate(promo.endDate)}`;
                  } else if (promo.startDate) {
                    dateStr = `Válido desde ${formatDate(promo.startDate)}`;
                  } else if (promo.endDate) {
                    dateStr = `Válido hasta ${formatDate(promo.endDate)}`;
                  }

                  return (
                    <tr key={promo.id} className="hover:bg-gray-50/20 transition-colors">
                      {/* Code */}
                      <td className="py-5 px-8">
                        <span className="font-mono font-black text-brand-black tracking-wider bg-gray-100 px-3 py-1.5 rounded-xl uppercase text-xs">
                          {promo.code}
                        </span>
                      </td>

                      {/* Detail */}
                      <td className="py-4 px-6">
                        {promo.discountType === 'percentage' ? (
                          <span className="font-black text-brand-black flex items-center gap-1">
                            <Percent size={14} className="text-brand-orange" />
                            <span>{promo.discountValue}% de descuento</span>
                          </span>
                        ) : (
                          <span className="font-black text-brand-black flex items-center gap-1">
                            <DollarSign size={14} className="text-green-600" />
                            <span>{formatPrice(promo.discountValue)} desc.</span>
                          </span>
                        )}
                      </td>

                      {/* Minimum Purchase */}
                      <td className="py-4 px-6 font-medium text-gray-600">
                        {promo.minPurchase ? (
                          <span className="font-bold text-gray-600">
                            Compra min: <span className="font-black text-brand-orange">{formatPrice(promo.minPurchase)}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin mínimo</span>
                        )}
                      </td>

                      {/* Validity (Dates) */}
                      <td className="py-4 px-6 text-xs font-semibold text-gray-500">
                        {hasDateRestriction ? (
                          <div className="flex items-center gap-1.5 text-blue-600">
                            <Calendar size={13} />
                            <span>{dateStr}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">{dateStr}</span>
                        )}
                      </td>

                      {/* State */}
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => handleToggleActive(promo)}
                          className="focus:outline-none inline-flex"
                          title="Click para cambiar estado"
                        >
                          {promo.isActive ? (
                            <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 border border-green-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Activo
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Inactivo
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-8 text-right space-x-1">
                        <button
                          onClick={() => handleEditClick(promo)}
                          className="p-2.5 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-all inline-block"
                          title="Editar cupón"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id, promo.code)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all inline-block"
                          title="Eliminar cupón"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
