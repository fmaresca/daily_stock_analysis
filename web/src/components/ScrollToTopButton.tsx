import React, { useState, useEffect } from 'react';
import { ArrowUp } from './icons';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling down 280px
      if (window.scrollY > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Back to Top"
      className="fixed bottom-6 right-6 z-40 p-3 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/80 hover:border-emerald-500/60 shadow-xl shadow-black/50 hover:shadow-emerald-500/20 backdrop-blur-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <ArrowUp className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
      <span className="sr-only">Back to Top</span>
    </button>
  );
};
