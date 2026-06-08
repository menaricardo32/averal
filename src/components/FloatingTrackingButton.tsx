import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, Search, Calendar, Truck, CreditCard, DollarSign, Package, MapPin, CheckCircle2, AlertCircle, Clock, Loader2, Clipboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Order } from '../types';

export const FloatingTrackingButton: React.FC = () => {
  const [showButton, setShowButton] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Monitor scroll behavior: Only show button when user has scrolled down a bit
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTrackOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryTerm = searchQuery.trim();
    if (!queryTerm) return;

    setIsLoading(true);
    setErrorMsg('');
    setOrderData(null);

    const cleanInput = queryTerm.toLowerCase();

    try {
      // 1. Try direct exact match first
      const docRef = doc(db, 'orders', queryTerm);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setOrderData({ id: docSnap.id, ...docSnap.data() } as Order);
        setIsLoading(false);
        return;
      }

      // 2. Try list-search fallback to match last 6 characters or sub-string
      const snapshot = await getDocs(collection(db, 'orders'));
      let foundOrder: Order | null = null;
      
      for (const d of snapshot.docs) {
        const orderId = d.id.toLowerCase();
        if (
          orderId === cleanInput || 
          orderId.endsWith(cleanInput) || 
          orderId.slice(-6) === cleanInput
        ) {
          foundOrder = { id: d.id, ...d.data() } as Order;
          break;
        }
      }

      if (foundOrder) {
        setOrderData(foundOrder);
      } else {
        setErrorMsg('No encontramos ningún pedido con ese número. Por favor, verifica el código e inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setErrorMsg('Ocurrió un error al consultar tu pedido. Intúntalo de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFriendlyStatus = (status: Order['status']) => {
    switch (status) {
      case 'pending': return { label: 'Preparando', desc: 'Estamos preparando tus productos.', step: 1, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'shipped': return { label: 'En camino', desc: 'Tu pedido está en camino a tu dirección.', step: 2, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'delivered': return { label: 'Entregado', desc: 'El pedido ha sido entregado exitosamente.', step: 3, color: 'text-green-600 bg-green-50 border-green-200' };
      case 'cancelled': return { label: 'Cancelado', desc: 'Este pedido ha sido cancelado.', step: 0, color: 'text-red-600 bg-red-50 border-red-200' };
      default: return { label: 'Desconocido', desc: 'Estado de pedido no disponible.', step: 0, color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(price) + ' MXN';
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openModal = () => {
    setIsOpen(true);
    setSearchQuery('');
    setOrderData(null);
    setErrorMsg('');
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            onClick={openModal}
            className="fixed bottom-6 left-6 z-[100] bg-brand-black text-white px-5 py-4 rounded-full shadow-2xl hover:bg-brand-orange hover:shadow-brand-orange/25 transition-all duration-300 flex items-center space-x-3 group active:scale-95"
            aria-label="Rastrear mi pedido"
          >
            <ShoppingCart size={22} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-bold text-xs uppercase tracking-widest whitespace-nowrap">
              Rastrear mi pedido
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Popup Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar border border-gray-100 flex flex-col"
            >
              {/* Header Container */}
              <div className="p-8 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-brand-orange/10 p-2.5 rounded-xl">
                    <Truck className="text-brand-orange" size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tighter uppercase text-brand-black">Siga su Pedido</h3>
                    <p className="text-xs font-semibold text-gray-400">Rastreo en tiempo real de tu compra</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-brand-black"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Dynamic Body Content */}
              <div className="p-8 space-y-6 flex-grow overflow-y-auto custom-scrollbar">
                
                {/* Search Form */}
                <form onSubmit={handleTrackOrder} className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 block">
                    Ingresa tu número de pedido
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Ej: AB12CD o el ID completo de tu orden"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-orange/30 focus:ring-2 focus:ring-brand-orange/10 transition-all"
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !searchQuery.trim()}
                      className="px-8 py-4 bg-brand-black text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-brand-orange transition-all disabled:opacity-50 disabled:hover:bg-brand-black flex items-center justify-center space-x-2 shrink-0 active:scale-95 shadow-lg shadow-brand-black/5"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Buscando...</span>
                        </>
                      ) : (
                        <span>Buscar</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Error Banner */}
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start space-x-3 text-sm font-medium"
                  >
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {/* Tracking Data Result */}
                {orderData && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Status Summary Banner */}
                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-sans text-[10px] font-bold text-gray-400 uppercase tracking-widest">Código Único</span>
                          <button 
                            type="button"
                            onClick={() => handleCopyOrderId(orderData.id)}
                            className="text-gray-400 hover:text-brand-orange transition-colors"
                            title="Copiar número de pedido"
                          >
                            <Clipboard size={12} />
                          </button>
                          {copied && <span className="text-[10px] font-bold text-green-500 font-mono">¡Copiado!</span>}
                        </div>
                        <h4 className="font-mono font-black text-lg text-brand-black">
                          #{orderData.id.slice(-6).toUpperCase()}
                        </h4>
                        <p className="text-xs text-gray-400 font-semibold flex items-center space-x-1.5 pt-0.5">
                          <Calendar size={13} />
                          <span>
                            F. de compra: {orderData.createdAt?.toDate ? orderData.createdAt.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Reciente'}
                          </span>
                        </p>
                      </div>

                      <div className="text-right sm:text-right flex flex-col sm:items-end">
                        <span className="font-sans text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Total Pagado</span>
                        <p className="font-black text-brand-orange text-xl">{formatPrice(orderData.totalPrice)}</p>
                        <span className="text-[10px] text-gray-400 font-bold block mt-0.5 uppercase tracking-wider">Pago Seguro</span>
                      </div>
                    </div>

                    {/* Order Status Timeline or Cancelled Status Banner */}
                    {orderData.status !== 'cancelled' ? (
                      <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6">
                        <h5 className="font-black text-xs uppercase tracking-widest text-brand-black">Seguimiento de Entrega</h5>

                        {/* Visual Timeline Bar */}
                        <div className="relative pt-2 pb-4">
                          {/* Progress Line */}
                          <div className="absolute left-6 right-6 top-[22px] h-1 bg-gray-100 -translate-y-1/2 z-0 hidden sm:block" />
                          
                          {/* Active Progress Line */}
                          <div 
                            className="absolute left-6 top-[22px] h-1 bg-brand-orange -translate-y-1/2 z-0 transition-all duration-700 hidden sm:block"
                            style={{ 
                              width: getFriendlyStatus(orderData.status).step === 1 ? '0%' : 
                                     getFriendlyStatus(orderData.status).step === 2 ? '50%' : '100%' 
                            }}
                          />

                          {/* Stepper Nodes */}
                          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-2">
                            {/* Step 1: Preparando */}
                            <div className="flex sm:flex-col items-center sm:text-center space-x-4 sm:space-x-0 group">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                getFriendlyStatus(orderData.status).step >= 1 
                                  ? 'bg-brand-orange/10 border-brand-orange text-brand-orange' 
                                  : 'bg-white border-gray-200 text-gray-400'
                              }`}>
                                <Clock size={18} />
                              </div>
                              <div className="sm:mt-2 text-left sm:text-center">
                                <p className={`font-black text-xs uppercase tracking-widest ${
                                  getFriendlyStatus(orderData.status).step >= 1 ? 'text-brand-black' : 'text-gray-400'
                                }`}>Preparando</p>
                                <p className="text-[10px] font-semibold text-gray-400 mt-0.5 hidden sm:block max-w-[120px]">Tu orden se está empacando</p>
                              </div>
                            </div>

                            {/* Step 2: En camino */}
                            <div className="flex sm:flex-col items-center sm:text-center space-x-4 sm:space-x-0 group">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                getFriendlyStatus(orderData.status).step >= 2 
                                  ? 'bg-brand-orange/10 border-brand-orange text-brand-orange' 
                                  : 'bg-white border-gray-200 text-gray-400'
                              }`}>
                                <Truck size={18} />
                              </div>
                              <div className="sm:mt-2 text-left sm:text-center">
                                <p className={`font-black text-xs uppercase tracking-widest ${
                                  getFriendlyStatus(orderData.status).step >= 2 ? 'text-brand-black' : 'text-gray-400'
                                }`}>En camino</p>
                                <p className="text-[10px] font-semibold text-gray-400 mt-0.5 hidden sm:block max-w-[120px]">Paquete en ruta de entrega</p>
                              </div>
                            </div>

                            {/* Step 3: Entregado */}
                            <div className="flex sm:flex-col items-center sm:text-center space-x-4 sm:space-x-0 group">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                getFriendlyStatus(orderData.status).step >= 3 
                                  ? 'bg-brand-orange/10 border-brand-orange text-brand-orange' 
                                  : 'bg-white border-gray-200 text-gray-400'
                              }`}>
                                <Package size={18} />
                              </div>
                              <div className="sm:mt-2 text-left sm:text-center">
                                <p className={`font-black text-xs uppercase tracking-widest ${
                                  getFriendlyStatus(orderData.status).step >= 3 ? 'text-brand-black' : 'text-gray-400'
                                }`}>Entregado</p>
                                <p className="text-[10px] font-semibold text-gray-400 mt-0.5 hidden sm:block max-w-[120px]">¡Llegó a su destino!</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status detail alert statement */}
                        <div className="p-4 bg-brand-orange/5 border border-brand-orange/10 rounded-2xl flex items-center space-x-3 text-brand-black text-xs font-bold leading-relaxed">
                          <CheckCircle2 size={16} className="text-brand-orange shrink-0" />
                          <span>Estado actual: <b className="uppercase">{getFriendlyStatus(orderData.status).label}</b>. {getFriendlyStatus(orderData.status).desc}</span>
                        </div>
                      </div>
                    ) : (
                      // Cancelled Message
                      <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex flex-col items-center text-center space-y-3">
                        <AlertCircle className="text-red-500" size={40} />
                        <h4 className="font-mono font-black text-red-700 text-base uppercase tracking-tight">PEDIDO CANCELADO</h4>
                        <p className="text-sm font-semibold text-red-600 max-w-md">
                          Este pedido ha sido cancelado e informado. Si tienes dudas respecto a esta decisión, reembolsos o aclaraciones, por favor contacta de inmediato con nuestro soporte técnico o de ventas.
                        </p>
                      </div>
                    )}

                    {/* Shipping and Delivery Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Delivery Address */}
                      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center space-x-2.5 text-brand-orange">
                          <MapPin size={18} />
                          <h5 className="font-black text-xs uppercase tracking-widest text-brand-black mt-0.5">Dirección de Entrega</h5>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900 leading-relaxed pt-1">
                            {orderData.address}
                          </p>
                          <p className="text-xs font-semibold text-gray-500">
                            {orderData.city}, CP {orderData.zip}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-1 block">
                            Destinatario: {orderData.customerName}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Method and Tracking Number */}
                      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center space-x-2.5 text-brand-orange">
                          <Truck size={18} />
                          <h5 className="font-black text-xs uppercase tracking-widest text-brand-black mt-0.5">Detalles del Envío</h5>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Método Seleccionado</p>
                            <p className="text-xs font-bold text-gray-900">
                              {orderData.shippingProvider && orderData.shippingService 
                                ? `${orderData.shippingProvider} - ${orderData.shippingService}`
                                : 'Envío Express 3 días'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Número de Guía (Tracking Code)</p>
                            <div className="flex items-center space-x-2 mt-0.5">
                              {orderData.trackingNumber ? (
                                <>
                                  <span className="text-xs font-mono font-black text-brand-orange bg-brand-orange/5 border border-brand-orange/10 px-2 py-1 rounded">
                                    {orderData.trackingNumber}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyOrderId(orderData.trackingNumber || '')}
                                    className="p-1 hover:bg-gray-200 text-gray-400 hover:text-brand-orange rounded transition-all"
                                    title="Copiar guía"
                                  >
                                    <Clipboard size={12} />
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs font-semibold text-gray-400 italic">
                                  Pendiente de asignación por el administrador
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Items List inside Result */}
                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-4">
                      <h5 className="font-black text-xs uppercase tracking-widest text-brand-black">Resumen de Artículos</h5>
                      <div className="space-y-3 divide-y divide-gray-200">
                        {orderData.items?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between pt-3 first:pt-0 gap-4">
                            <div className="flex items-center space-x-3">
                              {item.images?.[0] ? (
                                <img
                                  src={item.images[0]}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-xl border border-gray-200 bg-white"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center">
                                  <Package className="text-gray-300" size={18} />
                                </div>
                              )}
                              <div>
                                <h6 className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</h6>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  Cantidad: {item.quantity} {item.selectedVariant ? ` - ${item.selectedVariant.textoCombinacion}` : ''}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-gray-900 whitespace-nowrap">
                              {formatPrice((item.price || 0) * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="p-8 border-t border-gray-100 bg-gray-50 rounded-b-[2.5rem] flex items-center justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-3.5 bg-gray-200 hover:bg-gray-300 font-black text-xs uppercase tracking-widest text-gray-700 rounded-2xl transition-all active:scale-95"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
