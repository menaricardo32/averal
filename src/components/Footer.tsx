import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle, Linkedin, Youtube, Twitter, X, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import SmartLogo from './SmartLogo';
import { useBranding } from '../firebase/BrandingContext';
import { EditableText } from './EditableText';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useContent } from '../firebase/ContentContext';
import { getLocations } from '../firebase/services';
import { Location } from '../types';

export default function Footer() {
  const { branding } = useBranding();
  const { content } = useContent();
  const [locations, setLocations] = useState<Location[]>([]);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });
  const whatsappNumber = branding?.whatsapp || '525569143901';
  const social = branding?.socialLinks;

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await getLocations();
        setLocations(data);
      } catch (error) {
        console.error("Error fetching locations for footer:", error);
      }
    };
    fetchLocations();
  }, []);

  const openLegal = (title: string, text: string) => {
    setLegalModal({ isOpen: true, title, content: text });
  };

  return (
    <footer id="main-footer" className="bg-brand-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6 text-center md:text-left">
            <Link to="/" className="flex items-center justify-center md:justify-start">
              <SmartLogo variant="light" isDarkBackground={true} className="w-[150px] h-[100px] object-contain" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              <EditableText path="footer.description" />
            </p>
            <div className="flex space-x-4 justify-center md:justify-start">
              {social?.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-orange transition-colors">
                  <Facebook size={20} />
                </a>
              )}
              {social?.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-orange transition-colors">
                  <Instagram size={20} />
                </a>
              )}
              {social?.linkedin && (
                <a href={social.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-orange transition-colors">
                  <Linkedin size={20} />
                </a>
              )}
              {social?.youtube && (
                <a href={social.youtube} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-orange transition-colors">
                  <Youtube size={20} />
                </a>
              )}
              {social?.twitter && (
                <a href={social.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-orange transition-colors">
                  <Twitter size={20} />
                </a>
              )}
              <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-orange transition-colors">
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold mb-6 text-white">Navegación</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link to="/catalog" className="hover:text-white transition-colors">Catálogo</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Nosotros</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold mb-6 text-white">Contacto</h3>
            <div className="space-y-4">
              <div className="flex flex-col items-center md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-3">
                <Phone size={18} className="text-brand-orange shrink-0" />
                <div>
                  <p className="text-sm font-bold">Teléfono / WhatsApp</p>
                  <div className="flex flex-col">
                    {(branding?.phones || (branding?.phone ? [branding.phone] : [])).length > 0 ? (
                      (branding?.phones || [branding?.phone]).map((phone, idx) => (
                        <p key={idx} className="text-sm text-gray-400">{phone}</p>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">+52 55 6914 3901</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-3">
                <Mail size={18} className="text-brand-orange shrink-0" />
                <div>
                  <p className="text-sm font-bold">Email</p>
                  <div className="flex flex-col">
                    {(branding?.emails || (branding?.email ? [branding.email] : [])).length > 0 ? (
                      (branding?.emails || [branding?.email]).map((email, idx) => (
                        <p key={idx} className="text-sm text-gray-400">{email}</p>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">pedidos@averal.com</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold mb-6 text-white">Ubicaciones</h3>
            <div className="space-y-6">
              {locations.length > 0 ? (
                locations.map((loc) => (
                  <div key={loc.id} className="flex flex-col items-center md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-3">
                    <MapPin size={18} className="text-brand-orange shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-brand-orange uppercase tracking-widest leading-tight">{loc.title}</p>
                      {loc.googleMapsUrl ? (
                        <a 
                          href={loc.googleMapsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-gray-400 whitespace-pre-line leading-relaxed hover:text-brand-orange transition-colors block"
                        >
                          {loc.address}
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">{loc.address}</p>
                      )}
                      {loc.hours && (
                        <div className="flex items-center justify-center md:justify-start space-x-1 text-[10px] text-gray-500">
                          <Clock size={10} />
                          <span>{loc.hours}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-3">
                  <MapPin size={18} className="text-brand-orange shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 whitespace-pre-line">{branding?.address || 'Zumpango de Ocampo, Edo. de México'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Averal. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 text-xs text-gray-500">
            <button 
              onClick={() => openLegal('Aviso de Privacidad', content?.legal?.privacyPolicy || '')}
              className="hover:text-white transition-colors"
            >
              Aviso de Privacidad
            </button>
            <button 
              onClick={() => openLegal('Términos y Condiciones', content?.legal?.termsAndConditions || '')}
              className="hover:text-white transition-colors"
            >
              Términos y Condiciones
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {legalModal.isOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white text-brand-black rounded-3xl w-full max-w-3xl max-h-[80vh] overflow-hidden relative z-10 shadow-2xl flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-black tracking-tighter uppercase">{legalModal.title}</h2>
                <button 
                  onClick={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {legalModal.content}
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
                  className="btn-primary py-2 px-8"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
}
