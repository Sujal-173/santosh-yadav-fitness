/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import {
  CheckoutView,
  PaymentFailedView,
  PaymentSuccessView,
} from './components/FunnelViews';
import { LandingPage } from './components/LandingPage';
import { AdminDashboardView, LegalPageView } from './components/LegalAndAdmin';
import {
  EntryLeadPopupModal,
  RecoverPdfModal,
  SamplePreviewModal,
  StoryModal,
} from './components/Modals';
import { ScrollProgressBar } from './components/MotionPrimitives';
import { Navbar } from './components/Navbar';
import type {
  AppRoute,
  GoalSlug,
  LeadPrefillProfile,
  PaymentVerifiedState,
  ProductDto,
  PublicConfigResponse,
  SiteConfigDto,
} from './types';

const DEFAULT_SITE_CONFIG: SiteConfigDto = {
  brandName: '',
  whatsappNumber: '',
  supportEmail: '',
  instagramUrl: '',
  youtubeUrl: '',
  instagramFollowers: '',
  youtubeSubscribers: '',
  totalAudience: '',
  referencePriceInr: null,
  heroHeadline: '',
  heroDescription: '',
  maintenanceMode: false,
};

const ENTRY_POPUP_DELAY_MS = 12_000;

const DEFAULT_PRODUCTS: ProductDto[] = [
  {
    id: 'fatloss',
    slug: 'fat-loss-diet-plan',
    name: '',
    description: '',
    pricePaise: 0,
    active: true,
    pdfFilename: 'fat-loss-diet-plan.pdf',
    updatedAt: '',
  },
  {
    id: 'gain',
    slug: 'weight-gain-diet-plan',
    name: '',
    description: '',
    pricePaise: 0,
    active: true,
    pdfFilename: 'weight-gain-diet-plan.pdf',
    updatedAt: '',
  },
];

