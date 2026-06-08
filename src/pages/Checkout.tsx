import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Truck, 
  User, 
  MessageCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Info,
  Calendar,
  Lock,
  CheckCircle2,
  Ticket,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../firebase/CartContext';
import { useBranding } from '../firebase/BrandingContext';
import { addOrder, getPromotions, getShippingMethods, updateShippingMethod, getShippingRestrictions, getPayPalSettings } from '../firebase/services';
import { Promotion, ShippingMethod, ShippingRestrictions, PayPalSettings } from '../types';
import { PayPalPaymentModal } from '../components/PayPalPaymentModal';
import { PayPalButton } from '../components/PayPalButton';

const MEXICAN_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Coahuila", "Colima", "Ciudad de México", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

export default function Checkout() {
  const { items, totalPrice, totalItems, clearCart, setIsOpen } = useCart();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('checkout_user_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || '',
          email: parsed.email || '',
          whatsapp: parsed.whatsapp || '',
          address: parsed.address || '',
          city: parsed.city || '',
          state: parsed.state || '',
          zip: parsed.zip || '',
          cardNumber: '',
          expDate: '',
          cvv: ''
        };
      }
    } catch (e) {
      console.error("Error reading checkout_user_data from localStorage:", e);
    }
    return {
      name: '',
      email: '',
      whatsapp: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      cardNumber: '',
      expDate: '',
      cvv: ''
    };
  });

  React.useEffect(() => {
    const { name, email, whatsapp, address, city, state, zip } = formData;
    localStorage.setItem('checkout_user_data', JSON.stringify({
      name, email, whatsapp, address, city, state, zip
    }));
  }, [formData.name, formData.email, formData.whatsapp, formData.address, formData.city, formData.state, formData.zip]);

  React.useEffect(() => {
    if (isSuccess) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSuccess]);


  const [promotionsList, setPromotionsList] = useState<Promotion[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const [shippingMethodsList, setShippingMethodsList] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [restrictions, setRestrictions] = useState<ShippingRestrictions | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card'>('paypal');
  const [paypalConfig, setPaypalConfig] = useState<PayPalSettings | null>(null);
  const [isPaypalModalOpen, setIsPaypalModalOpen] = useState(false);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paymentMethod]);

  React.useEffect(() => {
    const fetchPromosAndShipping = async () => {
      try {
        const [promos, shp, rest, paypal] = await Promise.all([
          getPromotions(),
          getShippingMethods(),
          getShippingRestrictions(),
          getPayPalSettings()
        ]);
        setPromotionsList(promos);
        setRestrictions(rest);
        setPaypalConfig(paypal);
        
        // Filter active methods with available prepaid guides
        const activeAndInStock = shp.filter(
          m => m.isActive && (m.purchasedGuides - m.usedGuides > 0)
        );
        setShippingMethodsList(activeAndInStock);
        if (activeAndInStock.length > 0) {
          setSelectedShipping(activeAndInStock[0]);
        }
      } catch (e) {
        console.error("Error fetching data for checkout:", e);
      }
    };
    fetchPromosAndShipping();
  }, []);

  const getDiscountAmount = () => {
    if (!appliedPromotion) return 0;
    if (appliedPromotion.discountType === 'percentage') {
      return Math.round((totalPrice * appliedPromotion.discountValue) / 100);
    } else {
      return appliedPromotion.discountValue;
    }
  };

  const discountAmount = getDiscountAmount();
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const getShippingCost = () => {
    if (!selectedShipping) return 0;
    if (totalPrice >= 3000) return 0; // general free shipping rule
    if (selectedShipping.minPurchaseForFree != null && totalPrice >= selectedShipping.minPurchaseForFree) return 0;
    return selectedShipping.baseCost;
  };

  const shippingCost = getShippingCost();
  const grandTotal = finalPrice + shippingCost;

  const checkIsBlocked = () => {
    if (!restrictions) return { blocked: false, message: '' };

    const cp = formData.zip.trim();
    const selectedState = formData.state.trim();

    // 1. Check if Selected State is blocked
    if (selectedState && (restrictions.blockedStates || []).includes(selectedState)) {
      return { 
        blocked: true, 
        message: restrictions.customMessage || "Lo sentimos, por el momento no contamos con cobertura de envío para tu estado."
      };
    }

    // 2. Check if CP matches blocked prefixes
    if (cp.length > 0) {
      const isBlockedPrefix = (restrictions.blockedPrefixes || []).some(prefix => 
        cp.startsWith(prefix) || cp === prefix
      );
      if (isBlockedPrefix) {
        return {
          blocked: true,
          message: restrictions.customMessage || "Lo sentimos, por el momento no contamos con cobertura de envío para tu código postal."
        };
      }
    }

    return { blocked: false, message: '' };
  };

  const restrictionCheck = checkIsBlocked();
  const isZipBlocked = restrictionCheck.blocked;
  const blockedMessage = restrictionCheck.message;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    setAppliedPromotion(null);

    const cleanInput = couponCode.trim().toUpperCase();
    if (!cleanInput) {
      setCouponError('Por favor ingresa un código.');
      return;
    }

    const foundPromo = promotionsList.find(p => p.code.toUpperCase() === cleanInput);
    if (!foundPromo) {
      setCouponError('El código ingresado no existe o no es válido.');
      return;
    }

    if (!foundPromo.isActive) {
      setCouponError('Este cupón ya no está activo.');
      return;
    }

    // Date validations
    const todayStr = new Date().toISOString().split('T')[0];
    if (foundPromo.startDate && todayStr < foundPromo.startDate) {
      setCouponError(`Este cupón aún no está vigente. Inicia el ${formatDate(foundPromo.startDate)}.`);
      return;
    }
    if (foundPromo.endDate && todayStr > foundPromo.endDate) {
      setCouponError('Este cupón ha expirado.');
      return;
    }

    // Minimum purchase validation
    if (foundPromo.minPurchase && totalPrice < foundPromo.minPurchase) {
      setCouponError(`Este cupón requiere una compra mínima de $${foundPromo.minPurchase} MXN.`);
      return;
    }

    // Success!
    setAppliedPromotion(foundPromo);
    if (foundPromo.discountType === 'percentage') {
      setCouponSuccess(`¡Cupón aplicado! Recibiste un ${foundPromo.discountValue}% de descuento.`);
    } else {
      setCouponSuccess(`¡Cupón aplicado! Recibiste un descuento de $${foundPromo.discountValue} MXN.`);
    }
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl max-w-md w-full space-y-6">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <CreditCard size={48} className="text-gray-200" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter">Tu bolsa está vacía</h2>
          <p className="text-gray-500">Agrega algunos productos antes de proceder al pago.</p>
          <button 
            onClick={() => navigate('/catalog')}
            className="btn-primary w-full"
          >
            Ver Catálogo
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      const masked = digits.match(/.{1,4}/g)?.join(' ') || digits;
      setFormData(prev => ({ ...prev, [name]: masked }));
      return;
    }

    if (name === 'expDate') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) {
        setFormData(prev => ({ ...prev, [name]: `${digits.slice(0, 2)}/${digits.slice(2)}` }));
      } else {
        setFormData(prev => ({ ...prev, [name]: digits }));
      }
      return;
    }

    if (name === 'cvv') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: digits }));
      return;
    }

    if (name === 'zip' || name === 'whatsapp') {
      const digits = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: digits }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // DOM fallback to support autofill without registered change events
    const getName = () => {
      const el = document.querySelector('input[name="name"]') as HTMLInputElement;
      return (formData.name || '').trim() || (el ? el.value.trim() : '');
    };
    const getEmail = () => {
      const el = document.querySelector('input[name="email"]') as HTMLInputElement;
      return (formData.email || '').trim() || (el ? el.value.trim() : '');
    };
    const getWhatsapp = () => {
      const el = document.querySelector('input[name="whatsapp"]') as HTMLInputElement;
      let val = (formData.whatsapp || '').trim();
      if (!val && el) {
        val = el.value.trim();
        if (val && !val.startsWith('52')) {
          val = '52' + val;
        }
      }
      return val;
    };
    const getAddress = () => {
      const el = document.querySelector('input[name="address"]') as HTMLInputElement;
      return (formData.address || '').trim() || (el ? el.value.trim() : '');
    };
    const getCity = () => {
      const el = document.querySelector('input[name="city"]') as HTMLInputElement;
      return (formData.city || '').trim() || (el ? el.value.trim() : '');
    };
    const getState = () => {
      const el = document.querySelector('select[name="state"], input[name="state"]') as HTMLInputElement | HTMLSelectElement;
      return (formData.state || '').trim() || (el ? el.value.trim() : '');
    };
    const getZip = () => {
      const el = document.querySelector('input[name="zip"]') as HTMLInputElement;
      return (formData.zip || '').trim() || (el ? el.value.trim() : '');
    };

    const nameVal = getName();
    const emailVal = getEmail();
    const whatsappVal = getWhatsapp();
    const addressVal = getAddress();
    const cityVal = getCity();
    const stateVal = getState();
    const zipVal = getZip();

    // Sync back to state if we detected filled DOM values that weren't in state
    if (nameVal !== formData.name || emailVal !== formData.email || whatsappVal !== formData.whatsapp || 
        addressVal !== formData.address || cityVal !== formData.city || stateVal !== formData.state || zipVal !== formData.zip) {
      setFormData(prev => ({
        ...prev,
        name: nameVal,
        email: emailVal,
        whatsapp: whatsappVal,
        address: addressVal,
        city: cityVal,
        state: stateVal,
        zip: zipVal
      }));
    }

    if (!nameVal) newErrors.name = 'El nombre es requerido';
    if (!emailVal) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      newErrors.email = 'Formato de email inválido';
    }
    
    if (!whatsappVal) newErrors.whatsapp = 'El WhatsApp es requerido';
    if (!addressVal) newErrors.address = 'La dirección es requerida';
    if (!cityVal) newErrors.city = 'La ciudad es requerida';
    if (!stateVal) newErrors.state = 'El estado es requerido';
    if (!zipVal) newErrors.zip = 'El CP es requerido';

    if (isZipBlocked) {
      newErrors.zip = 'Zona restringida sin cobertura de envío';
    }

    // Payment validation
    if (paymentMethod === 'card') {
      const cardDigits = formData.cardNumber.replace(/\s/g, '');
      if (cardDigits.length < 13) newErrors.cardNumber = 'Número de tarjeta incompleto';
      
      if (formData.expDate.length !== 5) {
        newErrors.expDate = 'Formato MM/AA requerido';
      } else {
        const [m, y] = formData.expDate.split('/').map(Number);
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;
        
        if (m < 1 || m > 12) newErrors.expDate = 'Mes inválido';
        else if (y < currentYear || (y === currentYear && m < currentMonth)) {
          newErrors.expDate = 'Tarjeta expirada';
        }
      }

      if (formData.cvv.length < 3) newErrors.cvv = 'CVV inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const completeOrderWithPayPal = async (details: {
    transactionId: string;
    payerEmail: string;
    status: 'approved';
    source: string;
  }) => {
    setIsProcessing(true);
    try {
      // Create a simplified, fully serializable list of items
      const cleanItems = items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price || 0,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant ? {
          id: item.selectedVariant.id,
          sku: item.selectedVariant.sku,
          precio: item.selectedVariant.precio || null,
          textoCombinacion: item.selectedVariant.textoCombinacion,
          imagen: item.selectedVariant.imagen || null
        } : null,
        imagen: item.selectedVariant?.imagen || (item.images && item.images[0]) || ''
      }));

      const order = {
        customerName: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        address: formData.address,
        city: `${formData.city}, ${formData.state}`,
        zip: formData.zip,
        items: cleanItems,
        totalPrice: grandTotal,
        status: 'pending' as const,
        paymentInfo: {
          method: 'paypal',
          mode: paypalConfig?.mode || 'sandbox',
          status: 'approved',
          transactionId: details.transactionId,
          payerEmail: details.payerEmail,
          source: details.source
        },
        ...(appliedPromotion ? {
          couponCode: appliedPromotion.code,
          discountApplied: discountAmount
        } : {}),
        ...(selectedShipping ? {
          shippingMethodId: selectedShipping.id,
          shippingCost: shippingCost,
          shippingProvider: selectedShipping.providerName,
          shippingService: selectedShipping.serviceName
        } : {})
      };

      await addOrder(order);

      // Decrement the physical available shipping guide stock
      if (selectedShipping) {
        await updateShippingMethod(selectedShipping.id, {
          usedGuides: selectedShipping.usedGuides + 1
        });
      }
      
      setIsPaypalModalOpen(false);
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    } catch (error) {
      console.error('Error processing order with PayPal:', error);
      setIsProcessing(false);
      alert('Hubo un error al guardar tu pedido después del pago con PayPal. Contacta con soporte.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    if (paymentMethod === 'paypal') {
      setIsPaypalModalOpen(true);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create a simplified, fully serializable list of items
      const cleanItems = items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price || 0,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant ? {
          id: item.selectedVariant.id,
          sku: item.selectedVariant.sku,
          precio: item.selectedVariant.precio || null,
          textoCombinacion: item.selectedVariant.textoCombinacion,
          imagen: item.selectedVariant.imagen || null
        } : null,
        imagen: item.selectedVariant?.imagen || (item.images && item.images[0]) || ''
      }));

      // Create the order object for Direct Card payment
      const order = {
        customerName: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        address: formData.address,
        city: `${formData.city}, ${formData.state}`,
        zip: formData.zip,
        items: cleanItems,
        totalPrice: grandTotal,
        status: 'pending' as const,
        paymentInfo: {
          method: 'card',
          cardNumber: `**** **** **** ${formData.cardNumber.slice(-4)}`,
          expDate: formData.expDate
        },
        ...(appliedPromotion ? {
          couponCode: appliedPromotion.code,
          discountApplied: discountAmount
        } : {}),
        ...(selectedShipping ? {
          shippingMethodId: selectedShipping.id,
          shippingCost: shippingCost,
          shippingProvider: selectedShipping.providerName,
          shippingService: selectedShipping.serviceName
        } : {})
      };

      await addOrder(order);

      // Decrement the physical available shipping guide stock
      if (selectedShipping) {
        await updateShippingMethod(selectedShipping.id, {
          usedGuides: selectedShipping.usedGuides + 1
        });
      }
      
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    } catch (error) {
      console.error('Error processing order:', error);
      setIsProcessing(false);
      alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(price) + ' MXN';
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-xl max-w-lg w-full text-center space-y-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-50" />
            <div className="relative bg-green-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white">
              <CheckCircle2 size={48} strokeWidth={3} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter">¡Pago Exitoso!</h2>
            <p className="text-gray-500 text-lg">Tu pedido ha sido procesado correctamente.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-3xl text-left space-y-2">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">N° de confirmación</p>
            <p className="text-2xl font-mono font-black text-center text-brand-orange">VQ-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            <p className="text-xs text-gray-400 text-center">Te contactaremos por WhatsApp para coordinar la entrega.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-5 bg-brand-black text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Volver al Inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-400 font-bold hover:text-brand-black transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>

        <h1 className="text-5xl font-black tracking-tighter mb-12">Finalizar Pedido</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Sections */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Customer Info */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
              <div className="flex items-center space-x-4">
                <div className="bg-brand-orange/10 p-3 rounded-2xl">
                  <User className="text-brand-orange" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Información de Contacto</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tus datos personales</p>
                </div>
              </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Nombre Completo</label>
                  <input 
                    required
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej. Juan Pérez"
                    className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                      errors.name ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                    }`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Email</label>
                  <input 
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="juan@ejemplo.com"
                    className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                      errors.email ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">WhatsApp / Teléfono</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-1 select-none z-10 pointer-events-none">
                      <span className="text-base leading-none">🇲🇽</span>
                      <span className="text-xs font-black tracking-tight text-gray-400 font-mono">+52</span>
                      <span className="w-px h-4 bg-gray-200 block mx-1.5" />
                    </div>
                    <input 
                      required
                      type="tel"
                      name="whatsapp"
                      autoComplete="tel"
                      inputMode="numeric"
                      value={formData.whatsapp.startsWith('52') && formData.whatsapp.length > 2 ? formData.whatsapp.substring(2) : formData.whatsapp === '52' ? '' : formData.whatsapp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        // Automatically store with MX code 52 in state
                        setFormData(prev => ({ ...prev, whatsapp: val ? '52' + val : '' }));
                        if (errors.whatsapp) {
                          setErrors(prev => {
                            const copy = { ...prev };
                            delete copy.whatsapp;
                            return copy;
                          });
                        }
                      }}
                      placeholder="55 1234 5678"
                      className={`w-full p-4 pl-24 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                        errors.whatsapp ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                      }`}
                    />
                  </div>
                  {errors.whatsapp && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.whatsapp}</p>}
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
              <div className="flex items-center space-x-4">
                <div className="bg-brand-orange/10 p-3 rounded-2xl">
                  <Truck className="text-brand-orange" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Dirección de Envío</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Donde enviaremos tu pedido</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Calle y Número</label>
                  <input 
                    required
                    type="text"
                    name="address"
                    autoComplete="shipping street-address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Calle, número, colonia..."
                    className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                      errors.address ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                    }`}
                  />
                  {errors.address && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Ciudad */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Ciudad</label>
                    <input 
                      required
                      type="text"
                      name="city"
                      autoComplete="shipping address-level2"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Ej. Chihuahua"
                      className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                        errors.city ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                      }`}
                    />
                    {errors.city && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.city}</p>}
                  </div>

                  {/* Estado select element */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Estado</label>
                    <select
                      required
                      name="state"
                      value={formData.state}
                      onChange={(e) => {
                        const { name, value } = e.target;
                        setFormData(prev => ({ ...prev, [name]: value }));
                        if (errors.state) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.state;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium appearance-none ${
                        errors.state ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                      }`}
                    >
                      <option value="">Selecciona tu Estado</option>
                      {MEXICAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.state}</p>}
                  </div>

                  {/* Código Postal */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Código Postal</label>
                    <input 
                      required
                      type="text"
                      name="zip"
                      autoComplete="shipping postal-code"
                      inputMode="numeric"
                      value={formData.zip}
                      onChange={handleInputChange}
                      placeholder="00000"
                      className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                        errors.zip ? 'border-red-200 focus:ring-red-150' : 'border-transparent focus:ring-brand-orange/20'
                      }`}
                    />
                    {errors.zip && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.zip}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Opción de Envío */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
              <div className="flex items-center space-x-4">
                <div className="bg-brand-orange/10 p-3 rounded-2xl">
                  <Truck className="text-brand-orange" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Opción de Envío</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Selecciona el método de entrega de tu preferencia</p>
                </div>
              </div>

              {isZipBlocked ? (
                <div className="p-6 bg-red-50 rounded-2xl border-2 border-red-100 flex items-start space-x-4">
                  <AlertCircle className="text-red-500 mt-1 flex-shrink-0" size={24} />
                  <div className="space-y-1">
                    <span className="text-sm font-black text-red-950 uppercase tracking-wider block">Zona sin cobertura de envío</span>
                    <span className="text-xs text-red-800 leading-relaxed font-bold block">{blockedMessage}</span>
                  </div>
                </div>
              ) : shippingMethodsList.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-150 flex flex-col space-y-1">
                  <span className="text-sm font-black text-brand-black">Envío Estándar Garantizado</span>
                  <span className="text-xs text-gray-400">Entrega de 3 a 5 días hábiles</span>
                  <span className="text-xs font-black text-brand-orange uppercase tracking-wider mt-2">¡Gratis en toda la tienda! (Por omisión)</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shippingMethodsList.map((method) => {
                    const isSelected = selectedShipping?.id === method.id;
                    const isFree = totalPrice >= 3000 || (method.minPurchaseForFree != null && totalPrice >= method.minPurchaseForFree);
                    
                    return (
                      <button
                        type="button"
                        key={method.id}
                        onClick={() => setSelectedShipping(method)}
                        className={`p-6 rounded-3xl border-2 text-left transition-all relative flex flex-col justify-between h-36 ${
                          isSelected
                            ? 'border-brand-orange bg-brand-orange/5 shadow-md shadow-brand-orange/5'
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-brand-black">{method.providerName}</span>
                            {isSelected && (
                              <div className="w-5 h-5 bg-brand-orange text-white rounded-full flex items-center justify-center p-0.5">
                                <CheckCircle2 size={14} className="text-white" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">{method.serviceName}</span>
                          <span className="text-xs text-gray-500 block">Tiempo de entrega: {method.deliveryDays}</span>
                        </div>
                        
                        <div className="flex justify-between items-end mt-4 pt-2 border-t border-gray-100/50 w-full">
                          {method.minPurchaseForFree != null && (
                            <span className="text-[10px] text-green-600 font-bold block">
                              Gratis des. de ${method.minPurchaseForFree}
                            </span>
                          )}
                          <div className="ml-auto text-right">
                            {isFree ? (
                              <span className="text-sm font-black text-green-600 uppercase tracking-wide">Gratis</span>
                            ) : (
                              <span className="text-xs font-black text-brand-orange">${method.baseCost} MXN</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
              <div className="flex items-center space-x-4">
                <div className="bg-brand-orange/10 p-3 rounded-2xl border border-brand-orange/20">
                  <CreditCard className="text-brand-orange" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Método de Pago</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Transacciones rápidas y 100% seguras</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PayPal Option (Default) */}
                <button
                  type="button"
                  id="checkout-payment-paypal"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-6 rounded-[2rem] border-2 text-left relative overflow-hidden transition-all duration-300 ${
                    paymentMethod === 'paypal'
                      ? 'border-[#0070ba] bg-[#0070ba]/[0.02] ring-4 ring-[#0070ba]/10'
                      : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  {paymentMethod === 'paypal' && (
                    <div className="absolute right-0 top-0 bg-[#0070ba] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                      Default
                    </div>
                  )}
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-sm font-black text-gray-800">PayPal</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
                    Saldo, Tarjeta de Crédito, Débito o Cuenta PayPal
                  </p>
                </button>

                {/* Card Option */}
                <button
                  type="button"
                  id="checkout-payment-card"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-6 rounded-[2rem] border-2 text-left relative overflow-hidden transition-all duration-300 ${
                    paymentMethod === 'card'
                      ? 'border-brand-black bg-brand-black/[0.01] ring-4 ring-brand-black/10'
                      : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <CreditCard className="text-gray-800" size={24} />
                    <span className="text-sm font-black text-gray-800">Tarjeta Crédito/Debito</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
                    Visa, MasterCard, American Express
                  </p>
                </button>
              </div>

              {/* PayPal Secure Content */}
              {paymentMethod === 'paypal' && (
                <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-[#0070ba] flex items-center gap-1.5">
                      <ShieldCheck size={16} /> 
                      <span>Plataforma Oficial</span>
                    </span>
                    <span className="bg-blue-100 text-[#003087] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      {paypalConfig?.mode === 'sandbox' ? 'Sandbox Mode' : 'Live Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Al proceder al pago serás conectado(a) al entorno oficial de PayPal de forma segura. El Client ID del comerciante se utilizará para iniciar el flujo integrado de PayPal Checkout de forma segura.
                  </p>
                  <div className="flex items-center space-x-4 border-t border-gray-200/60 pt-3">
                    <div className="flex items-center space-x-1.5 grayscale opacity-70 scale-90 origin-left">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-5" alt="MasterCard" referrerPolicy="no-referrer" />
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                      Acepta Tarjetas Nacionales e Internacionales
                    </p>
                  </div>
                </div>
              )}

              {/* Credit Card Input Fields */}
              {paymentMethod === 'card' && (
                <div className="space-y-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Número de Tarjeta</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                      <input 
                        required
                        type="text"
                        name="cardNumber"
                        autoComplete="cc-number"
                        inputMode="numeric"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        placeholder="0000 0000 0000 0000"
                        className={`w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                          errors.cardNumber ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                        }`}
                      />
                    </div>
                    {errors.cardNumber && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.cardNumber}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Expiración (MM/AA)</label>
                       <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                         <input 
                           required
                           type="text"
                           name="expDate"
                           autoComplete="cc-exp"
                           inputMode="numeric"
                           value={formData.expDate}
                           onChange={handleInputChange}
                           placeholder="MM/YY"
                           className={`w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                             errors.expDate ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                           }`}
                         />
                       </div>
                       {errors.expDate && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.expDate}</p>}
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">CVV</label>
                       <div className="relative">
                         <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                         <input 
                           required
                           type="text"
                           name="cvv"
                           autoComplete="cc-csc"
                           inputMode="numeric"
                           value={formData.cvv}
                           onChange={handleInputChange}
                           placeholder="123"
                           maxLength={4}
                           className={`w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                             errors.cvv ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                           }`}
                         />
                       </div>
                       {errors.cvv && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.cvv}</p>}
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Summary Section */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-sm font-black tracking-tight text-brand-black flex items-center gap-2">
                <Ticket className="text-brand-orange" size={18} />
                <span>¿Tienes un cupón de descuento?</span>
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe tu código"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  className="flex-grow px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-orange text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-3 bg-brand-black text-white font-black text-xs rounded-xl hover:bg-brand-black/95 transition-all whitespace-nowrap"
                >
                  Aplicar
                </button>
              </div>
              {couponError && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                  <AlertCircle size={12} className="flex-shrink-0" />
                  <span>{couponError}</span>
                </p>
              )}
              {couponSuccess && (
                <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} className="flex-shrink-0" />
                  <span>{couponSuccess}</span>
                </p>
              )}
            </div>

            <div className="bg-brand-black text-white p-8 rounded-[2.5rem] shadow-2xl space-y-8">
              <h3 className="text-2xl font-black tracking-tight text-white">Resumen de Compra</h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => {
                  const itemKey = `${item.id}-${item.selectedVariant?.id || 'none'}`;
                  return (
                    <div key={itemKey} className="flex space-x-4 items-center">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={item.selectedVariant?.imagen || item.images?.[0] || ''} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-xs font-black text-white/40 uppercase tracking-wider">{item.quantity}x</p>
                        <h4 className="font-bold text-sm line-clamp-1 text-white">{item.name}</h4>
                        {item.selectedVariant && (
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-tight">
                            {item.selectedVariant.textoCombinacion}
                          </p>
                        )}
                        <p className="font-black text-brand-orange text-xs">{formatPrice((item.price || 0) * item.quantity)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-8 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-white/60">
                   <span className="text-sm font-bold uppercase tracking-widest">Subtotal</span>
                   <span className="font-bold">{formatPrice(totalPrice)}</span>
                </div>
                {appliedPromotion && (
                  <div className="flex justify-between items-center text-green-400">
                     <span className="text-sm font-bold uppercase tracking-widest">Descuento ({appliedPromotion.code})</span>
                     <span className="font-bold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-brand-orange text-xs font-bold uppercase tracking-widest">
                   <span>Envío {selectedShipping ? `(${selectedShipping.providerName})` : ''}</span>
                   <span>{shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                   <span className="text-xl font-black tracking-tighter uppercase">Total</span>
                   <span className="text-3xl font-black tracking-tighter text-brand-orange">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {isZipBlocked && (
                <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-xl flex items-start space-x-3 text-left">
                  <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-black text-red-200 uppercase tracking-wider">Envío No Disponible</h5>
                    <p className="text-[11px] text-red-350 leading-relaxed font-bold">
                      {blockedMessage}
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && paypalConfig && (paypalConfig.mode === 'production' ? paypalConfig.productionClientId : paypalConfig.sandboxClientId) ? (
                <PayPalButton
                  config={paypalConfig}
                  amount={grandTotal}
                  onSuccess={completeOrderWithPayPal}
                  validateForm={validateForm}
                />
              ) : (
                <button
                  type="submit"
                  disabled={isProcessing || isZipBlocked}
                  className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 transition-all ${
                    (isProcessing || isZipBlocked)
                    ? 'bg-gray-800 text-white/40 cursor-not-allowed border border-white/5' 
                    : 'bg-brand-orange hover:bg-brand-orange/90 shadow-xl shadow-brand-orange/20'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                      />
                      <span>Procesando...</span>
                    </>
                  ) : isZipBlocked ? (
                    <>
                      <AlertCircle size={22} className="text-red-400" />
                      <span>Envío Restringido</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={22} />
                      <span>
                        {paymentMethod === 'paypal' ? 'Completar Compra con PayPal' : 'Pagar Ahora'}
                      </span>
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-center space-x-2 text-white/40">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center">Transacción segura y encriptada</span>
              </div>
            </div>


          </div>
        </form>
      </div>

      <PayPalPaymentModal
        isOpen={isPaypalModalOpen}
        onClose={() => setIsPaypalModalOpen(false)}
        onSuccess={completeOrderWithPayPal}
        totalAmount={grandTotal}
        config={paypalConfig}
        customerEmail={formData.email}
        customerName={formData.name}
        items={items}
      />
    </div>
  );
}
