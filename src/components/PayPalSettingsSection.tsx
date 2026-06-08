import React, { useEffect, useState } from 'react';
import { getPayPalSettings, updatePayPalSettings } from '../firebase/services';
import { PayPalSettings } from '../types';
import { Save, Loader2, CheckCircle2, AlertCircle, CreditCard, Shield, Settings, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PayPalSettingsSection: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<PayPalSettings>({
    mode: 'sandbox',
    sandboxClientId: '',
    sandboxClientSecret: '',
    productionClientId: '',
    productionClientSecret: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const fetched = await getPayPalSettings();
        setSettings(fetched);
      } catch (err) {
        console.error('Error fetching PayPal settings:', err);
        setError('Ocurrió un error al cargar las credenciales de PayPal.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await updatePayPalSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving PayPal settings:', err);
      setError('Ocurrió un error al guardar las credenciales. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-brand-orange" size={40} />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando Ajustes de PayPal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Introduction Card */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-[#0070ba]/10 p-4 rounded-2xl">
              <CreditCard className="text-[#0070ba]" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-brand-black">Configuración de PayPal</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                Administra los entornos y llaves de acceso para cobrar de forma automática.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-green-100 self-start sm:self-auto">
            <Shield size={12} />
            <span>Método de Pago por Defecto</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed">
          PayPal se ha configurado como el <strong>método de pago preferente</strong> en el checkout. 
          Al habilitarlo, tus clientes podrán finalizar sus pedidos de forma instantánea y segura. 
          Recuerda configurar correctamente las credenciales para evitar contratiempos en el procesamiento de compras.
        </p>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-3 text-amber-800 text-xs">
          <Info className="shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-bold uppercase tracking-wider mb-0.5">Nota de Seguridad</p>
            <p className="font-medium">
              Por razones de seguridad, las credenciales se almacenan en tu base de datos de Firestore encriptadas de forma segura y se transmiten solamente para validación en el checkout.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Toggle Mode Control */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-brand-black">Modo de Ejecución</h4>
            <div className="flex items-center">
              <span className={`text-xs font-bold mr-3 ${settings.mode === 'sandbox' ? 'text-brand-orange' : 'text-gray-400'}`}>
                Sandbox
              </span>
              <button
                type="button"
                id="paypal-mode-toggle"
                onClick={() => setSettings(prev => ({ ...prev, mode: prev.mode === 'sandbox' ? 'production' : 'sandbox' }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.mode === 'production' ? 'bg-[#0070ba]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.mode === 'production' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold ml-3 ${settings.mode === 'production' ? 'text-[#0070ba]' : 'text-gray-400'}`}>
                Producción
              </span>
            </div>
          </div>

          {/* Mode description tabs */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              id="paypal-tab-sandbox"
              onClick={() => setSettings(prev => ({ ...prev, mode: 'sandbox' }))}
              className={`p-4 rounded-2xl border text-left transition-all ${
                settings.mode === 'sandbox'
                  ? 'border-brand-orange bg-brand-orange/[0.02] ring-2 ring-brand-orange/10'
                  : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-brand-black">Sandbox</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Entorno de Pruebas</p>
            </button>

            <button
              type="button"
              id="paypal-tab-production"
              onClick={() => setSettings(prev => ({ ...prev, mode: 'production' }))}
              className={`p-4 rounded-2xl border text-left transition-all ${
                settings.mode === 'production'
                  ? 'border-[#0070ba] bg-[#0070ba]/[0.02] ring-2 ring-[#0070ba]/10'
                  : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-brand-black">Producción</span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Transacciones Reales</p>
            </button>
          </div>
        </div>

        {/* Credentials Form fields depending on selected environment */}
        <AnimatePresence mode="wait">
          {settings.mode === 'sandbox' ? (
            <motion.div
              key="sandbox"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6"
            >
              <div className="flex items-center space-x-2 border-b border-gray-50 pb-4">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h4 className="text-sm font-black uppercase tracking-widest text-brand-black">
                  Credenciales de Sandbox (Pruebas)
                </h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">
                    Client ID (Sandbox)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.sandboxClientId}
                    onChange={(e) => setSettings(prev => ({ ...prev, sandboxClientId: e.target.value }))}
                    placeholder="Ej: AW9... (Ingresa tu Sandbox Client ID)"
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-orange/30 focus:ring-2 focus:ring-brand-orange/10 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">
                    Secret Key (Sandbox)
                  </label>
                  <input
                    type="password"
                    required
                    value={settings.sandboxClientSecret}
                    onChange={(e) => setSettings(prev => ({ ...prev, sandboxClientSecret: e.target.value }))}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-orange/30 focus:ring-2 focus:ring-brand-orange/10 transition-all font-mono"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="production"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6"
            >
              <div className="flex items-center space-x-2 border-b border-gray-50 pb-4">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <h4 className="text-sm font-black uppercase tracking-widest text-brand-black">
                  Credenciales de Producción (En Vivo)
                </h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">
                    Client ID (Producción)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.productionClientId}
                    onChange={(e) => setSettings(prev => ({ ...prev, productionClientId: e.target.value }))}
                    placeholder="Ej: ATa... (Ingresa tu Production Client ID)"
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#0070ba]/30 focus:ring-2 focus:ring-[#0070ba]/10 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">
                    Secret Key (Producción)
                  </label>
                  <input
                    type="password"
                    required
                    value={settings.productionClientSecret}
                    onChange={(e) => setSettings(prev => ({ ...prev, productionClientSecret: e.target.value }))}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#0070ba]/30 focus:ring-2 focus:ring-[#0070ba]/10 transition-all font-mono"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback banners */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl flex items-center space-x-3 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle2 size={18} className="shrink-0" />
            <span>¡Ajustes de PayPal guardados con éxito!</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center space-x-3 text-xs font-bold uppercase tracking-widest"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 bg-brand-black text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-brand-orange transition-all disabled:opacity-50 flex items-center justify-center space-x-3 active:scale-95 shadow-lg shadow-brand-black/5"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
