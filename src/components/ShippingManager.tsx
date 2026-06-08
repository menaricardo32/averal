import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Truck, 
  Calendar, 
  Package, 
  Layers, 
  Check, 
  X,
  AlertTriangle,
  Info,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Lock,
  MessageSquare
} from 'lucide-react';
import { ShippingMethod, ShippingRestrictions } from '../types';
import { 
  addShippingMethod, 
  updateShippingMethod, 
  deleteShippingMethod,
  getShippingRestrictions,
  updateShippingRestrictions
} from '../firebase/services';

const MEXICAN_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Coahuila", "Colima", "Ciudad de México", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

interface ShippingManagerProps {
  methods: ShippingMethod[];
  onRefresh: () => void;
}

export default function ShippingManager({ methods, onRefresh }: ShippingManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'rates' | 'blacklist'>('rates');
  const [isAdding, setIsAdding] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  
  // Form states (Shipping Method)
  const [providerName, setProviderName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [baseCost, setBaseCost] = useState<string>('150');
  const [minPurchaseForFree, setMinPurchaseForFree] = useState<string>('3000');
  const [purchasedGuides, setPurchasedGuides] = useState<string>('50');
  const [usedGuides, setUsedGuides] = useState<string>('0');
  const [isActive, setIsActive] = useState(true);

  // Blacklist/Restrictions states
  const [blockedStates, setBlockedStates] = useState<string[]>([]);
  const [prefixesText, setPrefixesText] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isRestrictionsSubmitting, setIsRestrictionsSubmitting] = useState(false);
  const [restrictionsError, setRestrictionsError] = useState<string | null>(null);
  const [restrictionsSuccess, setRestrictionsSuccess] = useState<string | null>(null);

  // Error and Loading states
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Shipping Blacklist / Restrictions
  useEffect(() => {
    const fetchRestrictions = async () => {
      try {
        const res = await getShippingRestrictions();
        setBlockedStates(res.blockedStates || []);
        setPrefixesText((res.blockedPrefixes || []).join(', '));
        setCustomMessage(res.customMessage || 'Lo sentimos, por el momento no contamos con cobertura de envío para tu código postal.');
      } catch (err) {
        console.error('Error fetching shipping restrictions:', err);
      }
    };
    fetchRestrictions();
  }, [activeSubTab]);

  const resetForm = () => {
    setProviderName('');
    setServiceName('');
    setDeliveryDays('');
    setBaseCost('150');
    setMinPurchaseForFree('3000');
    setPurchasedGuides('50');
    setUsedGuides('0');
    setIsActive(true);
    setError(null);
    setEditingMethod(null);
  };

  const handleEditClick = (method: ShippingMethod) => {
    setEditingMethod(method);
    setProviderName(method.providerName);
    setServiceName(method.serviceName);
    setDeliveryDays(method.deliveryDays);
    setBaseCost(method.baseCost.toString());
    setMinPurchaseForFree(method.minPurchaseForFree != null ? method.minPurchaseForFree.toString() : '');
    setPurchasedGuides(method.purchasedGuides.toString());
    setUsedGuides(method.usedGuides.toString());
    setIsActive(method.isActive);
    setIsAdding(true);
    setError(null);
    
    // Smooth scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validations
    if (!providerName.trim()) {
      setError('Por favor escribe el nombre del proveedor.');
      return;
    }
    if (!serviceName.trim()) {
      setError('Por favor escribe el tipo de servicio.');
      return;
    }
    if (!deliveryDays.trim()) {
      setError('Por favor indica los días estimados de entrega.');
      return;
    }

    const costNum = parseFloat(baseCost);
    if (isNaN(costNum) || costNum < 0) {
      setError('El costo base de envío debe ser un número válido mayor o igual a 0.');
      return;
    }

    const minPurchaseNum = minPurchaseForFree.trim() ? parseFloat(minPurchaseForFree) : null;
    if (minPurchaseNum !== null && (isNaN(minPurchaseNum) || minPurchaseNum < 0)) {
      setError('La compra mínima para envío gratis debe ser un número válido mayor o igual a 0, o dejarse vacío.');
      return;
    }

    const purchasedNum = parseInt(purchasedGuides);
    const usedNum = parseInt(usedGuides);
    if (isNaN(purchasedNum) || purchasedNum < 0) {
      setError('La cantidad de guías compradas debe ser un número entero mayor o igual a 0.');
      return;
    }
    if (isNaN(usedNum) || usedNum < 0) {
      setError('La cantidad de guías usadas debe ser un número entero mayor o igual a 0.');
      return;
    }
    if (usedNum > purchasedNum) {
      setError('La cantidad de guías usadas no puede ser mayor que las compradas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        providerName: providerName.trim(),
        serviceName: serviceName.trim(),
        deliveryDays: deliveryDays.trim(),
        baseCost: costNum,
        minPurchaseForFree: minPurchaseNum,
        purchasedGuides: purchasedNum,
        usedGuides: usedNum,
        isActive
      };

      if (editingMethod) {
        await updateShippingMethod(editingMethod.id, payload);
      } else {
        await addShippingMethod(payload);
      }

      resetForm();
      setIsAdding(false);
      onRefresh();
    } catch (err: any) {
      console.error('Error saving shipping carrier:', err);
      setError('Error al guardar el proveedor de envío. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el servicio de envío "${name}"?`)) {
      try {
        await deleteShippingMethod(id);
        onRefresh();
      } catch (err) {
        console.error('Error deleting shipping method:', err);
        alert('Hubo un error al eliminar el servicio de envío.');
      }
    }
  };

  const handleSaveRestrictions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRestrictionsSubmitting(true);
    setRestrictionsError(null);
    setRestrictionsSuccess(null);

    try {
      // Split and sanitize blocked prefixes
      const prefixes = prefixesText
        .split(/[,\n ]+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      await updateShippingRestrictions({
        blockedStates,
        blockedPrefixes: prefixes,
        customMessage: customMessage.trim() || 'Lo sentimos, por el momento no contamos con cobertura de envío para tu código postal.'
      });

      setRestrictionsSuccess('Configuración de restricciones de zona guardada éxitosamente.');
      setTimeout(() => setRestrictionsSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error saving shipping restrictions:', err);
      setRestrictionsError('Ocurrió un error al guardar la configuración de restricciones de envío.');
    } finally {
      setIsRestrictionsSubmitting(false);
    }
  };

  const toggleStateBlock = (stateName: string) => {
    // If it is in blockedStates, we remove it (enabling it). Otherwise, we add it (blocking it).
    // Note: User says "Si desmarcas uno, el sistema automáticamente rechaza cualquier CP que pertenezca a ese estado."
    // So "checked" means ALLOWED. "unchecked" means BLOCKED.
    setBlockedStates(prev => {
      if (prev.includes(stateName)) {
        return prev.filter(s => s !== stateName);
      } else {
        return [...prev, stateName];
      }
    });
  };

  const markAllStatesAllowed = () => {
    setBlockedStates([]); // No states are blocked -> All allowed
  };

  const blockAllStates = () => {
    setBlockedStates([...MEXICAN_STATES]); // All states are blocked
  };

  // Stats calculation
  const totalCarriers = methods.length;
  const activeCarriers = methods.filter(m => m.isActive).length;
  const totalPurchasedGuides = methods.reduce((acc, curr) => acc + curr.purchasedGuides, 0);
  const totalUsedGuides = methods.reduce((acc, curr) => acc + curr.usedGuides, 0);
  const totalAvailableGuides = totalPurchasedGuides - totalUsedGuides;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  return (
    <div className="space-y-10">
      {/* Top statistics banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all">
          <div className="p-4 bg-brand-orange/10 rounded-2xl text-brand-orange">
            <Truck size={24} />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Proveedores Registrados</span>
            <span className="text-2xl font-black text-brand-black">{totalCarriers} ({activeCarriers} activos)</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all">
          <div className="p-4 bg-green-50 rounded-2xl text-green-600">
            <Package size={24} />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Saldo de Guías en Stock</span>
            <span className="text-2xl font-black text-brand-black">{totalAvailableGuides} <span className="text-xs font-normal text-gray-500">disp.</span></span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
            <Layers size={24} />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Total Guías Compradas</span>
            <span className="text-2xl font-black text-brand-black">{totalPurchasedGuides} <span className="text-xs font-normal text-gray-500">({totalUsedGuides} usadas)</span></span>
          </div>
        </div>
      </div>

      {/* Tabs Menu Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => { setActiveSubTab('rates'); setIsAdding(false); resetForm(); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-250 ${
              activeSubTab === 'rates'
                ? 'bg-white text-brand-black shadow-sm'
                : 'text-gray-400 hover:text-brand-black'
            }`}
          >
            Configuración de Tarifas
          </button>
          
          <button
            onClick={() => { setActiveSubTab('blacklist'); setIsAdding(false); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-250 flex items-center space-x-2 ${
              activeSubTab === 'blacklist'
                ? 'bg-white text-brand-black shadow-sm'
                : 'text-gray-400 hover:text-brand-black'
            }`}
          >
            <ShieldAlert size={14} className={activeSubTab === 'blacklist' ? 'text-brand-orange' : 'text-gray-400'} />
            <span>Zonas Restringidas</span>
          </button>
        </div>

        {/* Action button for Rates Sub-Tab */}
        {activeSubTab === 'rates' && !isAdding && (
          <button
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="flex items-center space-x-2 px-6 py-3 bg-brand-orange text-white font-black text-sm rounded-2xl hover:bg-brand-orange/90 active:scale-95 transition-all shadow-md shadow-brand-orange/10"
          >
            <Plus size={18} />
            <span>Agregar Proveedor</span>
          </button>
        )}
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === 'rates' ? (
        <>
          {isAdding && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-md space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                <div className="flex items-center space-x-3">
                  <div className="bg-brand-orange/10 p-2.5 rounded-xl text-brand-orange">
                    <Truck size={20} />
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-brand-black">
                    {editingMethod ? 'Editar Proveedor de Envío' : 'Registrar Nuevo Proveedor de Envío'}
                  </h3>
                </div>
                <button 
                  onClick={() => { setIsAdding(false); resetForm(); }}
                  className="p-2 text-gray-400 hover:text-brand-black hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-bold flex items-center space-x-2">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Provider Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Proveedor / Transportista *</label>
                    <input
                      type="text"
                      placeholder="Ej. DHL, FedEx, Estafeta"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange font-bold text-sm transition-all text-brand-black"
                    />
                  </div>

                  {/* Service Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Tipo de Servicio *</label>
                    <input
                      type="text"
                      placeholder="Ej. Express 24h, Económico, Terrestre"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange font-bold text-sm transition-all text-brand-black"
                    />
                  </div>

                  {/* Delivery Days */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Tiempo de Entrega Estimado *</label>
                    <input
                      type="text"
                      placeholder="Ej. 1-2 días hábiles, 3 días"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange font-bold text-sm transition-all text-brand-black"
                    />
                  </div>

                  {/* Base Cost */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Costo de Envío al Cliente ($ MXN) *</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="150"
                        value={baseCost}
                        onChange={(e) => setBaseCost(e.target.value)}
                        className="w-full pl-9 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange font-bold text-sm transition-all text-brand-black"
                      />
                    </div>
                  </div>

                  {/* Min Purchase For Free */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block flex items-center space-x-1">
                      <span>Compra Mínima p/ Envío Gratis</span>
                      <div className="group relative text-gray-400 cursor-help">
                        <Info size={14} />
                        <span className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-brand-black text-white text-[10px] p-2 rounded-lg w-52 text-normal leading-normal z-50 shadow-xl">
                          Si el subtotal es mayor o igual a este monto, el envío será gratis. Deja vacío si siempre se cobra.
                        </span>
                      </div>
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="3000 (Opcional)"
                        value={minPurchaseForFree}
                        onChange={(e) => setMinPurchaseForFree(e.target.value)}
                        className="w-full pl-9 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange font-bold text-sm transition-all text-brand-black"
                      />
                    </div>
                  </div>

                  {/* Purchased Guides */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Inventario: Guías Adquiridas *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="50"
                      value={purchasedGuides}
                      onChange={(e) => setPurchasedGuides(e.target.value)}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange font-bold text-sm transition-all text-brand-black"
                    />
                  </div>

                  {/* Used Guides */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Inventario: Guías Consumidas *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={usedGuides}
                      onChange={(e) => setUsedGuides(e.target.value)}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange font-bold text-sm transition-all text-brand-black"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="space-y-2 flex flex-col justify-end h-full pb-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-5 h-5 accent-brand-orange rounded cursor-pointer border-gray-100 focus:ring-brand-orange"
                      />
                      <span className="text-sm font-bold text-brand-black">¿Servicio Activo para el Cliente?</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 border-t border-gray-100 pt-6">
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); resetForm(); }}
                    className="px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 hover:text-brand-black transition-all"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-brand-orange text-white font-black rounded-2xl hover:bg-brand-orange/90 active:scale-95 transition-all shadow-md shadow-brand-orange/10 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : (editingMethod ? 'Guardar Cambios' : 'Registrar Proveedor')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Shipping List Table */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-xl font-black text-brand-black tracking-tight">Proveedores de Envíos y Reglas</h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Configuración y Niveles de Inventario de Guías</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="py-4 px-8">Proveedor / Servicio</th>
                    <th className="py-4 px-6">Tiempo Estimado</th>
                    <th className="py-4 px-6 text-center">Costo de Envío</th>
                    <th className="py-4 px-6 text-center">Compra Mínima Free</th>
                    <th className="py-4 px-6 text-center">Stock de Guías (Disponible)</th>
                    <th className="py-4 px-6 text-center">Estado</th>
                    <th className="py-4 px-8 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {methods.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 px-8 text-center text-gray-400 font-bold">
                        No hay proveedores de envío configurados. Por favor agrega uno para comenzar.
                      </td>
                    </tr>
                  ) : (
                    methods.map((method) => {
                      const availableGuides = method.purchasedGuides - method.usedGuides;
                      const isOutOfGuides = availableGuides <= 0;
                      const isLowGuides = availableGuides > 0 && availableGuides <= 5;

                      return (
                        <tr key={method.id} className="hover:bg-gray-50/50 transition-all font-bold text-xs">
                          <td className="py-5 px-8">
                            <div className="flex flex-col">
                              <span className="text-brand-black text-sm font-black">{method.providerName}</span>
                              <span className="text-gray-400 text-[10px] tracking-wider uppercase">{method.serviceName}</span>
                            </div>
                          </td>

                          <td className="py-5 px-6">
                            <div className="flex items-center space-x-2 text-gray-500">
                              <Calendar size={14} className="text-brand-orange" />
                              <span>{method.deliveryDays}</span>
                            </div>
                          </td>

                          <td className="py-5 px-6 text-center">
                            <span className="text-brand-black font-extrabold text-sm">{formatMoney(method.baseCost)}</span>
                          </td>

                          <td className="py-5 px-6 text-center">
                            {method.minPurchaseForFree != null ? (
                              <span className="text-green-600">✓ Gratis des. de {formatMoney(method.minPurchaseForFree)}</span>
                            ) : (
                              <span className="text-gray-400 font-normal">Siempre se cobra</span>
                            )}
                          </td>

                          <td className="py-5 px-6">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center space-x-1.5 justify-center">
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                  isOutOfGuides ? 'bg-red-50 text-red-500' :
                                  isLowGuides ? 'bg-amber-50 text-amber-500' :
                                  'bg-green-50 text-green-600'
                                }`}>
                                  {availableGuides} / {method.purchasedGuides} disp.
                                </span>
                              </div>
                              <div className="w-24 bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    isOutOfGuides ? 'bg-red-500' :
                                    isLowGuides ? 'bg-amber-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (availableGuides / Math.max(1, method.purchasedGuides)) * 100)}%` }}
                                />
                              </div>
                              {isOutOfGuides && (
                                <span className="text-[9px] text-red-500 font-bold mt-1 uppercase text-center">Sin stock: No se mostrará</span>
                              )}
                            </div>
                          </td>

                          <td className="py-5 px-6 text-center">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${
                              method.isActive 
                                ? 'bg-green-50 text-green-600 border border-green-100' 
                                : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}>
                              • {method.isActive ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                          </td>

                          <td className="py-5 px-8 text-right space-x-1">
                            <button
                              onClick={() => handleEditClick(method)}
                              className="p-2.5 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-all inline-block"
                              title="Editar proveedor"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(method.id, method.providerName)}
                              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all inline-block"
                              title="Eliminar proveedor"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* RESTRICTIONS MANAGEMENT VIEW */
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-md space-y-10 animate-fadeIn">
          <div className="border-b border-gray-100 pb-5">
            <h3 className="text-xl font-black text-brand-black tracking-tight">Reglas de Zonas Restringidas</h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">
              Filtros geográficos para denegar cobertura a clientes en códigos postales inviables
            </p>
          </div>

          <form onSubmit={handleSaveRestrictions} className="space-y-8">
            {restrictionsSuccess && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span>{restrictionsSuccess}</span>
              </div>
            )}

            {restrictionsError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle size={16} className="text-red-500" />
                <span>{restrictionsError}</span>
              </div>
            )}

            {/* LEVEL 1: RESTRICTION BY STATE (CHECKBOXES) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-sm font-black text-brand-black tracking-tight flex items-center space-x-2">
                    <span className="bg-brand-orange text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                    <span>Nivel 1: Cobertura por Estados (México)</span>
                  </h4>
                  <p className="text-xs text-gray-400 font-bold leading-normal mt-0.5">
                    Marca los estados en los que SÍ ofreces servicio. Desmarcar un estado rechazará cualquier entrega ahí.
                  </p>
                </div>
                
                {/* Toggle Helper buttons */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={markAllStatesAllowed}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-[10px] font-black uppercase tracking-wider text-brand-black rounded-lg hover:bg-gray-100 transition-all"
                  >
                    Marcar Todos (Permitidos)
                  </button>
                  <button
                    type="button"
                    onClick={blockAllStates}
                    className="px-3 py-1.5 bg-red-50 border border-red-200 text-[10px] font-black uppercase tracking-wider text-red-600 rounded-lg hover:bg-red-100 transition-all"
                  >
                    Desmarcar Todos (Restringidos)
                  </button>
                </div>
              </div>

              {/* Grid of Checkboxes */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                {MEXICAN_STATES.map((state) => {
                  // A state is ALLOWED if it is NOT in blockedStates
                  const isAllowed = !blockedStates.includes(state);
                  return (
                    <label key={state} className="flex items-center space-x-3 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={isAllowed}
                        onChange={() => toggleStateBlock(state)}
                        className="w-5 h-5 accent-brand-orange rounded cursor-pointer border-gray-150 focus:ring-brand-orange"
                      />
                      <span className={`text-xs font-bold transition-all ${
                        isAllowed 
                          ? 'text-brand-black group-hover:text-brand-orange' 
                          : 'text-gray-400 line-through'
                      }`}>
                        {state}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* LEVEL 2: RESTRICTION BY ZIP CODE PREFIX / EXACT ZIP */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-brand-black tracking-tight flex items-center space-x-2">
                <span className="bg-brand-orange text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                <span className="flex items-center space-x-1">
                  <span>Nivel 2: Prefijos o Códigos Postales Bloqueados (Lista Negra)</span>
                  <div className="group relative text-gray-400 cursor-help">
                    <Info size={14} />
                    <span className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-brand-black text-white text-[10px] p-2 rounded-lg w-64 text-normal leading-normal z-50 shadow-xl">
                      Escribe un prefijo de 3 dígitos (ej: 880) para bloquear todos los códigos postales de esa zona, o un código postal exacto de 5 dígitos (ej: 88029).
                    </span>
                  </div>
                </span>
              </h4>
              <p className="text-xs text-gray-400 font-bold leading-normal">
                Indica los prefijos o códigos postales que quieres bloquear. Sepáralos por comas, espacios o saltos de línea.
              </p>

              <textarea
                value={prefixesText}
                onChange={(e) => setPrefixesText(e.target.value)}
                placeholder="Ej. 880, 881, 999, 53200, 31120"
                rows={4}
                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange font-mono font-bold text-xs leading-relaxed text-brand-black"
              />
              <span className="text-[10px] text-gray-400 font-bold block bg-gray-100 p-3 rounded-xl flex items-center space-x-1.5 leading-none">
                <Lock size={12} className="text-brand-orange flex-shrink-0" />
                <span>Cualquier cliente cuyo CP empiece por o coincida con estos valores no podrá finalizar su compra.</span>
              </span>
            </div>

            {/* LEVEL 3: CUSTOMIZED REJECTION MESSAGE FOR CLIENT */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-brand-black tracking-tight flex items-center space-x-2">
                <span className="bg-brand-orange text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                <span>Nivel 3: Mensaje de Rechazo Personalizado</span>
              </h4>
              <p className="text-xs text-gray-400 font-bold leading-normal">
                Escribe el texto que se le mostrará al cliente si ingresa un código postal o estado que no tenga cobertura.
              </p>

              <div className="relative">
                <MessageSquare className="absolute left-5 top-5 text-gray-400" size={18} />
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Lo sentimos, por el momento no contamos con cobertura de envío para tu código postal."
                  rows={3}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange font-bold text-xs leading-relaxed text-brand-black"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end space-x-4 border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => setActiveSubTab('rates')}
                className="px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 hover:text-brand-black transition-all"
                disabled={isRestrictionsSubmitting}
              >
                Volver a Tarifas
              </button>
              <button
                type="submit"
                disabled={isRestrictionsSubmitting}
                className="px-6 py-3 bg-brand-orange text-white font-black rounded-2xl hover:bg-brand-orange/90 active:scale-95 transition-all shadow-md shadow-brand-orange/10 disabled:opacity-50"
              >
                {isRestrictionsSubmitting ? 'Guardando...' : 'Guardar Restricciones'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
