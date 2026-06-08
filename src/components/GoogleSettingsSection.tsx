import React, { useEffect, useState } from 'react';
import { getGoogleAuthSettings, updateGoogleAuthSettings } from '../firebase/services';
import { GoogleAuthSettings } from '../types';
import { Save, Loader2, CheckCircle2, AlertCircle, Shield, Settings, Info, Chrome } from 'lucide-react';

export const GoogleSettingsSection: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<GoogleAuthSettings>({
    clientId: '713282007540-pur3iksqjq7fg2lofifnrmipu7bsndf9.apps.googleusercontent.com',
    reversedClientId: 'com.googleusercontent.apps.713282007540-pur3iksqjq7fg2lofifnrmipu7bsndf9',
    bundleId: 'com.ricardo.averal'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const fetched = await getGoogleAuthSettings();
        setSettings(fetched);
      } catch (err) {
        console.error('Error fetching Google settings:', err);
        setError('Ocurrió un error al cargar los ajustes de Google.');
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
      await updateGoogleAuthSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving Google settings:', err);
      setError('Ocurrió un error al guardar los ajustes de Google. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-brand-orange" size={40} />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando Ajustes de Google...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Introduction Card */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 p-4 rounded-2xl">
              <Chrome className="text-blue-600" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-brand-black">Credenciales de Google Auth</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                Configuración nativa de inicio de sesión para el WebView de Capacitor (iOS / Android).
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-blue-100 self-start sm:self-auto">
            <Shield size={12} />
            <span>Nativo Capacitor</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed">
          Para que tus usuarios inicien sesión con Google en dispositivos móviles iOS y Android evitando el bloqueo de ventanas emergentes (popup-blocked), esta aplicación utiliza autenticación nativa por medio del plugin de Capacitor.
          Aquí puedes configurar el <strong>ID de cliente</strong> y las configuraciones de identificación del paquete nativo.
        </p>

        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start space-x-3 text-blue-900 text-xs">
          <Info className="shrink-0 mt-0.5 text-blue-600" size={16} />
          <div>
            <p className="font-bold uppercase tracking-wider mb-0.5">Nota de Despliegue</p>
            <p className="font-medium">
              Estos parámetros de autenticación se inyectan en tiempo de ejecución al inicializar la sesión con Google. Asegúrate de que coincidan con la firma de tu app de Google Cloud Console.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-brand-black mb-1">Parámetros de Configuración</h4>
            <p className="text-gray-400 text-xs">Modifica estos datos para actualizar la clave de Google en tus compilaciones de Capacitor.</p>
          </div>

          <div className="space-y-6">
            {/* Client ID */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">
                Google Client ID (ID de Cliente)
              </label>
              <input
                type="text"
                value={settings.clientId}
                onChange={(e) => setSettings({ ...settings, clientId: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 hover:bg-gray-50/80 focus:bg-white rounded-2xl border border-gray-100 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-bold text-sm transition-all text-brand-black shadow-inner"
                placeholder="e.g. 713282007540-pur3ik..."
                required
              />
              <p className="text-gray-400 text-xs pl-2">
                Clave generada en las Credenciales de OAuth 2.0 en Google Cloud Console para tu plataforma Web o iOS/Android.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reversed Client ID */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">
                  Reversed Client ID (ID de Cliente Invertido)
                </label>
                <input
                  type="text"
                  value={settings.reversedClientId}
                  onChange={(e) => setSettings({ ...settings, reversedClientId: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 hover:bg-gray-50/80 focus:bg-white rounded-2xl border border-gray-100 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-bold text-sm transition-all text-brand-black shadow-inner"
                  placeholder="e.g. com.googleusercontent.apps..."
                  required
                />
                <p className="text-gray-400 text-xs pl-2">
                  Requerido por iOS. Se encuentra en la sección de descarga del archivo plist de configuración de Google.
                </p>
              </div>

              {/* Bundle ID */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">
                  Bundle ID / Package ID (Identificador de Aplicación)
                </label>
                <input
                  type="text"
                  value={settings.bundleId}
                  onChange={(e) => setSettings({ ...settings, bundleId: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 hover:bg-gray-50/80 focus:bg-white rounded-2xl border border-gray-100 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-bold text-sm transition-all text-brand-black shadow-inner"
                  placeholder="e.g. com.ricardo.averal"
                  required
                />
                <p className="text-gray-400 text-xs pl-2">
                  Identificador del paquete primario de Capacitor iOS/Android (p.ej. com.ricardo.averal).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="w-full sm:w-auto">
            {success && (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-100 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider animate-scale-up">
                <CheckCircle2 size={16} />
                <span>¡Credenciales Guardadas con Éxito!</span>
              </div>
            )}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider animate-scale-up">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-4 bg-brand-black text-white hover:bg-brand-orange transition-all font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-brand-orange/10 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
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
