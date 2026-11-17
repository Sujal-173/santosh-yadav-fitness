import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { GENERATED_IMAGES } from '../data/siteData';
import type { AppRoute, GoalSlug } from '../types';
import { EASE_OUT_EXPO } from './MotionPrimitives';

interface NavbarProps {
  currentRoute: AppRoute;
  activeSection: string;
  onNavigateSection: (sectionId: string) => void;
  onStartCheckout: (goal?: GoalSlug) => void;
}

const NAV_LINKS = [
  { label: 'Home', target: 'home' },
  { label: 'Diet Plans', target: 'diet-plans' },
  { label: 'My Story', target: 'my-story' },
  { label: 'Results', target: 'results' },
  { label: 'FAQs', target: 'faqs' },
];

export function Navbar({
  currentRoute,
  activeSection,
  onNavigateSection,
  onStartCheckout,
}: NavbarProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLinkClick = (target: string) => {
    setMobileOpen(false);
    onNavigateSection(target);
  };

  const isTransparentTop = currentRoute === 'home' && !scrolled && !mobileOpen;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-200 ${
        isTransparentTop
          ? 'bg-[#0B0D0E]/75 backdrop-blur-sm border-b border-white/10'
          : 'bg-[#0B0D0E]/95 backdrop-blur-md border-b border-white/15 shadow-lg shadow-black/20'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Seamless Brand Emblem + Stacked Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home');
          }}
          className="whitespace-nowrap shrink-0 flex items-center gap-2 sm:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47716] rounded py-1"
        >
          <span className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 overflow-hidden inline-flex items-center justify-center">
            <img
              src={GENERATED_IMAGES.brandEmblem}
              alt="Santosh Yadav Fitness emblem"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover scale-[1.35] mix-blend-lighten"
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display italic font-extrabold text-xl sm:text-[23px] tracking-tight text-white">
              Santosh Yadav
            </span>
            <span className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] font-sans font-bold tracking-[0.26em] uppercase text-[#F7F4EF] mt-0.5">
              <span className="text-[#F47716] tracking-normal font-extrabold">||</span>
              <span>Fitness</span>
              <span className="text-[#F47716] tracking-normal font-extrabold">||</span>
            </span>
          </span>
        </a>

        {/* Zone 2: 5 Concise Single-Line Nav Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#D6CFC7]"
        >
          {NAV_LINKS.map((link) => {
            const isActive = currentRoute === 'home' && activeSection === link.target;
            return (
              <a
                key={link.target}
                href={`#${link.target}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link.target);
                }}
                className={`whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-white relative py-1 ${
                  isActive ? 'text-white' : ''
                }`}
              >
                {link.label}
                {isActive &&
                  (shouldReduceMotion ? (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F47716]" />
                  ) : (
                    <motion.span
                      layoutId="navbar-active-underline"
                      transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F47716]"
                    />
                  ))}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary CTA (sm+) + Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onStartCheckout();
            }}
            className="hidden lg:inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#F47716] hover:bg-[#FF9A32] hover:text-[#14110F] active:scale-[0.98] rounded-md transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>Get My Diet Plan</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-[#D6CFC7] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            key="mobile-nav-drawer"
            aria-label="Mobile Navigation"
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
            className="lg:hidden bg-[#141719] border-t border-white/10 px-5 py-4 flex flex-col gap-1.5"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.target}
                href={`#${link.target}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link.target);
                }}
                className="py-2.5 text-sm font-medium text-[#F7F4EF] hover:text-[#F47716] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onStartCheckout();
              }}
              className="mt-2 w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#F47716] hover:bg-[#FF9A32] rounded-md inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get My Diet Plan</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
