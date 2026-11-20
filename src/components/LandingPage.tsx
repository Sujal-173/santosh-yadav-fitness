import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Download,
  FlaskConical,
  HelpCircle,
  Instagram,
  Mail,
  MessageCircle,
  Minus,
  Plus,
  Play,
  Target,
  TrendingDown,
  Users,
  Utensils,
  UtensilsCrossed,
  Youtube,
  Zap,
} from 'lucide-react';
import {
  FAQS,
  GENERATED_IMAGES,
  REAL_TRANSFORMATIONS,
  WHAT_IS_INSIDE_FEATURES,
} from '../data/siteData';
import type { AppRoute, GoalSlug, ProductDto, SiteConfigDto } from '../types';
import {
  EASE_OUT_EXPO,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
} from './MotionPrimitives';
import { ResilientImage } from './ResilientImage';

interface LandingPageProps {
  siteConfig: SiteConfigDto;
  products: ProductDto[];
  selectedGoal: GoalSlug;
  onSelectGoal: (goal: GoalSlug) => void;
  onStartCheckout: (goal?: GoalSlug) => void;
  onOpenStory: () => void;
  onOpenSample: () => void;
  onOpenRecover: () => void;
  onNavigateRoute: (route: AppRoute) => void;
  onNavigateSection: (sectionId: string) => void;
}

const FALLBACK_HERO_HEADLINE = 'Fat Loss Ho Ya Weight Gain — Apni Diet Ko Do Ek Clear Direction.';
const FALLBACK_HERO_DESCRIPTION =
  'Apne fitness goal ke according choose karo ek practical diet plan. Simple food guidance, easy-to-follow meal structure aur daily routine ko dhyan mein rakhkar banaye gaye PDF plans — taaki aap apni eating habits ko better direction de sako.';

