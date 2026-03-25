import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from './Navbar';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, opacity: 0 });
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY, opacity: 1 });
    };
    const handleMouseLeave = () => {
      setMousePos(prev => ({ ...prev, opacity: 0 }));
    };
    const handleClick = (e: MouseEvent) => {
      const ripple: Ripple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples(prev => [...prev, ripple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== ripple.id)), 1000);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-100 relative overflow-x-hidden">
      {/* SVG grid background — fixed, full viewport */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="appGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(71,85,105,0.18)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#appGrid)" />
        <line x1="0" y1="30%" x2="100%" y2="30%" className="grid-line" style={{ animationDelay: '0.8s' }} />
        <line x1="0" y1="70%" x2="100%" y2="70%" className="grid-line" style={{ animationDelay: '1.4s' }} />
        <line x1="25%" y1="0" x2="25%" y2="100%" className="grid-line" style={{ animationDelay: '2s' }} />
        <line x1="75%" y1="0" x2="75%" y2="100%" className="grid-line" style={{ animationDelay: '2.6s' }} />
        <circle cx="25%" cy="30%" r="1.5" className="detail-dot" style={{ animationDelay: '3.5s' }} />
        <circle cx="75%" cy="30%" r="1.5" className="detail-dot" style={{ animationDelay: '3.7s' }} />
        <circle cx="25%" cy="70%" r="1.5" className="detail-dot" style={{ animationDelay: '3.9s' }} />
        <circle cx="75%" cy="70%" r="1.5" className="detail-dot" style={{ animationDelay: '4.1s' }} />
      </svg>

      {/* Mouse-following gradient */}
      <div
        className="fixed pointer-events-none z-0 w-[700px] h-[700px] rounded-full"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          opacity: mousePos.opacity * 0.035,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(203,213,225,0.8) 0%, transparent 65%)',
          filter: 'blur(40px)',
          transition: 'left 80ms linear, top 80ms linear, opacity 400ms ease-out',
          willChange: 'left, top',
        }}
      />

      {/* Click ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="ripple-effect"
          style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
        />
      ))}

      {/* Content layer */}
      <div className="relative z-10">
        <Navbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {location.pathname === '/dashboard' ? (
              children
            ) : (
              <main className="max-w-6xl mx-auto px-4 pt-20 pb-16">
                {children}
              </main>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
