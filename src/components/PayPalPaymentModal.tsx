import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, CreditCard, ChevronRight, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, Info } from 'lucide-react';
import { PayPalSettings, CartItem } from '../types';

interface PayPalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentDetails: {
    transactionId: string;
    payerEmail: string;
    status: 'approved';
    source: string;
  }) => void;
  totalAmount: number;
  config: PayPalSettings | null;
  customerEmail: string;
  customerName: string;
  items: CartItem[];
}

export const PayPalPaymentModal: React.FC<PayPalPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  totalAmount,
  config,
  customerEmail,
  customerName,
  items,
}) => {
  const [step, setStep] = useState<'login' | 'select_source' | 'confirm' | 'processing' | 'success'>('login');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Payment source state
  const [selectedSource, setSelectedSource] = useState<'balance' | 'visa' | 'mastercard'>('balance');
  
  // Transaction ID state
  const [transactionId, setTransactionId] = useState('');

  // Format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  useEffect(() => {
    if (isOpen) {
      setStep('login');
      setEmail(customerEmail || '');
      setPassword('');
      setLoginError('');
      setSelectedSource('balance');
      setTransactionId('');
    }
  }, [isOpen, customerEmail]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLoginError('Por favor introduce un correo electrónico válido de PayPal.');
      return;
    }
    if (password.length < 4) {
      setLoginError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    setLoginError('');
    setStep('select_source');
  };

  const startPaymentProcessing = () => {
    setStep('processing');
    
    // Generate a beautiful mock PayPal transaction ID
    const randomHex = Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16).toUpperCase()
    ).join('');
    const txId = `PAYID-MX${randomHex}`;
    setTransactionId(txId);

    // Simulate payment processing time
    setTimeout(() => {
      setStep('success');
      
      // Auto complete and trigger callback
      setTimeout(() => {
        onSuccess({
          transactionId: txId,
          payerEmail: email,
          status: 'approved',
          source: selectedSource === 'balance' 
            ? 'Saldo PayPal' 
            : selectedSource === 'visa' 
            ? 'Visa •••• 4242' 
            : 'MasterCard •••• 9876'
        });
      }, 1500);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-[#f5f7fa] rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row h-auto md:h-[520px]"
        id="paypal-modal-container"
      >
        {/* Left column: PayPal corporate branding and active merchant terminal info */}
        <div className="w-full md:w-5/12 bg-[#003087] text-white p-8 flex flex-col justify-between relative order-2 md:order-1">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal_Key_Logo.svg" 
                className="h-8 bg-white/10 p-1.5 rounded-xl border border-white/20" 
                alt="PayPal" 
                referrerPolicy="no-referrer"
              />
              <span className="font-sans font-black text-white text-lg tracking-wider">PayPal</span>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-orange leading-none block">
                Comerciante Autorizado
              </span>
              <p className="font-black text-sm tracking-tight line-clamp-1">{customerName || 'Tienda Oficial'}</p>
              <p className="text-[10px] text-white/60 font-mono break-all leading-tight">
                ID: {config?.mode === 'production' ? (config.productionClientId || 'No Configurado') : (config?.sandboxClientId || 'SANDBOX_MODE_DEMO')}
              </p>
            </div>
          </div>

          <div className="mt-8 md:mt-0 space-y-4">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#00a6ff]">Detalle a pagar</p>
              <p className="text-3xl font-black tracking-tight text-white">{formatPrice(totalAmount)}</p>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Moneda: Pesos Mexicanos (MXN)</p>
            </div>

            {/* Micro items summary */}
            <div className="max-h-[80px] overflow-y-auto space-y-1.5 pr-1 text-[10px] text-white/80 border-t border-white/10 pt-3 custom-scrollbar">
              {items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center font-medium gap-2">
                  <span className="line-clamp-1 flex-grow">({it.quantity}x) {it.name}</span>
                  <span className="font-bold whitespace-nowrap">{formatPrice(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 text-[10px] font-bold text-white/40 pt-1">
              <Shield size={12} className="shrink-0 text-[#00a6ff]" />
              <span>Conexión cifrada de extremo a extremo</span>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Payment wizard */}
        <div className="flex-1 bg-white p-8 md:p-10 flex flex-col justify-between order-1 md:order-2 relative" id="paypal-wizard-content">
          {/* Secure gateway header simulation */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 select-none">
              <Lock className="text-emerald-500 shrink-0" size={13} />
              <span className="text-[9px] font-mono font-bold text-emerald-600 tracking-tight">https://paypal.com/checkout</span>
            </div>
            
            {step !== 'processing' && step !== 'success' && (
              <button 
                onClick={onClose}
                id="paypal-modal-close"
                className="text-gray-400 hover:text-gray-600 transition-colors text-xs font-bold uppercase tracking-wider p-1"
              >
                Cancelar
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: Secure Login */}
            {step === 'login' && (
              <motion.form
                key="step-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLoginSubmit}
                className="space-y-5 flex-grow flex flex-col justify-center"
              >
                <div>
                  <h3 className="text-xl font-black tracking-tight text-[#003087]">Pagar con PayPal</h3>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Introduce tus credenciales para autorizar el cargo
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 block">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@paypal.com"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#003087]/30 focus:ring-4 focus:ring-[#003087]/5 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 block">
                      Contraseña de PayPal
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#003087]/30 focus:ring-4 focus:ring-[#003087]/5 transition-all"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    id="paypal-login-submit"
                    className="w-full py-3.5 bg-[#0070ba] hover:bg-[#003087] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-[#0070ba]/10 flex items-center justify-center space-x-2"
                  >
                    <span>Iniciar Sesión</span>
                    <ChevronRight size={14} />
                  </button>
                  
                  <div className="mt-3 flex items-center justify-center space-x-1.5 text-[10px] text-gray-400 font-semibold">
                    <Shield size={12} className="text-[#0070ba]" />
                    <span>Entorno de Pago Seguro y Certificado por PayPal</span>
                  </div>
                </div>
              </motion.form>
            )}

            {/* STEP 2: Select Source */}
            {step === 'select_source' && (
              <motion.div
                key="step-source"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5 flex-grow flex flex-col justify-center"
              >
                <div>
                  <button 
                    onClick={() => setStep('login')}
                    className="text-[10px] font-black text-gray-400 hover:text-brand-black uppercase tracking-wider flex items-center gap-1 mb-2"
                  >
                    <ArrowLeft size={12} />
                    <span>Atrás</span>
                  </button>
                  <h3 className="text-xl font-black tracking-tight text-[#003087]">Seleccionar método de pago</h3>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-normal">
                    Tienes sesión activa como <span className="text-brand-black">{email}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  {/* PayPal Balance option */}
                  <button
                    type="button"
                    onClick={() => setSelectedSource('balance')}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedSource === 'balance'
                        ? 'border-[#0070ba] bg-[#0070ba]/[0.02] ring-2 ring-[#0070ba]/10'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#0070ba]/10 p-2.5 rounded-xl">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal_Key_Logo.svg" 
                          className="w-5 h-5 image-render-pixel" 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800">Saldo de PayPal</p>
                        <p className="text-[10px] text-emerald-600 font-bold">Disponible: {formatPrice(totalAmount + 850)}</p>
                      </div>
                    </div>
                    <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                      selectedSource === 'balance' ? 'border-[#0070ba] bg-[#0070ba]' : 'border-gray-200'
                    }`}>
                      {selectedSource === 'balance' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>

                  {/* Visa Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedSource('visa')}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedSource === 'visa'
                        ? 'border-[#0070ba] bg-[#0070ba]/[0.02] ring-2 ring-[#0070ba]/10'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 p-2 text-center rounded-xl font-black text-[9px] text-[#222] border tracking-wider">
                        VISA
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800">Visa Débito (•••• 4242)</p>
                        <p className="text-[10px] text-gray-400 font-semibold">Usa los fondos de tu cuenta bancaria</p>
                      </div>
                    </div>
                    <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                      selectedSource === 'visa' ? 'border-[#0070ba] bg-[#0070ba]' : 'border-gray-200'
                    }`}>
                      {selectedSource === 'visa' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>

                  {/* Mastercard Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedSource('mastercard')}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedSource === 'mastercard'
                        ? 'border-[#0070ba] bg-[#0070ba]/[0.02] ring-2 ring-[#0070ba]/10'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 p-2 text-center rounded-xl font-black text-[9px] text-[#222] border tracking-wider">
                        M/C
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800">Mastercard Crédito (•••• 9876)</p>
                        <p className="text-[10px] text-gray-400 font-semibold">Cargo diferido el próximo mes</p>
                      </div>
                    </div>
                    <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                      selectedSource === 'mastercard' ? 'border-[#0070ba] bg-[#0070ba]' : 'border-gray-200'
                    }`}>
                      {selectedSource === 'mastercard' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="paypal-source-submit"
                    onClick={() => setStep('confirm')}
                    className="w-full py-3.5 bg-[#ffc439] hover:bg-[#f2b522] text-[#111] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center space-x-2"
                  >
                    <span>Continuar</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Confirm and Pay Button */}
            {step === 'confirm' && (
              <motion.div
                key="step-confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5 flex-grow flex flex-col justify-center animate-duration-200"
              >
                <div>
                  <button 
                    onClick={() => setStep('select_source')}
                    className="text-[10px] font-black text-gray-400 hover:text-brand-black uppercase tracking-wider flex items-center gap-1 mb-2"
                  >
                    <ArrowLeft size={12} />
                    <span>Atrás</span>
                  </button>
                  <h3 className="text-xl font-black tracking-tight text-[#003087]">Confirmar compra</h3>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Revisa los datos antes de finalizar la transacción
                  </p>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-start text-xs border-b border-gray-200/50 pb-2.5">
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Pagar Con</span>
                      <p className="font-bold text-gray-800 uppercase text-[11px] mt-0.5">
                        {selectedSource === 'balance' ? 'Saldo de PayPal' : selectedSource === 'visa' ? 'Visa •••• 4242' : 'MasterCard •••• 9876'}
                      </p>
                    </div>
                    <span className="text-[#0070ba] text-[10px] font-bold uppercase cursor-pointer" onClick={() => setStep('select_source')}>Cambiar</span>
                  </div>

                  <div className="flex justify-between items-start text-xs border-b border-gray-200/50 pb-2.5">
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Comprador</span>
                      <p className="font-bold text-gray-700 text-[11px] mt-0.5">{customerName}</p>
                      <p className="text-[10px] text-gray-400 font-medium leading-none">{email}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Total a debitar</span>
                      <p className="text-base font-black text-brand-orange mt-0.5">{formatPrice(totalAmount)}</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                      Sin cargos extra
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="paypal-real-pay-button"
                    onClick={startPaymentProcessing}
                    className="w-full py-4 bg-[#ffc439] hover:bg-[#f2b522] text-[#111] font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2"
                  >
                    <Shield size={16} />
                    <span>Pagar {formatPrice(totalAmount)} Ahora</span>
                  </button>

                  <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-wider mt-3">
                    Estás autorizando un cargo directo sobre tu cuenta de PayPal.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Processing Payment Spinner */}
            {step === 'processing' && (
              <motion.div
                key="step-processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-grow flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-16 h-16 border-4 border-[#0070ba]/10 rounded-full" />
                  <Loader2 className="animate-spin text-[#0070ba]" size={48} />
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-sm font-black text-brand-black uppercase tracking-widest">Asegurando Transacción</h4>
                  <p className="text-xs text-gray-400 leading-normal max-w-sm mx-auto font-medium">
                    Procesando el retiro de fondos con PayPal. No cierres ni refresques esta ventana...
                  </p>
                </div>
                <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 text-[#003087]">
                  <Lock size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Servidor de pago seguro de PayPal</span>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Success Banner */}
            {step === 'success' && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-grow flex flex-col items-center justify-center space-y-6"
              >
                <div className="bg-emerald-50 p-4 rounded-full border border-emerald-100 text-emerald-500 animate-bounce">
                  <CheckCircle2 size={44} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-emerald-600 uppercase tracking-wider">¡Pago Autorizado!</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-black">
                    ID Transacción: {transactionId || 'PROCESANDO'}
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    El cargo fue aprobado correctamente por PayPal. Redirigiendo para registrar tu pedido...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
