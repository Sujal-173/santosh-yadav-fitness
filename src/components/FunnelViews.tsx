import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Lock,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { GENERATED_IMAGES } from '../data/siteData';
import type {
  GoalSlug,
  LeadPrefillProfile,
  OrderCreateResponse,
  PaymentVerifiedState,
  ProductDto,
  SiteConfigDto,
} from '../types';
import { SandboxRazorpayModal } from './Modals';
import { EASE_OUT_EXPO } from './MotionPrimitives';
import { ResilientImage } from './ResilientImage';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (res: { error?: { description?: string } }) => void) => void;
    };
  }
}

interface CheckoutViewProps {
  siteConfig: SiteConfigDto;
  products: ProductDto[];
  selectedGoal: GoalSlug;
  initialProfile?: LeadPrefillProfile | null;
  onSelectGoal: (goal: GoalSlug) => void;
  onPaymentSuccess: (result: PaymentVerifiedState) => void;
  onPaymentFailed: (reason: string, orderId?: string) => void;
  onBackHome: () => void;
}

export function CheckoutView({
  siteConfig,
  products,
  selectedGoal,
  initialProfile,
  onSelectGoal,
  onPaymentSuccess,
  onPaymentFailed,
  onBackHome,
}: CheckoutViewProps) {
  const [name, setName] = useState(initialProfile?.name || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [age, setAge] = useState(initialProfile?.age || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(initialProfile?.gender || 'Male');
  const [heightCm, setHeightCm] = useState(initialProfile?.heightCm || '');
  const [weightKg, setWeightKg] = useState(initialProfile?.weightKg || '');
  const [dietPreference, setDietPreference] = useState<'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian'>(
    initialProfile?.dietPreference || 'Vegetarian',
  );
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active server-created Razorpay order for sandbox modal when live keys aren't set
  const [sandboxOrder, setSandboxOrder] = useState<OrderCreateResponse | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedGoal) || products[0];
  const priceInr = Math.round((selectedProduct?.pricePaise || 0) / 100);

  const verifyWithBackend = async (params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    method: string;
  }) => {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.verified) {
      setSandboxOrder(null);
      onPaymentFailed(
        data.error || 'Payment verify nahi ho paya. Kripya support se contact karein.',
        params.orderId,
      );
      return;
    }

    setSandboxOrder(null);
    onPaymentSuccess({
      orderId: data.orderId,
      paymentId: data.paymentId,
      productId: data.productId,
      productName: data.productName,
      downloadToken: data.downloadToken,
      customerName: name.trim(),
      customerPhone: phone.trim(),
    });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim();
    const ageNum = Number(age);
    const heightNum = Number(heightCm);
    const weightNum = Number(weightKg);

    if (cleanName.length < 2) {
      setFormError('Kripya apna poora naam daalo.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Sahi 10-digit Indian WhatsApp mobile number daalo.');
      return;
    }
    if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setFormError('Email format sahi nahi hai.');
      return;
    }
    if (!ageNum || ageNum < 14 || ageNum > 80) {
      setFormError('Age 14 se 80 saal ke beech daalo.');
      return;
    }
    if (!heightNum || heightNum < 120 || heightNum > 230) {
      setFormError('Height 120 se 230 cm ke beech daalo.');
      return;
    }
    if (!weightNum || weightNum < 30 || weightNum > 200) {
      setFormError('Weight 30 se 200 kg ke beech daalo.');
      return;
    }
    if (!consentAccepted) {
      setFormError('Order confirmation aur PDF delivery ke liye checkbox tick karein.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          goal: selectedGoal,
          age: ageNum,
          gender,
          heightCm: heightNum,
          weightKg: weightNum,
          dietPreference,
          consentAccepted,
          source: window.location.search.slice(1) || 'checkout',
        }),
      });

      const orderData = (await res.json()) as OrderCreateResponse & { error?: string };
      if (!res.ok) {
        setFormError(orderData.error || 'Order create karne mein problem aayi.');
        setSubmitting(false);
        return;
      }

      if (orderData.mode === 'razorpay' && orderData.keyId && window.Razorpay) {
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amountPaise,
          currency: orderData.currency,
          name: siteConfig.brandName,
          description: orderData.productName,
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: cleanName,
            contact: cleanPhone,
            email: cleanEmail || undefined,
          },
          theme: { color: '#F47716' },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            await verifyWithBackend({
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              method: 'razorpay',
            });
          },
          modal: {
            ondismiss: async () => {
              await fetch('/api/payments/fail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderData.orderId }),
              });
              onPaymentFailed('Aapne checkout band kar diya.', orderData.orderId);
            },
          },
        });

        rzp.on('payment.failed', async (failRes) => {
          await fetch('/api/payments/fail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderData.orderId }),
          });
          onPaymentFailed(
            failRes.error?.description || 'Payment failed. Dubara try karein.',
            orderData.orderId,
          );
        });

        rzp.open();
        setSubmitting(false);
        return;
      }

      // Sandbox test checkout when RAZORPAY_KEY_ID is not yet configured
      setSandboxOrder(orderData);
      setSubmitting(false);
    } catch {
      setFormError('Network error. Internet check karke dobara try karein.');
      setSubmitting(false);
    }
  };

  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#0B0D0E] flex items-stretch">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
        className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
      >
        {/* Left Portrait (properly framed for mobile & desktop) */}
        <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-white/10 w-full max-w-[300px] sm:max-w-sm mx-auto aspect-[3/4] lg:max-w-none lg:aspect-auto lg:min-h-[560px]">
          <ResilientImage
            src={GENERATED_IMAGES.formShaker}
            alt="Santosh Yadav gym portrait"
            className="w-full h-full object-cover object-[50%_10%]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0D0E] via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F47716] mb-1">
              Santosh Yadav Fitness
            </p>
            <p className="text-sm sm:text-lg font-bold leading-snug">
              Ghar ke khaane aur simple Hinglish plan ke saath aaj shuru karo.
            </p>
          </div>
        </div>

        {/* Right Form & Order Review */}
        <div className="lg:col-span-7 flex items-center">
          <div className="w-full bg-white text-[#211A15] rounded-2xl p-6 sm:p-8 shadow-2xl border border-black/10">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C544E] hover:text-[#211A15] mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Home</span>
            </button>

            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#211A15] mb-1">
              Get Your Diet Plan
            </h1>
            <p className="text-sm text-[#5C544E] mb-6">
              Apni details bharo aur Razorpay par secure payment karo.
            </p>

            <form onSubmit={handleCheckoutSubmit} noValidate className="space-y-4">
              {/* Goal Selector */}
              <div>
                <span className="block text-xs font-semibold text-[#35302C] mb-2">
                  Your Goal <span className="text-[#F47716]">*</span>
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: 'fatloss', label: 'Fat Loss' },
                      { id: 'gain', label: 'Weight Gain' },
                    ] as { id: GoalSlug; label: string }[]
                  ).map((opt) => {
                    const active = selectedGoal === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelectGoal(opt.id)}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#F47716] border-[#F47716] text-white'
                            : 'bg-white border-black/15 text-[#35302C] hover:border-black/30'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            active ? 'border-white' : 'border-[#8A8078]'
                          }`}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block text-xs font-semibold text-[#35302C] mb-1.5"
                  >
                    Full Name <span className="text-[#F47716]">*</span>
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm text-[#211A15] focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block text-xs font-semibold text-[#35302C] mb-1.5"
                  >
                    Phone Number (WhatsApp) <span className="text-[#F47716]">*</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm text-[#211A15] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label
                    htmlFor="checkout-age"
                    className="block text-[11px] sm:text-xs font-semibold text-[#35302C] mb-1.5"
                  >
                    Age <span className="text-[#F47716]">*</span>
                  </label>
                  <input
                    id="checkout-age"
                    type="number"
                    min={14}
                    max={80}
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="24"
                    className="w-full rounded-lg border border-black/15 px-2.5 sm:px-3 py-2.5 text-sm text-[#211A15] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-gender"
                    className="block text-[11px] sm:text-xs font-semibold text-[#35302C] mb-1.5"
                  >
                    Gender <span className="text-[#F47716]">*</span>
                  </label>
                  <select
                    id="checkout-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                    className="w-full rounded-lg border border-black/15 bg-white px-2 sm:px-3 py-2.5 text-sm text-[#211A15] focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="checkout-height"
                    className="block text-[11px] sm:text-xs font-semibold text-[#35302C] mb-1.5 whitespace-nowrap"
                  >
                    Height (cm) <span className="text-[#F47716]">*</span>
                  </label>
                  <input
                    id="checkout-height"
                    type="number"
                    min={120}
                    max={230}
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="175"
                    className="w-full rounded-lg border border-black/15 px-2.5 sm:px-3 py-2.5 text-sm text-[#211A15] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="checkout-weight"
                    className="block text-xs font-semibold text-[#35302C] mb-1.5"
                  >
                    Weight (kg) <span className="text-[#F47716]">*</span>
                  </label>
                  <input
                    id="checkout-weight"
                    type="number"
                    min={30}
                    max={200}
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="72"
                    className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm text-[#211A15] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-diet-pref"
                    className="block text-xs font-semibold text-[#35302C] mb-1.5"
                  >
                    Diet Type <span className="text-[#F47716]">*</span>
                  </label>
                  <select
                    id="checkout-diet-pref"
                    value={dietPreference}
                    onChange={(e) =>
                      setDietPreference(
                        e.target.value as 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian',
                      )
                    }
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-[#211A15] focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="checkout-email"
                    className="block text-xs font-semibold text-[#35302C] mb-1.5"
                  >
                    Email (Optional)
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm text-[#211A15] focus:outline-none focus:ring-2 focus:ring-[#F47716]"
                  />
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="bg-[#FAF6F0] border border-black/8 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-[#211A15]">
                    {selectedProduct?.name || 'Diet Plan PDF'}
                  </div>
                  <div className="text-xs text-[#6B625B]">
                    Goal-based Hinglish PDF · Instant Download
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-[#211A15] tabular-nums">
                  ₹{priceInr}
                </div>
              </div>

              {/* Consent */}
              <label className="flex items-start gap-2.5 text-xs text-[#5C544E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 accent-[#F47716]"
                />
                <span>
                  Main samajhta hoon ki yeh ek digital goal-based guide PDF hai (no refund policy)
                  aur meri details sirf order delivery aur WhatsApp support ke liye use hongi.
                </span>
              </label>

              {formError && <p className="text-xs font-medium text-red-600">{formError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 text-sm sm:text-base font-semibold text-white bg-[#F47716] hover:bg-[#FF9A32] hover:text-[#14110F] disabled:opacity-70 rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>
                  {submitting ? 'Creating Secure Order...' : `Proceed to Pay — ₹${priceInr}`}
                </span>
                {!submitting && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      {sandboxOrder && (
        <SandboxRazorpayModal
          open={Boolean(sandboxOrder)}
          orderId={sandboxOrder.orderId}
          razorpayOrderId={sandboxOrder.razorpayOrderId}
          productName={sandboxOrder.productName}
          amountInr={Math.round(sandboxOrder.amountPaise / 100)}
          customerName={name.trim()}
          customerPhone={phone.trim()}
          onSuccessVerify={async ({ razorpayPaymentId, razorpaySignature, method }) => {
            await verifyWithBackend({
              orderId: sandboxOrder.orderId,
              razorpayOrderId: sandboxOrder.razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature,
              method,
            });
          }}
          onFailPayment={async (reason) => {
            await fetch('/api/payments/fail', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: sandboxOrder.orderId }),
            });
            const failedOrderId = sandboxOrder.orderId;
            setSandboxOrder(null);
            onPaymentFailed(reason, failedOrderId);
          }}
          onDismiss={async () => {
            await fetch('/api/payments/fail', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: sandboxOrder.orderId }),
            });
            const cancelledOrderId = sandboxOrder.orderId;
            setSandboxOrder(null);
            onPaymentFailed('Payment cancel kiya gaya. Aap dubara try kar sakte ho.', cancelledOrderId);
          }}
        />
      )}
    </main>
  );
}

interface PaymentSuccessViewProps {
  siteConfig: SiteConfigDto;
  result: PaymentVerifiedState;
  onBackHome: () => void;
}

export function PaymentSuccessView({
  siteConfig,
  result,
  onBackHome,
}: PaymentSuccessViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [downloaded, setDownloaded] = useState(false);

  const downloadUrl = `/api/downloads/${result.downloadToken}`;
  const waSupportUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    `Hi! Maine ${result.productName} kharida hai.\nOrder ID: ${result.orderId}\nPayment ID: ${result.paymentId}\nNaam: ${result.customerName}`,
  )}`;

  return (
    <main className="relative min-h-[calc(100vh-4rem)] bg-[#0B0D0E] text-white flex items-center py-12 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0">
        <ResilientImage
          src={GENERATED_IMAGES.paymentSuccessBg}
          alt="Gym weights atmospheric background"
          className="w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-[#0B0D0E]/75" />
      </div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        className="relative z-10 max-w-2xl mx-auto w-full text-center"
      >
        <motion.div
          initial={shouldReduceMotion ? false : { scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.08, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#22A84D] text-white shadow-xl shadow-[#22A84D]/30 mb-6"
        >
          <Check className="w-8 h-8 stroke-[3]" aria-hidden="true" />
        </motion.div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight mb-3">
          Payment Successful!
        </h1>
        <p className="text-base sm:text-lg text-[#DFD7CF] mb-8">
          Shukriya <span className="font-semibold text-white">{result.customerName}</span>! Aapka{' '}
          <span className="font-semibold text-white">{result.productName}</span> ab download ke
          liye ready hai.
        </p>

        <div className="flex flex-col items-center gap-3 mb-9">
          <a
            href={downloadUrl}
            onClick={() => setDownloaded(true)}
            className="inline-flex items-center gap-2.5 px-7 py-4 text-base font-semibold text-white bg-[#F47716] hover:bg-[#FF9A32] hover:text-[#14110F] rounded-lg shadow-xl shadow-[#F47716]/25 transition-colors"
          >
            <Download className="w-5 h-5" aria-hidden="true" />
            <span>
              {downloaded ? 'Download Diet Plan Again (PDF)' : 'Download Diet Plan (PDF)'}
            </span>
          </a>

          {downloaded && (
            <p className="text-xs font-medium text-[#5AE082]">
              Secure PDF download shuru ho gaya hai!
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
          <div className="bg-[#F5EBDD] text-[#211A15] rounded-xl px-4 py-3.5 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#22A84D] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-xs font-bold">Order ID</div>
              <div className="text-xs text-[#5C544E] tabular-nums">#{result.orderId}</div>
            </div>
          </div>

          <div className="bg-[#F5EBDD] text-[#211A15] rounded-xl px-4 py-3.5 flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-[#F47716] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-xs font-bold">Plan Verified</div>
              <div className="text-xs text-[#5C544E]">{result.productName}</div>
            </div>
          </div>

          <a
            href={waSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F5EBDD] hover:bg-white text-[#211A15] rounded-xl px-4 py-3.5 flex items-start gap-2.5 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#22A84D] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-xs font-bold">Koi sawaal hai?</div>
              <div className="text-xs text-[#5C544E] underline underline-offset-2">
                WhatsApp Support
              </div>
            </div>
          </a>
        </div>

        <button
          type="button"
          onClick={onBackHome}
          className="mt-8 text-xs font-semibold text-[#C4BCB4] hover:text-white underline underline-offset-4 cursor-pointer"
        >
          Return to Santosh Yadav Fitness Home
        </button>
      </motion.div>
    </main>
  );
}

interface PaymentFailedViewProps {
  siteConfig: SiteConfigDto;
  reason: string;
  orderId?: string;
  onRetry: () => void;
  onBackHome: () => void;
}

export function PaymentFailedView({
  siteConfig,
  reason,
  orderId,
  onRetry,
  onBackHome,
}: PaymentFailedViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const waSupportUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    `Hi! Mera payment fail/cancel ho gaya.${orderId ? ` Order ID: ${orderId}` : ''}`,
  )}`;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#0B0D0E] text-white flex items-center justify-center px-4 py-12">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
        className="max-w-md w-full bg-[#141719] border border-white/15 rounded-2xl p-7 text-center shadow-2xl"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 mb-5">
          <AlertTriangle className="w-7 h-7" aria-hidden="true" />
        </div>

        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2 text-balance">
          Payment Complete Nahi Hua
        </h1>
        <p className="text-sm text-[#A6A09A] leading-relaxed mb-6">{reason}</p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onRetry}
            className="w-full py-3 px-5 bg-[#F47716] hover:bg-[#FF9A32] active:scale-[0.99] text-white font-semibold text-sm rounded-lg inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry Payment</span>
          </button>

          <a
            href={waSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-5 bg-[#22A84D] hover:bg-[#1C8E40] active:scale-[0.99] text-white font-semibold text-sm rounded-lg inline-flex items-center justify-center gap-2 transition-all duration-150"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            <span>WhatsApp Support</span>
          </a>

          <button
            type="button"
            onClick={onBackHome}
            className="text-xs text-[#A6A09A] hover:text-white underline underline-offset-4 pt-2 cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </main>
  );
}