export function LandingPage({
  siteConfig,
  products,
  selectedGoal,
  onSelectGoal,
  onStartCheckout,
  onOpenStory,
  onOpenSample,
  onOpenRecover,
  onNavigateRoute,
  onNavigateSection,
}: LandingPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [transformIndex, setTransformIndex] = useState(0);
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const fatLossProduct = products.find((p) => p.id === 'fatloss');
  const weightGainProduct = products.find((p) => p.id === 'gain');
  const activePriceInr = Math.round(
    ((selectedGoal === 'gain' ? weightGainProduct?.pricePaise : fatLossProduct?.pricePaise) ||
      0) / 100,
  );
  const configuredHeroHeadline = siteConfig.heroHeadline?.trim();
  const heroHeadline =
    configuredHeroHeadline && /\p{L}/u.test(configuredHeroHeadline)
      ? configuredHeroHeadline
      : FALLBACK_HERO_HEADLINE;
  const heroDescription = siteConfig.heroDescription?.trim() || FALLBACK_HERO_DESCRIPTION;

  const waHelpUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    'Hi! Mujhe Santosh Yadav ke diet plan ke baare mein kuch poochna hai.',
  )}`;

  const visibleTransformations = [0, 1, 2].map(
    (offset) => REAL_TRANSFORMATIONS[(transformIndex + offset) % REAL_TRANSFORMATIONS.length],
  );

  return (
    <main className="pb-20 md:pb-0 overflow-x-clip">
      {/* 1. CINEMATIC HERO */}
      <section
        id="home"
        className="relative overflow-hidden bg-[#0B0D0E] text-[#F7F4EF] border-b border-white/10"
      >
        {/* Desktop 16:9 Full-Bleed Hero Image (subject positioned cleanly on right, uncluttered dark left) */}
        <div className="hidden lg:block absolute inset-0">
          <ResilientImage
            src={GENERATED_IMAGES.heroBg}
            alt="Santosh Yadav standing in dark commercial gym"
            className="w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D0E] via-[#0B0D0E]/70 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-0 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Copy Column (always comes first on mobile) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-center pb-4 lg:pb-0"
          >
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-[#C9BBAE] mb-4">
              <span className="text-[#F47716] font-bold">||</span>
              <span>Santosh Yadav Fitness</span>
            </div>

            <h1 className="font-display italic font-extrabold uppercase text-[clamp(2.35rem,4.7vw,4.15rem)] leading-[0.96] tracking-tight text-white text-balance max-w-xl mb-5">
              {heroHeadline}
            </h1>

            <p className="text-base sm:text-lg text-[#D5CEC7] max-w-lg leading-relaxed mb-5">
              {heroDescription}
            </p>

            {/* Handwritten Signature with Smooth Stroke Draw */}
            <div className="mb-7" aria-label="Santosh Yadav signature">
              <svg
                viewBox="0 0 220 52"
                className="w-40 h-10 text-white"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <text
                  x="4"
                  y="32"
                  fill="currentColor"
                  fontFamily="Georgia, 'Times New Roman', serif"
                  fontStyle="italic"
                  fontSize="24"
                  letterSpacing="0.4"
                >
                  Santosh Yadav
                </text>
                <motion.path
                  d="M8 42 C65 37, 130 35, 195 40"
                  stroke="#F47716"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0.4 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.65, delay: 0.2, ease: EASE_OUT_EXPO }}
                />
              </svg>
            </div>

            {/* Dual Hero CTAs */}
            <div className="flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onStartCheckout(selectedGoal)}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#F47716] hover:bg-[#FF9A32] hover:text-[#14110F] active:scale-[0.98] rounded-md transition-all duration-150 cursor-pointer shadow-lg shadow-[#F47716]/25 whitespace-nowrap shrink-0"
              >
                <span>Get My Diet Plan — ₹{activePriceInr}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onOpenStory}
                className="inline-flex items-center gap-2.5 px-5 py-3.5 text-sm sm:text-base font-medium text-white bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/25 rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="w-5 h-5 rounded-full border border-white/50 inline-flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" aria-hidden="true" />
                </span>
                <span>Watch My Story</span>
              </button>
            </div>
          </motion.div>

          {/* Mobile/Tablet Vertical Portrait Column (dedicated 3:4 mobile composition, uncropped) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden -mx-4 sm:-mx-6 mt-1"
          >
            <div className="relative w-full max-w-[400px] mx-auto aspect-[3/4] overflow-hidden">
              <ResilientImage
                src={GENERATED_IMAGES.heroMobilePortrait}
                alt="Santosh Yadav fitness portrait"
                className="w-full h-full object-cover object-[50%_10%]"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#0B0D0E] to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0B0D0E] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0B0D0E] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0B0D0E] to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. BENEFIT PILLARS & SOCIAL PROOF STATS */}
      <section className="bg-[#F5EBDD] text-[#211A15] border-b border-black/8">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
          <StaggerGroup className="grid grid-cols-3 gap-2 sm:gap-6 pb-6 sm:pb-7 border-b border-black/8">
            <StaggerItem className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 sm:justify-center">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-[#9A4311] shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-xs sm:text-base font-bold text-[#211A15] leading-tight">
                  Ghar ka Khaana
                </h2>
                <p className="text-[11px] sm:text-xs text-[#6B625B] mt-0.5">Real &amp; Simple</p>
              </div>
            </StaggerItem>

            <StaggerItem className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 sm:justify-center">
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#9A4311] shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-xs sm:text-base font-bold text-[#211A15] leading-tight">
                  Budget-Friendly
                </h2>
                <p className="text-[11px] sm:text-xs text-[#6B625B] mt-0.5">Har kisi ke liye</p>
              </div>
            </StaggerItem>

            <StaggerItem className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 sm:justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#9A4311] shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-xs sm:text-base font-bold text-[#211A15] leading-tight">
                  Easy to Follow
                </h2>
                <p className="text-[11px] sm:text-xs text-[#6B625B] mt-0.5">Practical Routine</p>
              </div>
            </StaggerItem>
          </StaggerGroup>

          <StaggerGroup className="grid grid-cols-3 gap-2 sm:gap-6 pt-6 sm:pt-7">
            <StaggerItem>
              <a
                href="https://www.instagram.com/santosh_yadav_fitness/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 sm:justify-center group transition-transform duration-150 hover:-translate-y-0.5"
              >
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-[#F47716] shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#211A15] tabular-nums group-hover:text-[#F47716] transition-colors">
                    {siteConfig.instagramFollowers}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#6B625B] leading-tight">
                    Instagram Followers
                  </div>
                </div>
              </a>
            </StaggerItem>

            <StaggerItem>
              <a
                href="https://www.youtube.com/@desigymfitness/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 sm:justify-center group transition-transform duration-150 hover:-translate-y-0.5"
              >
                <Youtube className="w-4 h-4 sm:w-5 sm:h-5 text-[#D93025] shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#211A15] tabular-nums group-hover:text-[#D93025] transition-colors">
                    {siteConfig.youtubeSubscribers}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#6B625B] leading-tight">
                    YouTube Subscribers
                  </div>
                </div>
              </a>
            </StaggerItem>

            <StaggerItem className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 sm:justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#F47716] shrink-0" aria-hidden="true" />
              <div>
                <div className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#211A15] tabular-nums">
                  {siteConfig.totalAudience}
                </div>
                <div className="text-[11px] sm:text-xs text-[#6B625B] leading-tight">
                  Total Audience
                </div>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      {/* 3. STRUGGLING WITH YOUR FITNESS GOAL? (DARK) */}
      <section className="relative overflow-hidden bg-[#0B0D0E] text-[#F7F4EF] py-14 sm:py-20">
        {/* Desktop Full-Bleed Right Monochrome Portrait (unbordered, uncropped headroom) */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-[56%] pointer-events-none bg-[#0B0D0E]">
          <ResilientImage
            src={GENERATED_IMAGES.strugglingBw}
            alt="Santosh Yadav monochrome reflective portrait"
            className="w-full h-full object-contain object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D0E] via-[#0B0D0E]/45 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#0B0D0E] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0B0D0E] to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-10 lg:mb-14">
            <ScrollReveal className="lg:col-span-6 lg:py-6">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight leading-tight text-balance mb-4">
                Struggling With <br />
                Your <span className="text-[#F47716] italic">Fitness Goal?</span>
              </h2>
              <p className="text-sm sm:text-base text-[#C4BCB4] max-w-md leading-relaxed">
                Diet ko lekar confusion, mehengi supplements, complicated plans aur inconsistent
                routine – ye sab hi fitness journey ko mushkil bana dete hain.
              </p>
            </ScrollReveal>

            {/* Mobile Portrait (4:3 centered monochrome portrait, uncropped head & expression) */}
            <ScrollReveal delay={0.08} className="lg:hidden -mx-4 sm:mx-0">
              <div className="relative w-full max-w-[420px] mx-auto aspect-[4/3] overflow-hidden bg-[#0B0D0E]">
                <ResilientImage
                  src={GENERATED_IMAGES.strugglingBw}
                  alt="Santosh Yadav monochrome reflective portrait"
                  className="w-full h-full object-cover object-top"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#0B0D0E] to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0B0D0E] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0B0D0E] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0B0D0E] to-transparent" />
              </div>
            </ScrollReveal>
          </div>

          <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                icon: HelpCircle,
                title: 'Zyada Confusion',
                desc: 'Kya khaye, kitna khaye?',
              },
              {
                icon: FlaskConical,
                title: 'Mehengi Supplements',
                desc: 'Budget par heavy',
              },
              {
                icon: UtensilsCrossed,
                title: 'Complicated Meal Plans',
                desc: 'Follow karna tough',
              },
              {
                icon: TrendingDown,
                title: 'Inconsistent Routine',
                desc: 'Continuity maintain nahi hoti',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.title}>
                  <div className="h-full bg-[#141719]/95 backdrop-blur-sm border border-white/12 hover:border-white/25 rounded-xl p-4 sm:p-5 flex flex-col gap-2.5 transition-all duration-200 hover:-translate-y-0.5">
                    <Icon className="w-4 h-4 text-[#F47716] shrink-0" aria-hidden="true" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white leading-snug mb-1">
                        {item.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#A6A09A] leading-snug">{item.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* 4. THE SOLUTION (CREAM) */}
      <section className="bg-[#F5EBDD] text-[#211A15] py-12 sm:py-20 border-b border-black/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
          <ScrollReveal className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[280px] sm:max-w-md aspect-square rounded-full overflow-hidden shadow-xl border-4 border-white bg-[#211A15]">
              <ResilientImage
                src={GENERATED_IMAGES.indianThali}
                alt="Ghar ka khaana Indian thali with dal, rice, roti, paneer sabzi, dahi and salad"
                className="w-full h-full object-cover scale-[1.12]"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08} className="lg:col-span-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[#F47716] mb-2">
              The Solution
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#211A15] leading-tight text-balance mb-4">
              A Simple, Practical &amp; Indian Diet Plan
            </h2>
            <p className="text-sm sm:text-base text-[#5C544E] leading-relaxed mb-6">
              Ghar ka khaana. Sahi planning. Practical routine. Ek structured, easy-to-follow
              Hinglish diet guide jo Indian lifestyle aur budget ke hisaab se banayi gayi hai.
            </p>

            <StaggerGroup className="space-y-3" staggerDelay={0.05}>
              {[
                'Based on Real Indian Food',
                'Budget-Friendly Ingredients',
                'Easy to Follow Meal Timings',
                'Clear Food Swap Options',
              ].map((point) => (
                <StaggerItem
                  key={point}
                  className="flex items-center gap-3 text-sm sm:text-base font-medium text-[#211A15]"
                >
                  <span className="w-5 h-5 rounded-full bg-[#F47716] text-white inline-flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                  <span>{point}</span>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. MY FITNESS JOURNEY */}
      <section
        id="my-story"
        className="relative bg-[#EFE3D2] text-[#211A15] overflow-hidden"
      >
        {/* Desktop Full-Bleed Right Portrait (eliminates awkward right margin gap) */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-[62%] pointer-events-none">
          <ResilientImage
            src={GENERATED_IMAGES.journeyOutdoor}
            alt="Santosh Yadav outdoor portrait"
            className="w-full h-full object-cover object-[72%_12%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#EFE3D2] via-[#EFE3D2]/60 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-0 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <ScrollReveal className="lg:col-span-6 flex flex-col justify-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#211A15] text-balance mb-4">
              Meri Fitness Journey
            </h2>
            <p className="text-sm sm:text-base text-[#4B443E] leading-relaxed mb-7 max-w-lg">
              Main hoon Santosh Yadav, fitness creator aur coach. Mera goal hai fitness ko simple,
              practical aur affordable banana for everyone — taaki ghar ke regular khaane ke saath
              aap apni fitness routine consistently maintain kar sako.
            </p>
            <div>
              <button
                type="button"
                onClick={onOpenStory}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#F47716] hover:bg-[#FF9A32] hover:text-[#14110F] active:scale-[0.98] rounded-md transition-all duration-150 cursor-pointer"
              >
                <span>Know My Full Story</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </ScrollReveal>

          {/* Mobile Portrait (centers Santosh cleanly, crops out left empty cream wall) */}
          <ScrollReveal delay={0.08} className="lg:hidden -mx-4 sm:-mx-6 mt-2">
            <div className="relative w-full max-w-[440px] mx-auto aspect-[10/9] overflow-hidden">
              <ResilientImage
                src={GENERATED_IMAGES.journeyOutdoor}
                alt="Santosh Yadav outdoor portrait"
                className="w-full h-full object-cover object-[86%_10%]"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#EFE3D2] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#EFE3D2] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#EFE3D2] to-transparent" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 6. CHOOSE YOUR GOAL (DARK) */}
      <section id="diet-plans" className="bg-[#0B0D0E] text-[#F7F4EF] py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-balance mb-3">
              Aapka <span className="text-[#F47716] italic">Goal</span> Kya Hai?
            </h2>
            <p className="text-sm sm:text-base text-[#A6A09A]">
              Apna goal select karo aur pao ek goal-based Indian diet plan PDF — meal charts,
              quantities aur timings ke saath.
            </p>
          </ScrollReveal>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {[
              {
                id: 'fatloss' as GoalSlug,
                title: fatLossProduct?.name || 'Fat Loss Diet Plan',
                desc:
                  fatLossProduct?.description ||
                  'Extra fat kam karne aur healthy routine maintain karne ke liye simple Indian diet guide.',
                priceInr: Math.round((fatLossProduct?.pricePaise || 0) / 100),
                image: GENERATED_IMAGES.goalFatLoss,
              },
              {
                id: 'gain' as GoalSlug,
                title: weightGainProduct?.name || 'Weight Gain Diet Plan',
                desc:
                  weightGainProduct?.description ||
                  'Healthy weight gain aur balanced nutrition ke liye affordable Indian food options.',
                priceInr: Math.round((weightGainProduct?.pricePaise || 0) / 100),
                image: GENERATED_IMAGES.goalWeightGain,
              },
            ].map((card) => {
              const isSelected = selectedGoal === card.id;
              return (
                <StaggerItem key={card.id} className="h-full">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectGoal(card.id);
                      onStartCheckout(card.id);
                    }}
                    className={`group relative w-full h-full text-left bg-[#141719] rounded-2xl overflow-hidden grid grid-cols-12 items-stretch transition-all duration-200 hover:-translate-y-1 active:scale-[0.99] cursor-pointer border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47716] ${
                      isSelected
                        ? 'border-[#F47716] shadow-lg shadow-[#F47716]/15'
                        : 'border-white/15 hover:border-[#F47716]/70'
                    }`}
                  >
                    <div className="col-span-5 relative aspect-[3/4] overflow-hidden bg-[#0B0D0E]">
                      <ResilientImage
                        src={card.image}
                        alt={`Santosh Yadav ${card.title}`}
                        className="w-full h-full object-cover object-[50%_10%] group-hover:scale-[1.03] transition-transform duration-300"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-10 bg-gradient-to-l from-[#141719] to-transparent" />
                    </div>

                    <div className="col-span-7 p-4 sm:p-7 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base sm:text-2xl font-bold text-white leading-tight mb-1.5 sm:mb-2.5">
                          {card.title}
                        </h3>
                        <p className="text-[11px] sm:text-sm text-[#A6A09A] leading-relaxed">
                          {card.desc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 sm:pt-5 gap-2">
                        <span className="text-xs sm:text-sm font-bold text-[#F47716] tabular-nums">
                          ₹{card.priceInr} · PDF
                        </span>
                        <span
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full inline-flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                            isSelected
                              ? 'bg-[#F47716] text-white'
                              : 'bg-white text-[#141210] group-hover:bg-[#F47716] group-hover:text-white'
                          }`}
                        >
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </button>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* 7. PLAN MEIN KYA MILEGA? (CREAM) */}
      <section className="bg-[#F5EBDD] text-[#211A15] py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-balance mb-3">
              Plan Mein Kya Milega?
            </h2>
            <p className="text-sm sm:text-base text-[#5C544E]">
              Sab kuch ek simple PDF mein. Koi jhanjhat nahi — padho, follow karo, consistency
              banao.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <ScrollReveal className="lg:col-span-6">
              <button
                type="button"
                onClick={onOpenSample}
                className="group relative w-full rounded-2xl overflow-hidden border border-black/10 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47716]"
              >
                <ResilientImage
                  src={GENERATED_IMAGES.dietPlanBook}
                  alt="Santosh Yadav Fitness Diet Plan PDF cover and meal schedule"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
                <span className="absolute bottom-4 right-4 px-3.5 py-2 rounded-md bg-[#0B0D0E]/90 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow">
                  <span>Sample Layout Dekho</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </button>
            </ScrollReveal>

            <StaggerGroup className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WHAT_IS_INSIDE_FEATURES.map((feat, idx) => (
                <StaggerItem key={feat.id}>
                  <div className="h-full bg-white border border-black/8 hover:border-[#F47716]/40 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[#211A15]">{feat.title}</h3>
                      <span className="font-display text-sm font-bold text-[#F47716] tabular-nums shrink-0">
                        0{idx + 1}.
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#9A4311] mb-1.5">{feat.subtitle}</p>
                    <p className="text-xs text-[#5C544E] leading-relaxed">{feat.detail}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>

      {/* 8. KAISE KAAM KARTA HAI? (DARK) */}
      <section className="bg-[#141719] text-[#F7F4EF] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-balance text-center mb-12">
              Kaise Kaam Karta Hai?
            </h2>
          </ScrollReveal>

          <div className="relative">
            <motion.div
              aria-hidden="true"
              initial={shouldReduceMotion ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              style={{ transformOrigin: '0% 50%' }}
              className="hidden lg:block absolute top-8 left-[14%] right-[14%] h-px bg-white/15"
            />

            <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                {
                  step: '1',
                  icon: Target,
                  title: 'Choose Your Goal',
                  desc: 'Fat Loss ya Weight Gain',
                },
                {
                  step: '2',
                  icon: ClipboardList,
                  title: 'Fill Your Details',
                  desc: 'Naam aur WhatsApp number',
                },
                {
                  step: '3',
                  icon: CreditCard,
                  title: 'Make Payment',
                  desc: `Secure UPI Auto QR (₹${activePriceInr})`,
                },
                {
                  step: '4',
                  icon: Download,
                  title: 'Download Plan',
                  desc: 'Apna PDF turant download karo',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <StaggerItem
                    key={item.step}
                    className="relative flex flex-col items-center text-center group"
                  >
                    <div className="relative z-10 w-16 h-16 rounded-full bg-white text-[#211A15] inline-flex items-center justify-center shadow-lg mb-4 transition-transform duration-200 group-hover:-translate-y-1">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#F47716] text-white text-xs font-bold inline-flex items-center justify-center tabular-nums">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-[#A6A09A]">{item.desc}</p>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </div>
        </div>
      </section>

      {/* 9. REAL TRANSFORMATIONS */}
      <section
        id="results"
        className="bg-[#F5EBDD] text-[#211A15] py-14 sm:py-20 border-b border-black/8"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <ScrollReveal className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-balance mb-2">
              Real <span className="text-[#F47716] italic">Transformations</span>
            </h2>
            <p className="text-sm sm:text-base text-[#5C544E]">
              Dekhiye kaise logon ne simple diet plan se apne fitness goals achieve kiye.
            </p>
          </ScrollReveal>

          <div className="relative flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() =>
                setTransformIndex((prev) =>
                  prev === 0 ? REAL_TRANSFORMATIONS.length - 1 : prev - 1,
                )
              }
              aria-label="Previous transformation"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-black/12 text-[#211A15] hover:bg-[#F47716] hover:text-white hover:border-[#F47716] active:scale-95 inline-flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </button>

            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={transformIndex}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, x: -14 }}
                  transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-5"
                >
                  {visibleTransformations.map((item, idx) => (
                    <article
                      key={`${item.id}-${idx}`}
                      className={`rounded-2xl overflow-hidden bg-[#141719] text-white border border-black/15 shadow-md flex flex-col transition-transform duration-200 hover:-translate-y-0.5 ${
                        idx > 0 ? 'hidden md:flex' : 'flex'
                      }`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#0B0D0E]">
                        <ResilientImage
                          src={item.image}
                          alt={`${item.name} ${item.goalLabel} before and after transformation (${item.beforeKg} kg to ${item.afterKg} kg)`}
                          className="w-full h-full object-cover object-top"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#0B0D0E]/75 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-white/95 rounded">
                          Before
                        </span>
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-[#0B0D0E]/75 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-[#FF9A32] rounded">
                          After
                        </span>
                      </div>

                      <div className="bg-[#141719] px-4 py-3 flex items-center justify-between gap-2 border-t border-white/10">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-[#A6A09A]">
                            Before
                          </span>
                          <span className="text-sm sm:text-base font-bold text-white tabular-nums">
                            {item.beforeKg} kg
                          </span>
                        </div>

                        <span className="font-display text-lg sm:text-xl font-extrabold text-[#F47716] tabular-nums tracking-tight">
                          {item.deltaLabel}
                        </span>

                        <div className="text-right">
                          <span className="block text-[10px] uppercase tracking-wider text-[#A6A09A]">
                            After
                          </span>
                          <span className="text-sm sm:text-base font-bold text-white tabular-nums">
                            {item.afterKg} kg
                          </span>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 flex items-center justify-between text-[11px] text-[#B8B0A8] border-t border-white/8">
                        <span className="font-semibold text-white/90">
                          {item.name} · {item.goalLabel}
                        </span>
                        <span>{item.duration}</span>
                      </div>
                    </article>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() =>
                setTransformIndex((prev) => (prev + 1) % REAL_TRANSFORMATIONS.length)
              }
              aria-label="Next transformation"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-black/12 text-[#211A15] hover:bg-[#F47716] hover:text-white hover:border-[#F47716] active:scale-95 inline-flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {REAL_TRANSFORMATIONS.map((item, idx) => {
              const active = transformIndex === idx;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show transformation ${idx + 1}`}
                  onClick={() => setTransformIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                    active ? 'w-6 bg-[#F47716]' : 'w-2 bg-black/20 hover:bg-black/35'
                  }`}
                />
              );
            })}
          </div>

          <p className="text-center text-[11px] text-[#6E655E] mt-4">
            *Individual results vary based on daily diet consistency, training &amp; lifestyle.
          </p>
        </div>
      </section>

      {/* 10. FREQUENTLY ASKED QUESTIONS & LAUNCH OFFER */}
      <section id="faqs" className="bg-[#F5EBDD] text-[#211A15] py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ScrollReveal className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-balance mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-[#5C544E]">
              Aapke common questions ke simple Hinglish answers.
            </p>
          </ScrollReveal>

          <div className="space-y-3">
            {FAQS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white border border-black/10 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF6F0] transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-[#211A15]">
                      {faq.question}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-md text-[#5C544E] inline-flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#F47716]' : ''
                      }`}
                    >
                      {isOpen ? (
                        <Minus className="w-4 h-4 text-[#F47716]" aria-hidden="true" />
                      ) : (
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="faq-answer"
                        initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                        className="px-5 pb-4 text-sm text-[#5C544E] leading-relaxed border-t border-black/6 pt-3"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Launch Offer Banner */}
          <ScrollReveal className="mt-12">
            <div className="bg-gradient-to-r from-[#C94D09] via-[#E15E11] to-[#F47716] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-4xl sm:text-5xl font-extrabold tabular-nums leading-none">
                    ₹{activePriceInr} <span className="text-xl font-bold">Only</span>
                  </div>
                  <div className="text-xs text-white/85 mt-1">One-time payment · Instant PDF</div>
                </div>

                <ul className="space-y-1.5 text-xs sm:text-sm font-medium">
                  {[
                    'Selected Diet Plan (PDF)',
                    'Hinglish Guidance',
                    'One-time Payment',
                  ].map((pt) => (
                    <li key={pt} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onStartCheckout(selectedGoal)}
                className="px-6 py-3.5 text-sm sm:text-base font-bold bg-white text-[#211A15] hover:bg-[#F5EBDD] active:scale-[0.98] rounded-lg transition-all duration-150 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow"
              >
                <span>Get My Diet Plan Now</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </ScrollReveal>

          {/* Final WhatsApp Prompt */}
          <ScrollReveal delay={0.08} className="mt-10 text-center">
            <p className="text-base font-bold text-[#211A15] mb-3">
              Koi sawaal hai? Seedha WhatsApp karo.
            </p>
            <a
              href={waHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#22A84D] hover:bg-[#1C8E40] active:scale-[0.98] text-white rounded-lg transition-all duration-150"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>WhatsApp Par Baat Karein</span>
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0B0D0E] text-[#A6A09A] border-t border-white/10 pt-10 pb-10 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Brand Logo + Tagline */}
          <div className="flex flex-col items-center">
            <ResilientImage
              src={GENERATED_IMAGES.brandLogoFull}
              alt="Santosh Yadav Fitness"
              className="h-24 sm:h-28 w-auto mx-auto object-contain rounded-xl mix-blend-lighten"
            />
            <p className="text-xs sm:text-sm text-[#A6A09A] mt-1">Simple Diet. Real Results.</p>
          </div>

          {/* Centered Social Links */}
          <div className="flex items-center justify-center gap-3.5">
            <a
              href="https://www.instagram.com/santosh_yadav_fitness/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 rounded-lg bg-[#141719] border border-white/12 inline-flex items-center justify-center text-[#D6CFC7] hover:text-white hover:border-[#F47716] transition-colors"
            >
              <Instagram className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href="https://www.youtube.com/@desigymfitness/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-10 h-10 rounded-lg bg-[#141719] border border-white/12 inline-flex items-center justify-center text-[#D6CFC7] hover:text-white hover:border-[#F47716] transition-colors"
            >
              <Youtube className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href={waHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-10 h-10 rounded-lg bg-[#141719] border border-white/12 inline-flex items-center justify-center text-[#D6CFC7] hover:text-white hover:border-[#22A84D] transition-colors"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              aria-label="Email Support"
              className="w-10 h-10 rounded-lg bg-[#141719] border border-white/12 inline-flex items-center justify-center text-[#D6CFC7] hover:text-white hover:border-[#F47716] transition-colors"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>

          {/* Primary Navigation Links */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <nav
              aria-label="Footer section links"
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-[#D6CFC7]"
            >
              <button
                type="button"
                onClick={() => onNavigateSection('home')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('diet-plans')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Diet Plans
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('my-story')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                My Story
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('results')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Results
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('faqs')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                FAQs
              </button>
            </nav>

            {/* Policy & Utility Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-[#9E9790]">
              <button
                type="button"
                onClick={() => onNavigateRoute('privacy-policy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span aria-hidden="true" className="text-white/20">
                |
              </span>
              <button
                type="button"
                onClick={() => onNavigateRoute('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
              <span aria-hidden="true" className="text-white/20">
                |
              </span>
              <button
                type="button"
                onClick={() => onNavigateRoute('refund-policy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Refund Policy
              </button>
              <span aria-hidden="true" className="text-white/20">
                |
              </span>
              <button
                type="button"
                onClick={onOpenRecover}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Recover PDF
              </button>
              <span aria-hidden="true" className="text-white/20">
                |
              </span>
              <button
                type="button"
                onClick={() => onNavigateRoute('admin')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="text-xs text-[#8C857E]">
            © {new Date().getFullYear()} Santosh Yadav Fitness. All rights reserved.
          </div>
          <p className="text-[11px] sm:text-xs text-[#8C857E]">
  Designed &amp; Developed by{" "}
  <a
    href="https://aventracreative.in/"
    target="_blank"
    rel="noopener noreferrer"
    className="font-semibold text-[#F47716] hover:text-white transition-colors underline-offset-4 hover:underline"
  >
    Sujal Patidar (Aventra Creative)
  </a>
  {" "}· Indore
</p>

          <p className="max-w-3xl mx-auto text-[11px] text-[#7D7771] leading-relaxed">
            <strong>Nutrition Disclaimer:</strong> Yeh goal-based diet plan sirf general fitness aur
            nutrition education ke liye hai, kisi medical advice ka substitute nahi. Agar aapko koi
            bimari, medical condition ya allergy hai toh diet shuru karne se pehle doctor ya
            registered dietitian se salah zaroor lein.
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp Button (Desktop) */}
      <a
        href={waHelpUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="hidden md:inline-flex fixed right-5 bottom-5 z-30 w-13 h-13 rounded-full bg-[#22A84D] hover:bg-[#1C8E40] text-white items-center justify-center shadow-xl transition-transform hover:scale-105"
      >
        <MessageCircle className="w-6 h-6" aria-hidden="true" />
      </a>

      {/* Mobile Sticky Bottom Purchase Bar (<= 15% mobile viewport height) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0B0D0E]/95 backdrop-blur-md border-t border-white/15 px-4 py-2.5 flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-white tabular-nums leading-tight">
            ₹{activePriceInr} <span className="text-xs font-normal text-[#A6A09A]">one-time</span>
          </div>
          <div className="text-[11px] text-[#A6A09A]">Instant PDF Download</div>
        </div>
        <button
          type="button"
          onClick={() => onStartCheckout(selectedGoal)}
          className="px-4 py-2.5 bg-[#F47716] hover:bg-[#FF9A32] text-white text-xs font-bold rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Get My Diet Plan</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </main>
  );
}
