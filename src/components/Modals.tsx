import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  Lock,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
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
        Apna Order ID (ya Razorpay Payment ID) aur registered 10-digit WhatsApp number daalkar
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

interface SandboxRazorpayModalProps {
  open: boolean;
  orderId: string;
  razorpayOrderId: string;
  productName: string;
  amountInr: number;
  customerName: string;
  customerPhone: string;
  onSuccessVerify: (payload: {
    razorpayPaymentId: string;
    razorpaySignature: string;
    method: string;
  }) => Promise<void>;
  onFailPayment: (reason: string) => void;
  onDismiss: () => void;
}

export function SandboxRazorpayModal({
  open,
  orderId,
  razorpayOrderId,
  productName,
  amountInr,
  customerName,
  customerPhone,
  onSuccessVerify,
  onFailPayment,
  onDismiss,
}: SandboxRazorpayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [submitting, setSubmitting] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const handleConfirmTestSuccess = async () => {
    setSubmitting(true);
    setLocalErr('');
    try {
      const res = await fetch('/api/payments/sandbox-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalErr(data.error || 'Sandbox signing failed');
        setSubmitting(false);
        return;
      }
      await onSuccessVerify({
        razorpayPaymentId: data.razorpayPaymentId,
        razorpaySignature: data.razorpaySignature,
        method: selectedMethod,
      });
    } catch {
      setLocalErr('Network error verifying test payment.');
      setSubmitting(false);
    }
  };

  return (
    <ModalTransition
      open={open}
      ariaLabelledBy="sandbox-rzp-title"
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      panelClassName="w-full max-w-md bg-white text-[#211A15] rounded-2xl overflow-hidden shadow-2xl border border-black/15"
    >
        {/* Razorpay Header */}
        <div className="bg-[#072654] text-white px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">
              Razorpay Test Sandbox
            </div>
            <h3 id="sandbox-rzp-title" className="text-base font-bold">
              Santosh Yadav Fitness
            </h3>
            <p className="text-xs text-blue-100">
              {productName} · Order #{orderId}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-extrabold tabular-nums">₹{amountInr}</div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Cancel checkout"
              className="text-xs text-blue-200 hover:text-white underline mt-0.5 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Test Mode Active:</strong> Live Razorpay keys abhi `.env` mein set nahi
              hain. Yeh modal real HMAC SHA-256 server signature verification &amp; token flow test
              karne ke liye hai.
            </span>
          </div>

          <div className="text-xs text-[#5C544E] bg-[#FAF7F3] rounded-lg px-3.5 py-2.5 border border-black/8">
            Paying as <strong className="text-[#211A15]">{customerName}</strong> ({customerPhone})
          </div>

          <div className="space-y-2">
            {(
              [
                { id: 'upi', label: 'UPI (GPay, PhonePe, Paytm)', icon: Smartphone },
                { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                { id: 'netbanking', label: 'Net Banking', icon: Building2 },
                { id: 'wallet', label: 'Wallets', icon: Wallet },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const active = selectedMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedMethod(opt.id)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-left flex items-center gap-3 text-sm font-medium cursor-pointer transition-colors ${
                    active
                      ? 'border-[#072654] bg-blue-50/70 text-[#072654]'
                      : 'border-black/10 hover:border-black/25'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {localErr && <p className="text-xs text-red-600">{localErr}</p>}

          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmTestSuccess}
              className="w-full py-3 px-4 bg-[#F47716] hover:bg-[#FF9A32] text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>
                {submitting ? 'Verifying Signature...' : `Pay ₹${amountInr} (Test Success)`}
              </span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => onFailPayment('Test payment failed or declined by user.')}
              className="w-full py-2 px-4 border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Simulate Payment Failure
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#7A7169]">
            <Lock className="w-3 h-3" aria-hidden="true" />
            <span>Server-verified HMAC SHA-256 · Razorpay Order {razorpayOrderId}</span>
          </div>
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

