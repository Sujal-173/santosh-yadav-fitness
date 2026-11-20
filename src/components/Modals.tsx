import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  X,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { GENERATED_IMAGES, SAMPLE_MEAL_SCHEDULE } from '../data/siteData';
import type { GoalSlug, LeadPrefillProfile } from '../types';
import { ModalTransition } from './MotionPrimitives';
import { ResilientImage } from './ResilientImage';

interface StoryModalProps {
  open: boolean;
  onClose: () => void;
  onStartCheckout: (goal?: GoalSlug) => void;
}

export function StoryModal({ open, onClose, onStartCheckout }: StoryModalProps) {
  return (
    <ModalTransition
      open={open}
      onClose={onClose}
      ariaLabelledBy="story-modal-title"
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-5"
      panelClassName="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#141719] text-[#F7F4EF] border border-white/15 rounded-2xl p-5 sm:p-8 shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close story modal"
        className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#A6A09A] hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="mb-5 sm:mb-6 pr-10">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F47716] mb-1.5">
          My Story · Santosh Yadav
        </p>
        <h2
          id="story-modal-title"
          className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white text-balance leading-[1.05]"
        >
          Bina Shortcut, Ghar Ke Khaane Se Real Transformation
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start mb-6">
        {/* Single Simple Genuine Portrait Column */}
        <div className="md:col-span-5 space-y-3">
          <div className="relative aspect-[3/4] w-full max-w-[280px] sm:max-w-[320px] md:max-w-none mx-auto rounded-xl overflow-hidden bg-[#0B0D0E] border border-white/10 shadow-lg">
            <ResilientImage
              src={GENERATED_IMAGES.storyPortrait}
              alt="Santosh Yadav genuine portrait in black gym vest"
              className="w-full h-full object-cover object-top"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B0D0E] via-[#0B0D0E]/60 to-transparent" />
            <div className="absolute bottom-3.5 left-4 right-4">
              <p className="text-xs font-bold text-white">Santosh Yadav</p>
              <p className="text-[11px] text-[#C7BFB7]">
                Fitness Creator &amp; Diet Planner · 6M+ Community
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-1 gap-2 pt-1">
            {[
              { label: 'Core Principle', value: '100% Ghar Ka Khaana' },
              { label: 'Supplements', value: 'Zaroori Nahi — Optional' },
              { label: 'Focus', value: 'Daily Consistency' },
            ].map((fact) => (
              <div
                key={fact.label}
                className="bg-[#0B0D0E] border border-white/10 rounded-lg px-3 py-2"
              >
                <div className="text-[10px] uppercase tracking-wider text-[#A6A09A]">
                  {fact.label}
                </div>
                <div className="text-xs font-semibold text-white mt-0.5 leading-snug">
                  {fact.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Genuine First-Person Story Chapters */}
        <div className="md:col-span-7 space-y-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-[#F47716] mb-1">
                01. Confusion aur limited budget
              </h3>
              <p className="text-sm sm:text-[15px] text-[#DDD6CE] leading-relaxed">
                Jab maine fitness shuru ki thi, tab mere paas na kisi mehenge personal trainer ka
                budget tha, na hi imported whey protein ya exotic ingredients kharidne ki gunjaish.
                Internet par har jagah sirf tough English meal sheets aur crash diets milti thi jo
                ek normal Indian family kitchen mein follow karna mushkil tha.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-[#F47716] mb-1">
                02. Ghar ke khaane mein chhupa asli secret
              </h3>
              <p className="text-sm sm:text-[15px] text-[#DDD6CE] leading-relaxed">
                Saalon ki training aur practical experience se maine ek baat seekhi — body banne ya
                fat kam hone ke liye mehenge khaane ki nahi,{' '}
                <span className="text-white font-medium">
                  sahi matra (portion control) aur timing
                </span>{' '}
                ki zaroorat hoti hai. Roti, dal, chawal, dahi, soya chunks, paneer, eggs aur
                seasonal sabziyon se hi poora transformation possible hai.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-[#F47716] mb-1">
                03. Yeh simple guide kyun banayi
              </h3>
              <p className="text-sm sm:text-[15px] text-[#DDD6CE] leading-relaxed">
                Instagram aur YouTube par roz hazaaron students aur working log yahi poochte the ki
                kam budget aur busy routine mein roz kya khayein. Isi confusion ko hamesha ke liye
                khatam karne ke liye maine apna saara practical routine ek easy Hinglish PDF mein
                likha hai — taaki har koi bina bhatke apni shuruwat kar sake.
              </p>
            </div>
          </div>

          <blockquote className="border border-white/10 rounded-xl p-4 bg-[#0B0D0E]/70">
            <p className="text-xs sm:text-sm italic text-[#EFE9E2] leading-relaxed">
              “15 din ki extreme dieting aapko thaka deti hai. Roz ka simple ghar ka khaana aur
              patience aapko life-long fit rakhta hai.”
            </p>
            <footer className="text-[11px] font-semibold text-[#F47716] mt-1.5">
              — Santosh Yadav
            </footer>
          </blockquote>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
        <p className="text-xs sm:text-sm text-[#A6A09A]">
          Ghar ke khaane aur simple routine ke saath apna plan shuru karne ke liye ready ho?
        </p>
        <button
          type="button"
          onClick={() => {
            onClose();
            onStartCheckout();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#F47716] hover:bg-[#FF9A32] hover:text-[#14110F] active:scale-[0.98] rounded-md transition-all duration-150 cursor-pointer shrink-0"
        >
          <span>Get My Diet Plan — ₹199</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </ModalTransition>
  );
}

interface SamplePreviewModalProps {
  open: boolean;
  priceInr: number;
  onClose: () => void;
  onStartCheckout: (goal?: GoalSlug) => void;
}

export function SamplePreviewModal({
  open,
  priceInr,
  onClose,
  onStartCheckout,
}: SamplePreviewModalProps) {
  const [tab, setTab] = useState<GoalSlug>('fatloss');

  return (
    <ModalTransition
      open={open}
      onClose={onClose}
      ariaLabelledBy="sample-preview-title"
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      panelClassName="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#F5EBDD] text-[#211A15] border border-black/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close diet plan preview"
        className="absolute top-4 right-4 w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#5C544E] hover:text-[#211A15] hover:bg-black/5 transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      <p className="text-xs font-semibold tracking-wider uppercase text-[#F47716] mb-1">
        Sample Layout Preview
      </p>
      <h2
        id="sample-preview-title"
        className="font-display text-3xl font-bold uppercase tracking-tight text-[#211A15] text-balance mb-4"
      >
        Hinglish Meal Schedule Example
      </h2>

      <div className="inline-flex items-center gap-1 p-1 bg-[#E7DAC9] rounded-lg mb-5">
        {(
          [
            { id: 'fatloss', label: 'Fat Loss Guide' },
            { id: 'gain', label: 'Weight Gain Guide' },
          ] as { id: GoalSlug; label: string }[]
        ).map((goalOption) => (
          <button
            key={goalOption.id}
            type="button"
            onClick={() => setTab(goalOption.id)}
            className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              tab === goalOption.id
                ? 'bg-[#F47716] text-white shadow-sm'
                : 'text-[#4C4540] hover:text-[#211A15]'
            }`}
          >
            {goalOption.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-black/8 rounded-xl divide-y divide-black/6 mb-6">
        {SAMPLE_MEAL_SCHEDULE.map((row) => (
          <div
            key={row.time}
            className="p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-5"
          >
            <div className="sm:w-32 shrink-0">
              <span className="text-xs font-bold text-[#F47716] tabular-nums">{row.time}</span>
              <div className="text-xs font-semibold text-[#211A15]">{row.title}</div>
            </div>
            <div className="flex-1 text-sm text-[#35302C]">
              <p className="font-medium">{tab === 'fatloss' ? row.fatLoss : row.weightGain}</p>
              <p className="text-xs text-[#6E655E] mt-1">Swap option: {row.swap}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-[#5C544E]">
          <CheckCircle2 className="w-4 h-4 text-[#F47716]" aria-hidden="true" />
          <span>
            Complete goal-based PDF mein food swaps, meal timings &amp; common mistakes bhi shaamil hain
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            onClose();
            onStartCheckout(tab);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#F47716] hover:bg-[#FF9A32] hover:text-[#14110F] active:scale-[0.98] rounded-md transition-all duration-150 cursor-pointer"
        >
          <span>Get Plan — ₹{priceInr}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </ModalTransition>
  );
}

interface RecoverPdfModalProps {
  open: boolean;
  onClose: () => void;
}

export function RecoverPdfModal({ open, onClose }: RecoverPdfModalProps) {
  const [orderOrPaymentId, setOrderOrPaymentId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recovered, setRecovered] = useState<{
    orderId: string;
    productName: string;
    downloadToken: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/downloads/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderOrPaymentId: orderOrPaymentId.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Order recover nahi ho paya.');
      } else {
        setRecovered(data);
      }
    } catch {
      setError('Network error. Kripya dubara try karein.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalTransition
      open={open}
      onClose={onClose}
      ariaLabelledBy="recover-modal-title"
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      panelClassName="relative w-full max-w-md bg-white text-[#211A15] rounded-2xl p-6 shadow-2xl border border-black/10"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close recover dialog"
        className="absolute top-4 right-4 w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#5C544E] hover:bg-black/5 cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      <h3 id="recover-modal-title" className="text-xl font-bold mb-1">
        Lost Your PDF Link?
      </h3>
      <p className="text-sm text-[#5C544E] mb-4">
        Apna Order ID (ya UPI Transaction ID) aur registered 10-digit WhatsApp number daalkar
        naya secure download link paayein.
      </p>

      {recovered ? (
        <div className="bg-[#EEF9F1] border border-[#22A84D]/30 rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold text-[#155E2D]">
            Order #{recovered.orderId} Verified — {recovered.productName}
          </div>
          <a
            href={`/api/downloads/${recovered.downloadToken}`}
            className="w-full py-2.5 px-4 bg-[#F47716] hover:bg-[#FF9A32] text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download Diet Plan PDF</span>
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#35302C] mb-1">
              Order ID ya Payment ID
            </label>
            <input
              type="text"
              required
              value={orderOrPaymentId}
              onChange={(e) => setOrderOrPaymentId(e.target.value)}
              placeholder="e.g. SYF48271 or pay_..."
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F47716]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#35302C] mb-1">
              Registered 10-Digit Mobile
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F47716]"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#F47716] hover:bg-[#FF9A32] rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Checking Order...' : 'Verify & Generate Download Link'}
          </button>
        </form>
      )}
    </ModalTransition>
  );
}

interface UpiAutoPaymentModalProps {
  open: boolean;
  orderId: string;
  productName: string;
  amountInr: number;
  customerName: string;
  customerPhone: string;
  upiId: string;
  upiUri: string;
  qrCodeUrl: string;
  appLinks: {
    gpay: string;
    phonepe: string;
    paytm: string;
    bhim: string;
  };
  expiresAt: string;
  onVerified: (payload: {
    orderId: string;
    paymentId: string;
    productId: GoalSlug;
    productName: string;
    downloadToken: string;
  }) => void;
  onDismiss: () => void;
}

export function UpiAutoPaymentModal({
  open,
  orderId,
  productName,
  amountInr,
  customerName,
  customerPhone,
  upiId,
  upiUri,
  qrCodeUrl,
  appLinks,
  expiresAt,
  onVerified,
  onDismiss,
}: UpiAutoPaymentModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)),
  );
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'pending' | 'failed' | 'expired' | 'review'>('pending');
  const [message, setMessage] = useState('Scan the QR with any UPI app. Payment confirmation is automatic.');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [open, expiresAt]);

  useEffect(() => {
    if (!open || (status !== 'pending' && status !== 'expired')) return;
    let active = true;
    let inFlight = false;

    const checkStatus = async () => {
      if (!active || inFlight) return;
      inFlight = true;
      setChecking(true);
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderId.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (res.ok && data.verified) {
          setMessage('Payment confirmed by Paytm. Preparing your download...');
          onVerified({
            orderId: data.orderId,
            paymentId: data.paymentId,
            productId: data.productId,
            productName: data.productName,
            downloadToken: data.downloadToken,
          });
          return;
        }

        if (data.status === 'failed' || data.status === 'expired' || data.status === 'review'
          || res.status === 400 || res.status === 404) {
          setStatus(data.status === 'failed' || data.status === 'expired' ? data.status : 'review');
          setMessage(data.error || 'The order could not be verified. Do not pay again; contact support with your order ID.');
          return;
        }

        // Paytm's status endpoint returns `message` for pending transactions.
        setMessage(data.message || data.error || 'Payment abhi confirm nahi hua. We will check again automatically.');
      } catch {
        if (active) setMessage('Connection issue. Payment status check will retry automatically.');
      } finally {
        inFlight = false;
        if (active) setChecking(false);
      }
    };

    void checkStatus();
    const poller = setInterval(() => {
      void checkStatus();
    }, 5000);

    return () => {
      active = false;
      clearInterval(poller);
    };
  }, [open, orderId, status, onVerified]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
    } catch {
      setMessage('Copy not available in this browser. You can select the UPI ID manually.');
    }
  };

  return (
    <ModalTransition
      open={open}
      onClose={onDismiss}
      ariaLabelledBy="upi-auto-payment-title"
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4"
      panelClassName="relative w-full max-w-lg max-h-[94vh] overflow-y-auto bg-white text-[#211A15] rounded-2xl shadow-2xl border border-black/15"
    >
      <div className="bg-[#141719] text-white px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-[#F47716] uppercase tracking-[0.2em] font-bold">UPI Auto Checkout</p>
          <h2 id="upi-auto-payment-title" className="text-lg font-bold mt-1">Complete Your Payment</h2>
          <p className="text-xs text-[#BDB5AD] mt-0.5">{productName} · Order #{orderId}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-extrabold tabular-nums">₹{amountInr.toFixed(2)}</p>
          <button type="button" onClick={onDismiss} className="text-[11px] text-[#BDB5AD] underline mt-1">Close</button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-[#FAF6F0] border border-black/8 rounded-lg p-3 text-xs text-[#5C544E]">
          Paying as <strong className="text-[#211A15]">{customerName}</strong> · {customerPhone}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-4 items-center">
          <div className="flex flex-col items-center">
            <div className="bg-white border border-black/10 rounded-xl p-3 shadow-sm">
              <img
                src={qrCodeUrl}
                alt={`UPI payment QR for ₹${amountInr.toFixed(2)}`}
                width={220}
                height={220}
                className="w-[190px] h-[190px] sm:w-[210px] sm:h-[210px] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-[11px] text-[#7A7169] mt-2">Scan using any UPI app</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A7169] mb-1">Pay to UPI ID</p>
              <div className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2">
                <span className="text-sm font-bold break-all flex-1">{upiId}</span>
                <button type="button" onClick={handleCopy} aria-label="Copy UPI ID" className="shrink-0 p-1.5 rounded-md hover:bg-black/5">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && <p className="text-[10px] text-emerald-700 mt-1">UPI ID copied</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Google Pay', href: appLinks.gpay },
                { label: 'PhonePe', href: appLinks.phonepe },
                { label: 'Paytm', href: appLinks.paytm },
                { label: 'BHIM / Other UPI', href: appLinks.bhim },
              ].map((app) => (
                <a
                  key={app.label}
                  href={app.href}
                  className="text-center text-[11px] font-semibold rounded-lg border border-[#F47716]/30 bg-[#FFF7EF] text-[#7C3D0A] hover:bg-[#FCE8D6] px-2 py-2.5"
                >
                  {app.label}
                </a>
              ))}
            </div>
            <a href={upiUri} className="block text-center text-xs font-semibold text-[#C65E0A] underline">
              Open UPI app
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-[#7A7169]">QR expires in</p>
            <p className={`text-lg font-extrabold tabular-nums ${secondsLeft === 0 ? 'text-red-600' : 'text-[#211A15]'}`}>
              {minutes}:{seconds}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-[#5C544E]">Payment status</p>
            <p className={`text-xs font-bold uppercase ${status === 'pending' ? 'text-amber-700' : status === 'failed' || status === 'expired' ? 'text-red-600' : 'text-orange-700'}`}>
              {status === 'pending' ? (secondsLeft === 0 ? 'Checking delayed payment' : 'Waiting for payment') : status === 'review' ? 'Needs support' : status}
            </p>
          </div>
        </div>

        <div className={`rounded-lg border p-3 text-xs leading-relaxed ${
          status === 'failed' || status === 'expired'
            ? 'bg-red-50 border-red-200 text-red-800'
            : status === 'review'
              ? 'bg-orange-50 border-orange-200 text-orange-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
        }`} aria-live="polite">
          {message}
        </div>

        {status === 'pending' || status === 'expired' ? (
          <button
            type="button"
            disabled={checking}
            onClick={async () => {
              setStatus('pending');
              setChecking(true);
              try {
                const res = await fetch('/api/payments/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: orderId.trim() }),
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.verified) {
                  onVerified({
                    orderId: data.orderId,
                    paymentId: data.paymentId,
                    productId: data.productId,
                    productName: data.productName,
                    downloadToken: data.downloadToken,
                  });
                } else if (['failed', 'expired', 'review'].includes(data.status)
                  || res.status === 400 || res.status === 404) {
                  setStatus(data.status === 'failed' || data.status === 'expired' ? data.status : 'review');
                  setMessage(data.error || 'The order could not be verified. Do not pay again; contact support with your order ID.');
                } else {
                  setMessage(data.message || data.error || 'Payment is still pending. Keep this window open.');
                }
              } catch {
                setMessage('Could not check right now. Automatic retry is still enabled.');
              } finally {
                setChecking(false);
              }
            }}
            className="w-full py-3 px-4 bg-[#F47716] hover:bg-[#FF9A32] text-white font-semibold text-sm rounded-lg transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking with Paytm…' : 'I Have Paid — Check Status'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-3 px-4 border border-black/15 hover:bg-black/5 text-[#211A15] font-semibold text-sm rounded-lg"
          >
            Close payment window
          </button>
        )}

        <p className="text-[10px] text-center text-[#8B827A] leading-relaxed">
          Never share your UPI PIN or OTP. Your PDF unlocks only after the server receives a matching Paytm success status and exact amount for this order.
        </p>
      </div>
    </ModalTransition>
  );
}

interface EntryLeadPopupModalProps {
  open: boolean;
  priceInr: number;
  initialGoal: GoalSlug;
  onClose: () => void;
  onSaved: (profile: LeadPrefillProfile) => void;
  onProceedToCheckout: (profile: LeadPrefillProfile) => void;
}

export function EntryLeadPopupModal({
  open,
  priceInr,
  initialGoal,
  onClose,
  onSaved,
  onProceedToCheckout,
}: EntryLeadPopupModalProps) {
  const [goal, setGoal] = useState<GoalSlug>(initialGoal);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('24');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('72');
  const [dietPreference, setDietPreference] = useState<'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian'>('Vegetarian');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedProfile, setSubmittedProfile] = useState<LeadPrefillProfile | null>(null);

  useEffect(() => {
    if (open) {
      setGoal(initialGoal);
    }
  }, [open, initialGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim();
    const ageNum = Number(age);
    const heightNum = Number(heightCm);
    const weightNum = Number(weightKg);

    if (cleanName.length < 2) {
      setError('Kripya apna poora naam daalo.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Sahi 10-digit Indian mobile / WhatsApp number daalo.');
      return;
    }
    if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Email format sahi nahi hai.');
      return;
    }
    if (!ageNum || ageNum < 14 || ageNum > 80) {
      setError('Age 14 se 80 saal ke beech daalo.');
      return;
    }
    if (!heightNum || heightNum < 120 || heightNum > 230) {
      setError('Height 120 se 230 cm ke beech daalo.');
      return;
    }
    if (!weightNum || weightNum < 30 || weightNum > 200) {
      setError('Weight 30 se 200 kg ke beech daalo.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          goal,
          age: ageNum,
          gender,
          heightCm: heightNum,
          weightKg: weightNum,
          dietPreference,
          consentAccepted: true,
          source: 'entry_popup',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Details save karne mein problem aayi.');
        setSubmitting(false);
        return;
      }

      const profile: LeadPrefillProfile = {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        goal,
        age: String(ageNum),
        gender,
        heightCm: String(heightNum),
        weightKg: String(weightNum),
        dietPreference,
      };
      setSubmittedProfile(profile);
      onSaved(profile);
    } catch {
      setError('Network error. Kripya dubara try karein.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTransition
      open={open}
      onClose={onClose}
      ariaLabelledBy="entry-lead-modal-title"
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4"
      panelClassName="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#141719] text-[#F7F4EF] border border-white/15 rounded-2xl p-5 sm:p-7 shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close fitness profile popup"
        className="absolute top-3.5 right-3.5 w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#A6A09A] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9BBAE] mb-1.5">
        <span className="text-[#F47716] font-bold">||</span>
        <span>Santosh Yadav Fitness</span>
      </div>

      <h2
        id="entry-lead-modal-title"
        className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white text-balance pr-8 leading-tight"
      >
        Apna Fitness Goal Batayein
      </h2>
        <p className="text-xs sm:text-sm text-[#BDB5AD] mt-1 mb-4 leading-relaxed">
          Apni basic body details share karo taaki aapko sahi{' '}
          <span className="text-white font-medium">Weight Loss</span> ya{' '}
          <span className="text-white font-medium">Weight Gain</span> diet plan suggest ho sake.
        </p>

        {submittedProfile ? (
          <div className="bg-[#0B0D0E] border border-emerald-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Shukriya {submittedProfile.name}! Details Save Ho Gayi Hain.
                </h3>
                <p className="text-xs text-[#BDB5AD] mt-1 leading-relaxed">
                  Goal:{' '}
                  <strong className="text-white">
                    {submittedProfile.goal === 'fatloss' ? 'Weight Loss / Fat Loss' : 'Weight Gain'}
                  </strong>{' '}
                  · {submittedProfile.heightCm} cm · {submittedProfile.weightKg} kg ·{' '}
                  {submittedProfile.dietPreference}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onProceedToCheckout(submittedProfile)}
                className="flex-1 py-3 px-4 bg-[#F47716] hover:bg-[#FF9A32] hover:text-[#14110F] text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get My Diet Plan — ₹{priceInr}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-medium text-[#D6CFC7] rounded-lg transition-colors cursor-pointer"
              >
                Explore Website
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {/* Looking for: Weight Loss vs Weight Gain */}
            <div>
              <span className="block text-xs font-semibold text-[#D6CFC7] mb-1.5">
                Looking For <span className="text-[#F47716]">*</span>
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    { id: 'fatloss', label: 'Weight Loss / Fat Loss' },
                    { id: 'gain', label: 'Weight Gain / Muscle' },
                  ] as { id: GoalSlug; label: string }[]
                ).map((opt) => {
                  const active = goal === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGoal(opt.id)}
                      className={`px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center ${
                        active
                          ? 'bg-[#F47716] border-[#F47716] text-white'
                          : 'bg-[#0B0D0E] border-white/15 text-[#D6CFC7] hover:border-white/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="popup-name" className="block text-xs font-semibold text-[#D6CFC7] mb-1">
                  Full Name <span className="text-[#F47716]">*</span>
                </label>
                <input
                  id="popup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Apna poora naam"
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-sm text-white placeholder:text-[#78716A] focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                />
              </div>

              <div>
                <label htmlFor="popup-phone" className="block text-xs font-semibold text-[#D6CFC7] mb-1">
                  Phone Number (WhatsApp) <span className="text-[#F47716]">*</span>
                </label>
                <input
                  id="popup-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-sm text-white placeholder:text-[#78716A] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label htmlFor="popup-height" className="block text-[11px] sm:text-xs font-semibold text-[#D6CFC7] mb-1">
                  Height (cm) <span className="text-[#F47716]">*</span>
                </label>
                <input
                  id="popup-height"
                  type="number"
                  min={120}
                  max={230}
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="175"
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-2.5 py-2 text-sm text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                />
              </div>

              <div>
                <label htmlFor="popup-weight" className="block text-[11px] sm:text-xs font-semibold text-[#D6CFC7] mb-1">
                  Weight (kg) <span className="text-[#F47716]">*</span>
                </label>
                <input
                  id="popup-weight"
                  type="number"
                  min={30}
                  max={200}
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="72"
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-2.5 py-2 text-sm text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                />
              </div>

              <div>
                <label htmlFor="popup-age" className="block text-[11px] sm:text-xs font-semibold text-[#D6CFC7] mb-1">
                  Age <span className="text-[#F47716]">*</span>
                </label>
                <input
                  id="popup-age"
                  type="number"
                  min={14}
                  max={80}
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="24"
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-2.5 py-2 text-sm text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div>
                <label htmlFor="popup-gender" className="block text-xs font-semibold text-[#D6CFC7] mb-1">
                  Gender
                </label>
                <select
                  id="popup-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-2.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="popup-diet" className="block text-xs font-semibold text-[#D6CFC7] mb-1">
                  Diet Type
                </label>
                <select
                  id="popup-diet"
                  value={dietPreference}
                  onChange={(e) =>
                    setDietPreference(e.target.value as 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian')
                  }
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-2.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="popup-email" className="block text-xs font-semibold text-[#D6CFC7] mb-1">
                  Email (Optional)
                </label>
                <input
                  id="popup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-sm text-white placeholder:text-[#78716A] focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                />
              </div>
            </div>

            {error && <p className="text-xs font-medium text-red-400">{error}</p>}

            <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-5 text-sm font-semibold text-white bg-[#F47716] hover:bg-[#FF9A32] hover:text-[#14110F] disabled:opacity-60 rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{submitting ? 'Saving Profile...' : 'Submit Details'}</span>
                {!submitting && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 text-xs font-medium text-[#A6A09A] hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </form>
      )}
    </ModalTransition>
  );
}

