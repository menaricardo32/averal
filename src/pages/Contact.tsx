import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, MessageCircle, Clock, Facebook, Instagram, Linkedin, Youtube, Twitter, ExternalLink } from 'lucide-react';
import { useBranding } from '../firebase/BrandingContext';
import { EditableText } from '../components/EditableText';
import { EditableIcon } from '../components/EditableIcon';
import { HeroBackgroundEditor } from '../components/HeroBackgroundEditor';
import { useContent } from '../firebase/ContentContext';
import { getLocations } from '../firebase/services';
import { Location } from '../types';

export default function Contact() {
  const { branding } = useBranding();
  const { content } = useContent();
  const [locations, setLocations] = useState<Location[]>([]);
  const whatsappNumber = branding?.whatsapp || '525569143901';

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await getLocations();
        setLocations(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  return (
    <div className="pb-24">
      <div className="bg-brand-black text-white py-24 relative overflow-hidden min-h-[400px] flex items-center">
        {content?.contact?.backgroundImage && (
          <div className="absolute inset-0 z-0">
            <img 
              src={content.contact.backgroundImage} 
              alt="" 
              className="w-full h-full object-cover opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 text-white">
            <EditableText path="contact.heroTitle" />
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            <EditableText path="contact.heroSubtitle" />
          </p>
        </div>
        <HeroBackgroundEditor path="contact.backgroundImage" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Cards */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center space-y-4"
          >
            <div className="bg-brand-orange/10 p-4 rounded-2xl">
              <EditableIcon 
                path="contact.cardsIcon1" 
                defaultIcon={Phone} 
                className="text-brand-orange w-8 h-8"
              />
            </div>
            <h3 className="text-xl font-bold">
              <EditableText path="contact.cardsTitle1" />
            </h3>
            <p className="text-gray-500 text-sm">
              <EditableText path="contact.cardsDesc1" />
            </p>
            <div className="flex flex-col space-y-1">
              {(branding?.phones || (branding?.phone ? [branding.phone] : [])).length > 0 ? (
                (branding?.phones || [branding?.phone]).map((phone, idx) => (
                  <a key={idx} href={`tel:${phone?.replace(/\D/g, '')}`} className="text-lg font-black text-brand-black hover:text-brand-orange transition-colors">
                    {phone}
                  </a>
                ))
              ) : (
                <a href="tel:525569143901" className="text-lg font-black text-brand-black hover:text-brand-orange transition-colors">
                  +52 55 6914 3901
                </a>
              )}
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center space-y-4"
          >
            <div className="bg-[#25D366]/10 p-4 rounded-2xl">
              <EditableIcon 
                path="contact.cardsIcon2" 
                defaultIcon={MessageCircle} 
                className="text-[#25D366] w-8 h-8"
              />
            </div>
            <h3 className="text-xl font-bold">
              <EditableText path="contact.cardsTitle2" />
            </h3>
            <p className="text-gray-500 text-sm">
              <EditableText path="contact.cardsDesc2" />
            </p>
            <a 
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(branding?.whatsappMessage || 'Hola, me gustaría obtener más información.')}`} 
              target="_blank" 
              rel="noreferrer" 
              className="text-lg font-black text-brand-black hover:text-brand-orange transition-colors"
            >
              Enviar Mensaje
            </a>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center space-y-4"
          >
            <div className="bg-brand-orange/10 p-4 rounded-2xl">
              <EditableIcon 
                path="contact.cardsIcon3" 
                defaultIcon={Mail} 
                className="text-brand-orange w-8 h-8"
              />
            </div>
            <h3 className="text-xl font-bold">
              <EditableText path="contact.cardsTitle3" />
            </h3>
            <p className="text-gray-500 text-sm">
              <EditableText path="contact.cardsDesc3" />
            </p>
            <div className="flex flex-col space-y-1">
              {(branding?.emails || (branding?.email ? [branding.email] : [])).length > 0 ? (
                (branding?.emails || [branding?.email]).map((email, idx) => (
                  <a key={idx} href={`mailto:${email}`} className="text-lg font-black text-brand-black hover:text-brand-orange transition-colors">
                    {email}
                  </a>
                ))
              ) : (
                <a href="mailto:pedidos@averal.com" className="text-lg font-black text-brand-black hover:text-brand-orange transition-colors">
                  pedidos@averal.com
                </a>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-24">
          {/* Locations */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-black tracking-tighter mb-8 flex items-center space-x-3">
                <MapPin className="text-brand-orange" size={32} />
                <span>
                  <EditableText path="contact.locationsTitle" />
                </span>
              </h2>
              
              <div className="space-y-8">
                {locations.map((loc) => (
                  <div key={loc.id} className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                    <h3 className="text-xl font-bold mb-4">{loc.title}</h3>
                    {loc.googleMapsUrl ? (
                      <a 
                        href={loc.googleMapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 text-sm leading-relaxed mb-4 hover:text-brand-orange transition-colors block"
                      >
                        {loc.address}
                      </a>
                    ) : (
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{loc.address}</p>
                    )}
                    {loc.hours && (
                      <div className="flex items-center space-x-2 text-brand-orange font-bold text-sm mb-4">
                        <Clock size={16} />
                        <span>{loc.hours}</span>
                      </div>
                    )}
                    {loc.googleMapsUrl && (
                      <a 
                        href={loc.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-xs font-bold text-brand-orange bg-brand-orange/10 px-4 py-2.5 rounded-xl hover:bg-brand-orange hover:text-white transition-all shadow-sm"
                      >
                        <ExternalLink size={14} />
                        <span>Ver en Google Maps</span>
                      </a>
                    )}
                  </div>
                ))}
                {locations.length === 0 && (
                  <div className="space-y-8">
                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                      <h3 className="text-xl font-bold mb-4">
                        <EditableText path="contact.location1Title" />
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        <EditableText path="contact.location1Address" />
                      </p>
                      <div className="flex items-center space-x-2 text-brand-orange font-bold text-sm">
                        <Clock size={16} />
                        <span>
                          <EditableText path="contact.location1Hours" />
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                      <h3 className="text-xl font-bold mb-4">
                        <EditableText path="contact.location2Title" />
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        <EditableText path="contact.location2Address" />
                      </p>
                      <div className="flex items-center space-x-2 text-brand-orange font-bold text-sm">
                        <Clock size={16} />
                        <span>
                          <EditableText path="contact.location2Hours" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <h3 className="text-xl font-bold mb-6">Síguenos en Redes Sociales</h3>
              <div className="flex flex-wrap gap-4">
                {branding?.socialLinks?.facebook && (
                  <a 
                    href={branding.socialLinks.facebook} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center space-x-3 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:text-brand-orange transition-all group"
                  >
                    <Facebook size={20} className="text-gray-400 group-hover:text-brand-orange" />
                    <span className="font-bold text-sm">Facebook</span>
                  </a>
                )}
                {branding?.socialLinks?.instagram && (
                  <a 
                    href={branding.socialLinks.instagram} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center space-x-3 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:text-brand-orange transition-all group"
                  >
                    <Instagram size={20} className="text-gray-400 group-hover:text-brand-orange" />
                    <span className="font-bold text-sm">Instagram</span>
                  </a>
                )}
                {branding?.socialLinks?.linkedin && (
                  <a 
                    href={branding.socialLinks.linkedin} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center space-x-3 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:text-brand-orange transition-all group"
                  >
                    <Linkedin size={20} className="text-gray-400 group-hover:text-brand-orange" />
                    <span className="font-bold text-sm">LinkedIn</span>
                  </a>
                )}
                {branding?.socialLinks?.youtube && (
                  <a 
                    href={branding.socialLinks.youtube} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center space-x-3 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:text-brand-orange transition-all group"
                  >
                    <Youtube size={20} className="text-gray-400 group-hover:text-brand-orange" />
                    <span className="font-bold text-sm">YouTube</span>
                  </a>
                )}
                {branding?.socialLinks?.twitter && (
                  <a 
                    href={branding.socialLinks.twitter} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center space-x-3 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:text-brand-orange transition-all group"
                  >
                    <Twitter size={20} className="text-gray-400 group-hover:text-brand-orange" />
                    <span className="font-bold text-sm">Twitter</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Contact Form Placeholder */}
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black tracking-tighter mb-8">
              <EditableText path="contact.formTitle" />
            </h3>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Teléfono</label>
                  <input type="tel" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                <input type="email" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mensaje</label>
                <textarea rows={4} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange resize-none"></textarea>
              </div>
              <button type="submit" className="btn-primary w-full">Enviar Mensaje</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
