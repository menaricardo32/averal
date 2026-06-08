import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { getReviews } from '../firebase/services';
import { Review } from '../types';

export default function ReviewsSlider() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getReviews();
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 8000);
    return () => clearInterval(timer);
  }, [reviews.length, currentIndex]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  if (loading || reviews.length === 0) return null;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const currentReview = reviews[currentIndex];

  return (
    <section className="py-[15px] bg-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-orange/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 bg-brand-orange/10 px-4 py-2 rounded-full mb-4"
          >
            <Star className="text-brand-orange" size={16} fill="currentColor" />
            <span className="text-brand-orange text-xs font-black uppercase tracking-[0.2em]">Testimonios</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[27px] font-black text-gray-900 tracking-tighter uppercase"
          >
            Lo que dicen nuestros <span className="text-brand-orange">clientes</span>
          </motion.h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="relative h-[400px] md:h-[302px] flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(_, info) => {
                  const swipeThreshold = 50;
                  if (info.offset.x < -swipeThreshold) {
                    handleNext();
                  } else if (info.offset.x > swipeThreshold) {
                    handlePrev();
                  }
                }}
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="absolute w-full px-2 md:px-0 cursor-grab active:cursor-grabbing"
              >
                <div className="bg-brand-black p-5 md:p-12 rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                  <Quote className="absolute top-4 right-4 md:top-8 md:right-8 text-brand-orange/10 w-10 h-10 md:w-16 md:h-16" />
                  
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-brand-orange rounded-full blur-md opacity-20 animate-pulse" />
                      <img 
                        src={currentReview.photoUrl || 'https://via.placeholder.com/150'} 
                        alt={currentReview.name} 
                        className="w-16 h-16 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/10 relative z-10"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-grow text-center md:text-left">
                      <div className="flex justify-center md:justify-start text-brand-orange mb-2 md:mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className="md:w-5 md:h-5" fill={i < currentReview.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      
                      <p className="text-[18px] text-gray-300 font-medium leading-relaxed mb-6 md:mb-8 italic line-clamp-6 md:line-clamp-none">
                        "{currentReview.text.length > 200 ? currentReview.text.substring(0, 200) + '...' : currentReview.text}"
                      </p>

                      <div className="mt-auto">
                        <h4 className="text-[16px] font-black text-white tracking-tight uppercase">{currentReview.name}</h4>
                        <p className="text-brand-orange text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">
                          {currentReview.role || 'Cliente Satisfecho'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          {reviews.length > 1 && (
            <div className="flex justify-center items-center space-x-6 mt-4 md:mt-8">
              <button
                onClick={handlePrev}
                className="p-4 rounded-full bg-white border border-gray-200 text-gray-900 hover:bg-brand-orange hover:border-brand-orange hover:text-white transition-all group shadow-sm"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="flex space-x-2">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDirection(i > currentIndex ? 1 : -1);
                      setCurrentIndex(i);
                    }}
                    className={`h-1.5 transition-all duration-300 rounded-full ${
                      i === currentIndex ? 'w-8 bg-brand-orange' : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="p-4 rounded-full bg-white border border-gray-200 text-gray-900 hover:bg-brand-orange hover:border-brand-orange hover:text-white transition-all group shadow-sm"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
