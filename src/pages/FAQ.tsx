import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, HelpCircle, MessageCircle } from 'lucide-react';
import { useBranding } from '../firebase/BrandingContext';
import { getFAQs } from '../firebase/services';
import { FAQ as FAQType } from '../types';
import { EditableText } from '../components/EditableText';
import { EditableIcon } from '../components/EditableIcon';
import { HeroBackgroundEditor } from '../components/HeroBackgroundEditor';
import { useContent } from '../firebase/ContentContext';

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [loading, setLoading] = useState(true);
  const { branding } = useBranding();
  const { content } = useContent();
  const whatsappNumber = branding?.whatsapp || '525569143901';

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await getFAQs();
        setFaqs(data);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <div className="pb-24">
      <div className="bg-brand-black text-white py-24 relative overflow-hidden min-h-[400px] flex items-center">
        {content?.faq?.backgroundImage && (
          <div className="absolute inset-0 z-0">
            <img 
              src={content.faq.backgroundImage} 
              alt="" 
              className="w-full h-full object-cover opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="bg-brand-orange/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <EditableIcon 
              path="faq.heroIcon" 
              defaultIcon={HelpCircle} 
              className="text-brand-orange w-8 h-8"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 text-white">
            <EditableText path="faq.heroTitle" />
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            <EditableText path="faq.heroSubtitle" />
          </p>
        </div>
        <HeroBackgroundEditor path="faq.backgroundImage" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
          </div>
        ) : faqs.length > 0 ? (
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={faq.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-bold text-brand-black">{faq.question}</span>
                  <div className={`p-2 rounded-full transition-all ${activeIndex === index ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {activeIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                  </div>
                </button>
                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400">No hay preguntas frecuentes disponibles en este momento.</p>
          </div>
        )}

        <div className="mt-24 bg-gray-50 p-12 rounded-3xl text-center space-y-6">
          <h3 className="text-2xl font-black tracking-tighter">
            <EditableText path="faq.ctaTitle" />
          </h3>
          <p className="text-gray-500">
            <EditableText path="faq.ctaSubtitle" />
          </p>
          <a 
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} 
            target="_blank" 
            rel="noreferrer"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <MessageCircle size={20} />
            <span>Hablar con un Asesor</span>
          </a>
        </div>
      </div>
    </div>
  );
}
