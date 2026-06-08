import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../firebase/CartContext';
import { useBranding } from '../firebase/BrandingContext';

export const CartDrawer: React.FC = () => {
  const { items, removeItem, updateQuantity, totalPrice, isOpen, setIsOpen, totalItems } = useCart();
  const { branding } = useBranding();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(price) + ' MXN';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[800px] max-h-[85vh] bg-white rounded-t-[3rem] shadow-2xl z-[101] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-brand-orange/10 p-3 rounded-2xl">
                  <ShoppingBag className="text-brand-orange" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter">Mi Bolsa</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-3 bg-gray-50 text-gray-400 hover:text-brand-black hover:bg-gray-100 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto px-8 py-4 space-y-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="bg-gray-50 p-8 rounded-full">
                    <ShoppingBag size={64} className="text-gray-200" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Tu bolsa está vacía</h3>
                    <p className="text-gray-400 max-w-xs mx-auto">
                      ¡Explora nuestro catálogo y encuentra productos increíbles para ti!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/catalog');
                    }}
                    className="btn-primary"
                  >
                    Ir al catálogo
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const itemKey = `${item.id}-${item.selectedVariant?.id || 'none'}`;
                  return (
                    <motion.div
                      layout
                      key={itemKey}
                      className="flex space-x-6 pb-6 border-b border-gray-50 last:border-0"
                    >
                        <div className="w-24 h-24 bg-gray-100 rounded-3xl overflow-hidden flex-shrink-0">
                          <img
                            src={item.selectedVariant?.imagen || item.images?.[0] || ''}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow flex flex-col justify-between py-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-black text-brand-orange uppercase tracking-wider mb-1">
                                {item.category}
                              </p>
                              <h4 className="font-bold text-lg leading-tight">{item.name}</h4>
                              {item.selectedVariant && (
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                  {item.selectedVariant.textoCombinacion}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.id, item.selectedVariant?.id)}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-gray-50 rounded-xl p-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariant?.id)}
                                className="p-1 px-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500"
                              >
                                <Minus size={14} strokeWidth={3} />
                              </button>
                              <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariant?.id)}
                                className="p-1 px-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500"
                              >
                                <Plus size={14} strokeWidth={3} />
                              </button>
                            </div>
                            <p className="font-black text-brand-orange">
                              {formatPrice((item.price || 0) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && (
              <div className="p-8 bg-gray-50 rounded-t-[3rem]">
                <div className="flex justify-between items-center mb-6 px-2">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total a pagar</p>
                    <p className="text-3xl font-black tracking-tighter text-brand-black">
                      {formatPrice(totalPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Envío calculado</p>
                    <p className="text-xs font-bold text-brand-orange">¡Envío Gratis!</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full py-5 bg-brand-orange text-white rounded-3xl font-black text-lg flex items-center justify-center space-x-3 shadow-xl shadow-brand-orange/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Finalizar Compra</span>
                  <ArrowRight size={22} strokeWidth={3} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
