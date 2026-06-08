import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from '../firebase/BrandingContext';

/**
 * Converts a hex color string to HSL representation.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const cleanHex = hex.replace(/^#/, '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * ScreenSnakeTransition - A premium loading indicator component for route changes.
 * Draws a glowing, multi-colored high-performance snake trace around the entire viewport
 * on route transition. Highly optimized with automatic cleaning upon animation finish.
 * Custom built to utilize the live dynamic branding palette with deep incandescent core science.
 */
export function ScreenSnakeTransition() {
  const location = useLocation();
  const { branding } = useBranding();
  const [isAnimating, setIsAnimating] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationKey, setAnimationKey] = useState(0);

  // Fetch true primary color from database context, fallback to #ea9900
  const primaryColor = branding?.colors?.primary || '#ea9900';
  const { h, s } = hexToHsl(primaryColor);

  // Handle standard viewport resize triggers with optimization
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen actively to routing shifts
  useEffect(() => {
    setIsAnimating(true);
    setAnimationKey((prev) => prev + 1);
  }, [location.pathname]);

  const { width, height } = dimensions;
  if (width === 0 || height === 0) return null;

  const strokeWidth = 2.5;
  const offset = strokeWidth / 2;
  const w = width - offset;
  const h_px = height - offset;

  // Path starts at (offset, offset) and travels clockwise around viewport perimeter
  const pathData = `M ${offset} ${offset} L ${w} ${offset} L ${w} ${h_px} L ${offset} ${h_px} Z`;

  // Compute the precise SVG perimeter to manage dash stroke logic
  const perimeter = 2 * ((width - strokeWidth) + (height - strokeWidth));
  
  // Set snake length proportionally to screen size
  const snakeLength = Math.min(600, perimeter * 0.25);

  return (
    <AnimatePresence>
      {isAnimating && (
        <svg
          key={animationKey}
          id="screen-snake-svg"
          className="fixed inset-0 w-full h-full pointer-events-none z-[99999]"
          style={{ willChange: 'transform' }}
        >
          <defs>
            {/* Multi-step incandescent neon gradient based strictly on the branding color */}
            <linearGradient id="snake-neon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {/* Outer tail is slightly faded but saturated aura */}
              <stop offset="0%" stopColor={`hsl(${h}, ${s}%, 50%)`} />
              {/* Intense warm fluorescent body */}
              <stop offset="35%" stopColor={`hsl(${h}, 100%, 55%)`} />
              {/* White-hot blinding incandescent center gas core */}
              <stop offset="50%" stopColor={`hsl(${h}, 80%, 94%)`} />
              {/* Intense body trailing back to primary accent */}
              <stop offset="65%" stopColor={`hsl(${h}, 100%, 55%)`} />
              {/* Lead tip is highly focused energetic glow */}
              <stop offset="100%" stopColor={`hsl(${h}, ${s}%, 50%)`} />
            </linearGradient>

            {/* Custom state-of-the-art dual-stage neon glow filter */}
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              {/* Stage 1: Soft wide atmospheric glow */}
              <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="blur1" />
              <feFlood floodColor={`hsl(${h}, 100%, 50%)`} floodOpacity="0.80" result="flood1" />
              <feComposite in="flood1" in2="blur1" operator="in" result="glow1" />

              {/* Stage 2: Sharp high-intensity electric corona glow */}
              <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur2" />
              <feFlood floodColor={`hsl(${h}, 100%, 65%)`} floodOpacity="0.95" result="flood2" />
              <feComposite in="flood2" in2="blur2" operator="in" result="glow2" />

              {/* Merge all glow layers securely under the original crisp source path */}
              <feMerge>
                <feMergeNode in="glow1" />
                <feMergeNode in="glow2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <motion.path
            d={pathData}
            fill="none"
            stroke="url(#snake-neon-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#neon-glow)"
            initial={{
              strokeDasharray: `${snakeLength} ${perimeter}`,
              strokeDashoffset: snakeLength,
            }}
            animate={{
              strokeDashoffset: -perimeter,
            }}
            transition={{
              duration: 2.8, // Slower, majestic speed for comfortable tracking
              ease: [0.25, 1, 0.4, 1], // Fine-tuned cubic-bezier for magnificent, fluid travel
            }}
            onAnimationComplete={() => {
              setIsAnimating(false);
            }}
          />
        </svg>
      )}
    </AnimatePresence>
  );
}