function pathToRoute(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/admin' || clean === '/admin/login' || clean === '/admin/dashboard') {
    return 'admin';
  }
  if (clean === '/privacy-policy') return 'privacy-policy';
  if (clean === '/terms') return 'terms';
  if (clean === '/refund-policy') return 'refund-policy';
  if (clean === '/checkout') return 'checkout';
  if (clean === '/payment-success') return 'payment-success';
  if (clean === '/payment-failed') return 'payment-failed';
  return 'home';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => pathToRoute(window.location.pathname));
  const [activeSection, setActiveSection] = useState('home');
  const [selectedGoal, setSelectedGoal] = useState<GoalSlug>('fatloss');
  const [siteConfig, setSiteConfig] = useState<SiteConfigDto>(DEFAULT_SITE_CONFIG);
  const [products, setProducts] = useState<ProductDto[]>(DEFAULT_PRODUCTS);

  const [storyOpen, setStoryOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [entryLeadOpen, setEntryLeadOpen] = useState(false);
  const [leadPrefill, setLeadPrefill] = useState<LeadPrefillProfile | null>(null);

  const [verifiedPayment, setVerifiedPayment] = useState<PaymentVerifiedState | null>(null);
  const [failedState, setFailedState] = useState<{ reason: string; orderId?: string }>({
    reason: 'Payment complete nahi ho paya.',
  });

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = (await res.json()) as PublicConfigResponse;
        setSiteConfig(data.siteConfig);
        if (data.products.length > 0) setProducts(data.products);
      }
    } catch {
      // Fallback to initial defaults cleanly
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (route !== 'home') return;
    if (storyOpen || sampleOpen || recoverOpen) return;
    try {
      if (sessionStorage.getItem('syf_entry_popup_done') === '1') return;
    } catch {
      // Ignore storage access errors
    }

    const timer = window.setTimeout(() => {
      setEntryLeadOpen(true);
    }, ENTRY_POPUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [route, storyOpen, sampleOpen, recoverOpen]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(pathToRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateRoute = useCallback((next: AppRoute) => {
    setRoute(next);
    const urlPath = next === 'home' ? '/' : `/${next}`;
    if (window.location.pathname !== urlPath) {
      window.history.pushState({}, '', urlPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateSection = useCallback(
    (sectionId: string) => {
      setActiveSection(sectionId);
      if (route !== 'home') {
        setRoute('home');
        if (window.location.pathname !== '/') {
          window.history.pushState({}, '', '/');
        }
        requestAnimationFrame(() => {
          setTimeout(() => {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 60);
        });
        return;
      }

      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    },
    [route],
  );

  const handleStartCheckout = useCallback(
    (goal?: GoalSlug) => {
      if (goal) setSelectedGoal(goal);
      navigateRoute('checkout');
    },
    [navigateRoute],
  );

  const activePriceInr = Math.round(
    ((products.find((p) => p.id === selectedGoal)?.pricePaise) || 0) / 100,
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D0E]">
      <ScrollProgressBar />
      <Navbar
        currentRoute={route}
        activeSection={activeSection}
        onNavigateSection={navigateSection}
        onStartCheckout={handleStartCheckout}
      />

      {route === 'home' && (
        <LandingPage
          siteConfig={siteConfig}
          products={products}
          selectedGoal={selectedGoal}
          onSelectGoal={setSelectedGoal}
          onStartCheckout={handleStartCheckout}
          onOpenStory={() => setStoryOpen(true)}
          onOpenSample={() => setSampleOpen(true)}
          onOpenRecover={() => setRecoverOpen(true)}
          onNavigateRoute={navigateRoute}
          onNavigateSection={navigateSection}
        />
      )}

      {route === 'checkout' && (
        <CheckoutView
          siteConfig={siteConfig}
          products={products}
          selectedGoal={selectedGoal}
          initialProfile={leadPrefill}
          onSelectGoal={setSelectedGoal}
          onPaymentSuccess={(result) => {
            setVerifiedPayment(result);
            navigateRoute('payment-success');
          }}
          onPaymentFailed={(reason, orderId) => {
            setFailedState({ reason, orderId });
            navigateRoute('payment-failed');
          }}
          onBackHome={() => navigateRoute('home')}
        />
      )}

      {route === 'payment-success' && verifiedPayment && (
        <PaymentSuccessView
          siteConfig={siteConfig}
          result={verifiedPayment}
          onBackHome={() => navigateRoute('home')}
        />
      )}

      {route === 'payment-success' && !verifiedPayment && (
        <PaymentFailedView
          siteConfig={siteConfig}
          reason="Verified order session nahi mila. Agar aapne payment kar diya hai toh Recover PDF ya WhatsApp support use karein."
          onRetry={() => navigateRoute('checkout')}
          onBackHome={() => navigateRoute('home')}
        />
      )}

      {route === 'payment-failed' && (
        <PaymentFailedView
          siteConfig={siteConfig}
          reason={failedState.reason}
          orderId={failedState.orderId}
          onRetry={() => navigateRoute('checkout')}
          onBackHome={() => navigateRoute('home')}
        />
      )}

      {(route === 'privacy-policy' || route === 'terms' || route === 'refund-policy') && (
        <LegalPageView
          type={route}
          siteConfig={siteConfig}
          onBackHome={() => navigateRoute('home')}
        />
      )}

      {route === 'admin' && (
        <AdminDashboardView
          onBackHome={() => navigateRoute('home')}
          onConfigUpdated={fetchConfig}
        />
      )}

      <StoryModal
        open={storyOpen}
        onClose={() => setStoryOpen(false)}
        onStartCheckout={handleStartCheckout}
      />
      <SamplePreviewModal
        open={sampleOpen}
        priceInr={activePriceInr}
        onClose={() => setSampleOpen(false)}
        onStartCheckout={handleStartCheckout}
      />
      <RecoverPdfModal open={recoverOpen} onClose={() => setRecoverOpen(false)} />
      <EntryLeadPopupModal
        open={entryLeadOpen}
        priceInr={activePriceInr}
        initialGoal={selectedGoal}
        onClose={() => {
          setEntryLeadOpen(false);
          try {
            sessionStorage.setItem('syf_entry_popup_done', '1');
          } catch {
            // ignore
          }
        }}
        onSaved={(profile) => {
          setLeadPrefill(profile);
          setSelectedGoal(profile.goal);
          try {
            sessionStorage.setItem('syf_entry_popup_done', '1');
          } catch {
            // ignore
          }
        }}
        onProceedToCheckout={(profile) => {
          setLeadPrefill(profile);
          setSelectedGoal(profile.goal);
          setEntryLeadOpen(false);
          try {
            sessionStorage.setItem('syf_entry_popup_done', '1');
          } catch {
            // ignore
          }
          handleStartCheckout(profile.goal);
        }}
      />
    </div>
  );
}
