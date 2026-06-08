import { motion } from 'motion/react';
import { Shield, Target, Users, Award } from 'lucide-react';
import { EditableText } from '../components/EditableText';
import { EditableImage } from '../components/EditableImage';
import { EditableIcon } from '../components/EditableIcon';
import { HeroBackgroundEditor } from '../components/HeroBackgroundEditor';
import { useContent } from '../firebase/ContentContext';
import ReviewsSlider from '../components/ReviewsSlider';

export default function About() {
  const { content } = useContent();

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-black text-white py-24 relative overflow-hidden min-h-[400px] flex items-center">
        {content?.about?.backgroundImage && (
          <div className="absolute inset-0 z-0">
            <img 
              src={content.about.backgroundImage} 
              alt="" 
              className="w-full h-full object-cover opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-tight text-white">
              <EditableText path="about.heroTitle" />
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              <EditableText path="about.heroSubtitle" />
            </p>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-orange opacity-10 skew-x-12 translate-x-1/2" />
        <HeroBackgroundEditor path="about.backgroundImage" />
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter">
              <EditableText path="about.historyTitle" />
            </h2>
            <p className="text-gray-600 leading-relaxed">
              <EditableText path="about.historyText1" />
            </p>
            <p className="text-gray-600 leading-relaxed">
              <EditableText path="about.historyText2" />
            </p>
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div>
                <p className="text-4xl font-black text-brand-orange mb-2">
                  <EditableText path="about.statsExperience" />
                </p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <EditableText path="about.statsExperienceLabel" />
                </p>
              </div>
              <div>
                <p className="text-4xl font-black text-brand-orange mb-2">
                  <EditableText path="about.statsEquipments" />
                </p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <EditableText path="about.statsEquipmentsLabel" />
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <EditableImage 
              path="about.image"
              className="rounded-3xl shadow-2xl w-full aspect-[4/3] object-cover"
            />
            <div className="absolute -bottom-10 -left-10 bg-brand-orange p-8 rounded-2xl hidden md:block">
              <EditableIcon 
                path="about.awardIcon" 
                defaultIcon={Award} 
                className="text-white w-12 h-12"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission/Vision */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-12 rounded-3xl shadow-sm space-y-6 flex flex-col items-center text-center">
              <div className="bg-brand-orange/10 w-16 h-16 rounded-2xl flex items-center justify-center">
                <EditableIcon 
                  path="about.missionIcon" 
                  defaultIcon={Target} 
                  className="text-brand-orange w-8 h-8"
                />
              </div>
              <h3 className="text-2xl font-black tracking-tighter">
                <EditableText path="about.missionTitle" />
              </h3>
              <p className="text-gray-600 leading-relaxed">
                <EditableText path="about.missionText" />
              </p>
            </div>
            <div className="bg-white p-12 rounded-3xl shadow-sm space-y-6 flex flex-col items-center text-center">
              <div className="bg-brand-orange/10 w-16 h-16 rounded-2xl flex items-center justify-center">
                <EditableIcon 
                  path="about.visionIcon" 
                  defaultIcon={Users} 
                  className="text-brand-orange w-8 h-8"
                />
              </div>
              <h3 className="text-2xl font-black tracking-tighter">
                <EditableText path="about.visionTitle" />
              </h3>
              <p className="text-gray-600 leading-relaxed">
                <EditableText path="about.visionText" />
              </p>
            </div>
          </div>
        </div>
      </section>
      <ReviewsSlider />
    </div>
  );
}
