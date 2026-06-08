import React, { useEffect, useState, useRef } from 'react';
import { PayPalSettings } from '../types';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

interface PayPalButtonProps {
  config: PayPalSettings | null;
  amount: number;
  onSuccess: (details: {
    transactionId: string;
    payerEmail: string;
    status: 'approved';
    source: string;
  }) => void;
  validateForm: () => boolean;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({
  config,
  amount,
  onSuccess,
  validateForm
}) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const paypalButtonInstanceRef = useRef<any>(null);

  // Keep latest references to callbacks to avoid stale closures inside PayPal container
  const validateFormRef = useRef(validateForm);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    validateFormRef.current = validateForm;
  }, [validateForm]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const activeClientId = config ? (config.mode === 'production' ? config.productionClientId : config.sandboxClientId) : '';
  const isProd = config?.mode === 'production';

  useEffect(() => {
    if (!activeClientId) {
      setErrorStatus('No PayPal Client ID configured');
      return;
    }

    setErrorStatus(null);
    setSdkReady(false);

    // Clean up old script if any existed
    const existingScript = document.getElementById('paypal-sdk-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Clean up window.paypal reference to ensure full reload if config changed
    if (!(window as any).paypal) {
      setSdkReady(false);
    }

    // Load active script
    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    // Load PayPal JavaScript SDK with appropriate currency and client ID, formatted in Spanish for Mexico (es_MX)
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(activeClientId)}&currency=MXN&intent=capture&locale=es_MX&disable-funding=card,credit`;
    script.async = true;

    script.onload = () => {
      setSdkReady(true);
    };

    script.onerror = () => {
      console.error('Failed to load PayPal JS SDK script.');
      setErrorStatus('Error al cargar el SDK de PayPal. Por favor verifica tu conexión.');
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const scriptToRemove = document.getElementById('paypal-sdk-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
      // Clear container and button reference
      if (paypalButtonInstanceRef.current && paypalButtonInstanceRef.current.close) {
        try {
          paypalButtonInstanceRef.current.close();
        } catch (e) {
          console.warn('Error closing paypal button instance:', e);
        }
      }
    };
  }, [activeClientId, isProd]);

  // Handle rendering of Paypal buttons once SDK is ready and container exists
  useEffect(() => {
    if (!sdkReady || !containerRef.current || !(window as any).paypal) {
      return;
    }

    // Ensure the container is empty before rendering
    containerRef.current.innerHTML = '';

    try {
      const paypal = (window as any).paypal;
      
      const buttonsInstance = paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
          height: 50
        },
        onClick: (data: any, actions: any) => {
          // Validate the shipping form inputs first using the latest ref
          const isValid = validateFormRef.current();
          if (!isValid) {
            // Locate the first error message to scroll smoothly
            setTimeout(() => {
              const firstError = document.querySelector('.text-red-500');
              if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
            return actions.reject();
          }
          return actions.resolve();
        },
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: 'MXN',
                value: amount.toFixed(2)
              },
              description: 'Pago seguro de compra Tienda Oficial'
            }],
            application_context: {
              shipping_preference: 'NO_SHIPPING'
            }
          });
        },
        onApprove: async (data: any, actions: any) => {
          try {
            const details = await actions.order.capture();
            
            onSuccessRef.current({
              transactionId: details.id,
              payerEmail: details.payer?.email_address || '',
              status: 'approved',
              source: `PayPal SDK (${config?.mode || 'sandbox'})`
            });
          } catch (captureErr) {
            console.error('Error capturing order:', captureErr);
            setErrorStatus('Error al capturar el cargo del pago.');
          }
        },
        onError: (err: any) => {
          console.error('PayPal Buttons internal error:', err);
          setErrorStatus('Ocurrió un error en la pasarela de pagos de PayPal.');
        }
      });

      paypalButtonInstanceRef.current = buttonsInstance;
      buttonsInstance.render(containerRef.current);
    } catch (renderError) {
      console.error('Error rendering PayPal Buttons:', renderError);
      setErrorStatus('No se pudieron renderizar los componentes seguros de PayPal.');
    }
  }, [sdkReady, amount, activeClientId]);

  if (errorStatus) {
    return (
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-900 mt-2">
        <ShieldAlert className="shrink-0 text-amber-600 mt-0.5" size={18} />
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-wider">Credenciales requeridas</p>
          <p className="text-[11px] leading-relaxed font-bold opacity-80">
            {errorStatus === 'No PayPal Client ID configured' 
              ? `Ingresa tus llaves de acceso (Client ID) de PayPal en el Panel de Administración bajo 'PayPal Settings' para habilitar pagos automáticos reales en modo ${config?.mode || 'sandbox'}.`
              : errorStatus
            }
          </p>
        </div>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="flex items-center justify-center space-x-3 py-4 bg-gray-50 border border-gray-100 rounded-2xl">
        <Loader2 className="animate-spin text-brand-orange" size={20} />
        <span className="text-xs font-bold text-gray-450 uppercase tracking-widest">
          Cargando entorno seguro de PayPal...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} id="paypal-button-container" className="relative z-10 w-full min-h-[50px]" />
    </div>
  );
};
