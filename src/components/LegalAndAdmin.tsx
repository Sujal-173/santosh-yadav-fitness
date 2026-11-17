import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Lock,
  LogOut,
  RefreshCw,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { GENERATED_IMAGES } from '../data/siteData';
import type { GoalSlug, ProductDto, SiteConfigDto } from '../types';

interface LegalPageProps {
  type: 'privacy-policy' | 'terms' | 'refund-policy';
  siteConfig: SiteConfigDto;
  onBackHome: () => void;
}

export function LegalPageView({ type, siteConfig, onBackHome }: LegalPageProps) {
  const titles = {
    'privacy-policy': 'Privacy Policy',
    terms: 'Terms & Conditions',
    'refund-policy': 'Digital Product Refund Policy',
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F5EBDD] text-[#211A15] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-black/10 p-6 sm:p-10 shadow-sm">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C544E] hover:text-[#211A15] mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Home</span>
        </button>

        <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-6">
          {titles[type]}
        </h1>

        {type === 'privacy-policy' && (
          <div className="space-y-4 text-sm sm:text-base text-[#3E3732] leading-relaxed">
            <p>
              <strong>{siteConfig.brandName}</strong> aapki privacy ko respect karta hai. Jab aap
              diet plan kharidte hain ya enquiry submit karte hain, hum sirf zaroori contact details
              (Naam, WhatsApp/Mobile number aur optional Email) collect karte hain.
            </p>
            <h2 className="text-lg font-bold text-[#211A15] pt-2">Data Ka Use</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Order verification, Razorpay payment tracking aur PDF download link delivery ke liye.</li>
              <li>Customer support requests (WhatsApp par meal-related help) solve karne ke liye.</li>
              <li>Hum aapka phone number ya personal details kisi third-party advertising agency ko sell ya share nahi karte.</li>
            </ul>
            <h2 className="text-lg font-bold text-[#211A15] pt-2">Payment Security</h2>
            <p>
              Sabhi payments Razorpay ke encrypted gateway par process hote hain. Hum kabhi bhi aapka
              card number, CVV ya UPI PIN store nahi karte.
            </p>
            <h2 className="text-lg font-bold text-[#211A15] pt-2">Data Deletion Request</h2>
            <p>
              Apna data delete ya update karwane ke liye aap{' '}
              <span className="font-semibold">{siteConfig.supportEmail}</span> par email ya WhatsApp
              kar sakte hain.
            </p>
          </div>
        )}

        {type === 'terms' && (
          <div className="space-y-4 text-sm sm:text-base text-[#3E3732] leading-relaxed">
            <p>
              Yeh website aur digital diet plans <strong>{siteConfig.brandName}</strong> dwara
              provide kiye jaate hain. Website use karne aur purchase karne se aap niche diye gaye
              terms se sehmat hote hain:
            </p>
            <h2 className="text-lg font-bold text-[#211A15] pt-2">1. General Nutrition Guidance</h2>
            <p>
              Fat Loss aur Weight Gain PDFs goal-based educational guides hain jo normal ghar ke
              khaane par based hain. Yeh kisi registered physician ki medical advice ya prescription
              ka substitute nahi hain.
            </p>
            <h2 className="text-lg font-bold text-[#211A15] pt-2">2. Personal Use License</h2>
            <p>
              Khareeda gaya PDF sirf aapke personal use ke liye hai. Bina permission ke iska
              commercial distribution, resale ya public upload allowed nahi hai.
            </p>
            <h2 className="text-lg font-bold text-[#211A15] pt-2">3. Results Disclaimer</h2>
            <p>
              Fitness results har vyakti ki age, lifestyle, neend aur daily consistency par depend
              karte hain; hum kisi fixed kg weight loss/gain ki medical guarantee nahi dete.
            </p>
          </div>
        )}

        {type === 'refund-policy' && (
          <div className="space-y-4 text-sm sm:text-base text-[#3E3732] leading-relaxed">
            <p>
              <strong>Digital Product Policy:</strong> Fat Loss Diet Plan aur Weight Gain Diet Plan
              instant downloadable digital PDF guides hain.
            </p>
            <p>
              Payment verify hone aur PDF download access issue hone ke baad{' '}
              <strong>refund ya return applicable nahi hai</strong>. Order place karne se pehle
              apna goal (Fat Loss ya Weight Gain) dhyan se select karein.
            </p>
            <h2 className="text-lg font-bold text-[#211A15] pt-2">
              Duplicate Payment ya Download Issue?
            </h2>
            <p>
              Agar technical issue ki wajah se do baar paise kat gaye ya download link open nahi ho
              raha, toh apna Order ID / Payment ID humare support email{' '}
              <span className="font-semibold">{siteConfig.supportEmail}</span> ya WhatsApp par
              bhejein — hum 24–48 working hours mein verify karke help karenge.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

interface AdminOverviewData {
  stats: {
    totalOrders: number;
    paidOrders: number;
    failedOrders: number;
    pendingOrders: number;
    totalRevenueInr: number;
    totalLeads: number;
  };
  products: ProductDto[];
  orders: Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    age?: number;
    gender?: string;
    heightCm?: number;
    weightKg?: number;
    dietPreference?: string;
    productId: GoalSlug;
    productName: string;
    razorpayOrderId: string;
    amountPaise: number;
    paymentStatus: string;
    createdAt: string;
  }>;
  payments: Array<{ id: string; razorpayPaymentId: string; razorpayOrderId: string; orderId: string; amountPaise: number; currency: string; method: string; status?: 'captured' | 'failed' | 'reported_failed'; captured: boolean; signatureVerified: boolean; createdAt: string }>;
  leads: Array<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    goal: GoalSlug;
    age?: number;
    gender?: string;
    heightCm?: number;
    weightKg?: number;
    dietPreference?: string;
    purchased: boolean;
    source: string;
    sheetSynced?: boolean;
    sheetSyncedAt?: string;
    sheetSyncError?: string;
    createdAt: string;
  }>;
  siteConfig: SiteConfigDto;
  googleSheetsConfig?: {
    sheetId: string;
    sheetTab: string;
    serviceAccountEmail: string;
    hasPrivateKey: boolean;
    appsScriptWebhookUrl: string;
    resolvedMode: 'sheets-api' | 'apps-script' | 'unconfigured';
    envConfigured: boolean;
  };
  auditLogs: Array<{ id: string; actor: string; action: string; timestamp: string }>;
}

interface AdminDashboardProps {
  onBackHome: () => void;
  onConfigUpdated: () => void;
}

export function AdminDashboardView({ onBackHome, onConfigUpdated }: AdminDashboardProps) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<'overview' | 'orders' | 'payments' | 'leads' | 'products' | 'sheets' | 'settings'>(
    'overview',
  );
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [leadGoalFilter, setLeadGoalFilter] = useState<'all' | GoalSlug>('all');
  const [statusNotice, setStatusNotice] = useState('');

  // Editable settings state
  const [settingsForm, setSettingsForm] = useState<SiteConfigDto | null>(null);

  // Google Sheets credentials form state
  const [sheetsForm, setSheetsForm] = useState({
    sheetId: '',
    sheetTab: 'Leads',
  });
  const [sheetsBusy, setSheetsBusy] = useState(false);

  const loadOverview = async () => {
    const res = await fetch('/api/admin/overview');
    if (res.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (res.ok) {
      const data = (await res.json()) as AdminOverviewData;
      setOverview(data);
      setSettingsForm(data.siteConfig);
      if (data.googleSheetsConfig) {
        setSheetsForm({
          sheetId: data.googleSheetsConfig.sheetId || '',
          sheetTab: data.googleSheetsConfig.sheetTab || 'Leads',
        });
      }
      setAuthenticated(true);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/session');
        const data = await res.json();
        if (data.authenticated) {
          await loadOverview();
        }
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(data.error || 'Login failed.');
      return;
    }
    await loadOverview();
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
    setOverview(null);
  };

  const handleUpdateProduct = async (product: ProductDto, newPriceInr: number, active: boolean) => {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceInr: newPriceInr, active }),
    });
    if (res.ok) {
      setStatusNotice(`${product.name} updated.`);
      await loadOverview();
      onConfigUpdated();
    }
  };

  const handleUploadPdf = async (productId: GoalSlug, file: File) => {
    if (file.type !== 'application/pdf') {
      setStatusNotice('Please select a valid PDF file.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setStatusNotice('PDF must be 3 MB or smaller for secure Vercel upload.');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setStatusNotice('PDF could not be read. Please try again.');
    reader.onload = async () => {
      const base64Pdf = String(reader.result || '');
      try {
        const res = await fetch(`/api/admin/products/${productId}/pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Pdf }),
        });
        if (res.ok) {
          setStatusNotice(`New PDF uploaded securely for ${productId}.`);
          await loadOverview();
        } else {
          const data = await res.json();
          setStatusNotice(data.error || 'PDF upload failed.');
        }
      } catch {
        setStatusNotice('PDF upload request failed. Check your connection and try again.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    const res = await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm),
    });
    if (res.ok) {
      setStatusNotice('Website settings & content saved.');
      await loadOverview();
      onConfigUpdated();
    }
  };

  const handleSaveGoogleSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSheetsBusy(true);
    try {
      const res = await fetch('/api/admin/google-sheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetsForm),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusNotice(`Google Sheets settings saved (Mode: ${data.resolvedMode}).`);
        await loadOverview();
      } else {
        setStatusNotice(data.error || 'Failed to save Google Sheets credentials.');
      }
    } finally {
      setSheetsBusy(false);
    }
  };

  const handleTestGoogleSheets = async () => {
    setSheetsBusy(true);
    try {
      const res = await fetch('/api/admin/google-sheets/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.synced) {
        setStatusNotice(`Connected cleanly to Google Sheet: "${data.sheetTitle || 'OK'}".`);
      } else {
        setStatusNotice(data.error || 'Google Sheets connection test failed.');
      }
      await loadOverview();
    } finally {
      setSheetsBusy(false);
    }
  };

  const handleSyncPendingLeads = async () => {
    setSheetsBusy(true);
    try {
      const res = await fetch('/api/admin/google-sheets/sync-pending', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatusNotice(
          `Synced ${data.syncedCount}/${data.attempted} pending leads and ${data.orderSyncedCount}/${data.ordersAttempted} payment rows.${
            data.lastError ? ` Last error: ${data.lastError}` : ''
          }`,
        );
        await loadOverview();
      } else {
        setStatusNotice(data.error || 'Google Sheets sync failed.');
      }
    } finally {
      setSheetsBusy(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#0B0D0E] text-white flex items-center justify-center">
        <p className="text-sm text-[#A6A09A]">Checking admin session...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#0B0D0E] text-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#141719] border border-white/15 rounded-2xl p-7 shadow-2xl">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs text-[#A6A09A] hover:text-white mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Storefront</span>
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <img
              src={GENERATED_IMAGES.brandEmblem}
              alt="Santosh Yadav Fitness emblem"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
            />
            <h1 className="text-xl font-bold">Admin Console Login</h1>
          </div>
          <p className="text-xs text-[#A6A09A] mb-5">
            Santosh Yadav Fitness private dashboard for orders, leads, PDFs, and content.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#D6CFC7] mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F47716]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D6CFC7] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F47716]"
              />
            </div>

            {loginError && <p className="text-xs text-red-400">{loginError}</p>}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#F47716] hover:bg-[#FF9A32] text-white font-semibold text-sm rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          </form>
        </div>
      </main>
    );
  }

  const filteredLeads =
    overview?.leads.filter((l) => (leadGoalFilter === 'all' ? true : l.goal === leadGoalFilter)) ||
    [];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#0B0D0E] text-[#F7F4EF] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs text-[#A6A09A]">
              Manage orders, Razorpay payments, leads, private PDFs, and storefront copy.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadOverview}
              className="px-3 py-2 text-xs font-medium bg-[#141719] border border-white/15 rounded-lg hover:bg-white/5 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 text-xs font-medium bg-[#141719] border border-white/15 rounded-lg hover:bg-red-500/15 hover:text-red-300 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {statusNotice && (
          <div className="mb-5 px-4 py-2.5 rounded-lg bg-[#1A2E20] border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between">
            <span>{statusNotice}</span>
            <button
              type="button"
              onClick={() => setStatusNotice('')}
              className="underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              { id: 'overview', label: 'Overview', icon: Shield },
              { id: 'orders', label: 'Orders', icon: FileText },
              { id: 'payments', label: 'Transactions', icon: CheckCircle2 },
              { id: 'leads', label: 'Leads', icon: Users },
              { id: 'products', label: 'Products & PDFs', icon: Download },
              { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
              { id: 'settings', label: 'Content & Settings', icon: Settings },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#F47716] text-white'
                    : 'bg-[#141719] text-[#A6A09A] border border-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {tab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Revenue', val: `₹${overview.stats.totalRevenueInr}` },
                { label: 'Paid Orders', val: String(overview.stats.paidOrders) },
                { label: 'Pending Orders', val: String(overview.stats.pendingOrders) },
                { label: 'Failed Orders', val: String(overview.stats.failedOrders) },
                { label: 'Total Leads', val: String(overview.stats.totalLeads) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#141719] border border-white/10 rounded-xl p-4"
                >
                  <div className="text-xs text-[#A6A09A] mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold tabular-nums text-white">{stat.val}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#141719] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-bold mb-3">Recent Admin Activity</h2>
              {overview.auditLogs.length === 0 ? (
                <p className="text-xs text-[#A6A09A]">No audit events yet.</p>
              ) : (
                <ul className="space-y-2 text-xs text-[#D6CFC7]">
                  {overview.auditLogs.slice(0, 8).map((log) => (
                    <li
                      key={log.id}
                      className="flex items-center justify-between gap-4 border-b border-white/5 pb-2"
                    >
                      <span>{log.action}</span>
                      <span className="text-[#A6A09A] tabular-nums">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === 'orders' && overview && (
          <div className="bg-[#141719] border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0B0D0E] text-[#A6A09A] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Profile</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {overview.orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#A6A09A]">
                      No orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  overview.orders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="px-4 py-3 font-semibold tabular-nums">{ord.id}</td>
                      <td className="px-4 py-3">
                        <div>{ord.customerName}</div>
                        <div className="text-xs text-[#A6A09A] tabular-nums">
                          {ord.customerPhone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#D6CFC7] tabular-nums">
                        {ord.age ? (
                          <div>
                            <div>
                              {ord.age}y · {ord.gender || '-'}
                            </div>
                            <div className="text-[#A6A09A]">
                              {ord.heightCm || '-'}cm · {ord.weightKg || '-'}kg ·{' '}
                              {ord.dietPreference || '-'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#A6A09A]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{ord.productName}</td>
                      <td className="px-4 py-3 tabular-nums">₹{ord.amountPaise / 100}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            ord.paymentStatus === 'paid'
                              ? 'text-emerald-400'
                              : ord.paymentStatus === 'failed'
                              ? 'text-red-400'
                              : 'text-amber-300'
                          }`}
                        >
                          {ord.paymentStatus === 'paid' && (
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span className="capitalize">{ord.paymentStatus}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#A6A09A] tabular-nums">
                        {new Date(ord.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payments' && overview && (
          <div className="bg-[#141719] border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0B0D0E] text-[#A6A09A] border-b border-white/10">
                <tr><th className="px-4 py-3">Payment ID</th><th className="px-4 py-3">Order ID</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Signature</th><th className="px-4 py-3">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {overview.payments.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-[#A6A09A]">No payment transactions recorded yet.</td></tr> : overview.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-semibold tabular-nums">{payment.razorpayPaymentId}</td>
                    <td className="px-4 py-3 tabular-nums">{payment.razorpayOrderId}</td>
                    <td className="px-4 py-3 tabular-nums">₹{(payment.amountPaise / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 uppercase">{payment.method}</td>
                    <td className={`px-4 py-3 font-semibold ${payment.captured ? 'text-emerald-400' : 'text-red-400'}`}>{payment.status === 'reported_failed' ? 'Customer reported failure' : payment.captured ? 'Completed' : 'Failed'}</td>
                    <td className="px-4 py-3">{payment.signatureVerified ? 'Verified' : 'Not verified'}</td>
                    <td className="px-4 py-3 text-xs text-[#A6A09A]">{new Date(payment.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'leads' && overview && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex gap-1 p-1 bg-[#141719] border border-white/10 rounded-lg">
                {(
                  [
                    { id: 'all', label: 'All Goals' },
                    { id: 'fatloss', label: 'Fat Loss' },
                    { id: 'gain', label: 'Weight Gain' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLeadGoalFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                      leadGoalFilter === f.id
                        ? 'bg-[#F47716] text-white'
                        : 'text-[#A6A09A] hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={sheetsBusy}
                  onClick={handleSyncPendingLeads}
                  className="px-4 py-2 text-xs font-semibold bg-[#141719] hover:bg-white/10 border border-white/15 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sync Pending to Sheet</span>
                </button>

                <a
                  href={`/api/admin/leads/export?goal=${leadGoalFilter}`}
                  className="px-4 py-2 text-xs font-semibold bg-[#F47716] hover:bg-[#FF9A32] text-white rounded-lg inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Export CSV</span>
                </a>
              </div>
            </div>

            <div className="bg-[#141719] border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#0B0D0E] text-[#A6A09A] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Goal</th>
                    <th className="px-4 py-3">Body Profile</th>
                    <th className="px-4 py-3">Purchased</th>
                    <th className="px-4 py-3">Google Sheet</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[#A6A09A]">
                        No leads captured yet.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-4 py-3 font-medium">
                          <div>{lead.name}</div>
                          <div className="text-[11px] text-[#A6A09A]">{lead.source}</div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{lead.phone}</td>
                        <td className="px-4 py-3 capitalize">{lead.goal}</td>
                        <td className="px-4 py-3 text-xs text-[#D6CFC7] tabular-nums">
                          {lead.age || lead.heightCm || lead.weightKg
                            ? `${lead.age || '-'}y · ${lead.gender || '-'} · ${lead.heightCm || '-'}cm · ${
                                lead.weightKg || '-'
                              }kg · ${lead.dietPreference || '-'}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {lead.purchased ? (
                            <span className="text-emerald-400 font-semibold">Paid</span>
                          ) : (
                            <span className="text-[#A6A09A]">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {lead.sheetSynced ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Synced</span>
                            </span>
                          ) : (
                            <span
                              title={lead.sheetSyncError || 'Not synced yet'}
                              className="text-amber-300 font-medium"
                            >
                              Pending Sync
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#A6A09A] tabular-nums">
                          {new Date(lead.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'products' && overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {overview.products.map((prod) => (
              <ProductAdminCard
                key={prod.id}
                product={prod}
                onSave={handleUpdateProduct}
                onUploadPdf={handleUploadPdf}
              />
            ))}
          </div>
        )}

        {tab === 'sheets' && overview && (
          <GoogleSheetsAdminPanel
            config={overview.googleSheetsConfig}
            form={sheetsForm}
            busy={sheetsBusy}
            onChange={setSheetsForm}
            onSave={handleSaveGoogleSheets}
            onTest={handleTestGoogleSheets}
            onSyncPending={handleSyncPendingLeads}
            onCopyNotice={(msg) => setStatusNotice(msg)}
          />
        )}

        {tab === 'settings' && settingsForm && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-[#141719] border border-white/10 rounded-xl p-6 space-y-4 max-w-2xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A6A09A] mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={settingsForm.whatsappNumber}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                  }
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A6A09A] mb-1">Support Email</label>
                <input
                  type="email"
                  value={settingsForm.supportEmail}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, supportEmail: e.target.value })
                  }
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A6A09A] mb-1">Instagram Count</label>
                <input
                  type="text"
                  value={settingsForm.instagramFollowers}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, instagramFollowers: e.target.value })
                  }
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A6A09A] mb-1">Total Audience</label>
                <input
                  type="text"
                  value={settingsForm.totalAudience}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, totalAudience: e.target.value })
                  }
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A6A09A] mb-1">YouTube Count</label>
                <input
                  type="text"
                  value={settingsForm.youtubeSubscribers}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, youtubeSubscribers: e.target.value })
                  }
                  className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
           
            <div>
              <label className="block text-xs text-[#A6A09A] mb-1">Hero Headline</label>
              <input
                type="text"
                value={settingsForm.heroHeadline}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })
                }
                className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-sm text-white"
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.maintenanceMode}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })
                }
                className="accent-[#F47716]"
              />
              <span>Enable Checkout Maintenance Mode</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F47716] hover:bg-[#FF9A32] text-white font-semibold text-sm rounded-lg cursor-pointer"
            >
              Save Settings
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function ProductAdminCard({
  product,
  onSave,
  onUploadPdf,
}: {
  product: ProductDto;
  onSave: (product: ProductDto, priceInr: number, active: boolean) => Promise<void>;
  onUploadPdf: (productId: GoalSlug, file: File) => Promise<void>;
}) {
  const [priceInr, setPriceInr] = useState(Math.round(product.pricePaise / 100));
  const [active, setActive] = useState(product.active);

  return (
    <div className="bg-[#141719] border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">{product.name}</h3>
        <span className="text-xs text-[#A6A09A]">{product.pdfFilename}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#A6A09A] mb-1">Price (INR ₹)</label>
          <input
            type="number"
            min={1}
            value={priceInr}
            onChange={(e) => setPriceInr(Number(e.target.value))}
            className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-sm text-white tabular-nums"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="accent-[#F47716]"
            />
            <span>Active for Purchase</span>
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSave(product, priceInr, active)}
        className="w-full py-2 px-4 bg-[#F47716] hover:bg-[#FF9A32] text-white text-xs font-semibold rounded-lg cursor-pointer"
      >
        Save Price &amp; Status
      </button>

      <div className="pt-3 border-t border-white/10">
        <label className="block text-xs text-[#A6A09A] mb-1.5">
          Replace Private PDF File
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadPdf(product.id, file);
          }}
          className="text-xs text-[#D6CFC7] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
        />
      </div>
    </div>
  );
}

const APPS_SCRIPT_SNIPPET = `function doPost(e) {
  var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var isPayment = data.recordType === 'payment';
  var tabName = isPayment ? 'Payments' : (data.sheetTab || 'Leads');
  var sheet = spreadsheet.getSheetByName(tabName);
  if (!sheet && isPayment) {
    sheet = spreadsheet.insertSheet(tabName);
  }
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: 'Tab "' + tabName + '" was not found in the spreadsheet.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var leadHeaders = [
    'Lead ID','Created At','Name','Phone','Email','Goal','Age','Gender',
    'Height (cm)','Weight (kg)','Diet Type','Status','Source'
  ];
  var paymentHeaders = [
    'Order ID','Razorpay Order ID','Payment ID','Buyer Name','Mobile Number',
    'Email','Plan Purchased','Amount (INR)','Payment Status','Order Status',
    'Latest Attempt','Payment Method','Order Time (IST)','Payment Time (IST)',
    'Attempt Time (IST)'
  ];
  var headers = isPayment ? paymentHeaders : leadHeaders;
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  if (isPayment && !data.test) {
    if (!Array.isArray(data.values) || data.values.length !== paymentHeaders.length || !data.orderId) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'Payment row is missing required values.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    var orderIds = sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().map(function(row) { return row[0]; })
      : [];
    var existingIndex = orderIds.indexOf(String(data.orderId));
    if (existingIndex >= 0) {
      sheet.getRange(existingIndex + 2, 1, 1, paymentHeaders.length).setValues([data.values]);
    } else {
      sheet.appendRow(data.values);
    }
  } else if (!data.test) {
    sheet.appendRow([
      data.id || '', data.createdAt || '', data.name || '', data.phone || '',
      data.email || '', data.goal || '', data.age || '', data.gender || '',
      data.heightCm || '', data.weightKg || '', data.dietPreference || '',
      data.purchased || 'New Lead', data.source || ''
    ]);
  }
  formatSheet(sheet, isPayment);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function formatSheet(sheet, isPayment) {
  var columnCount = isPayment ? 15 : 13;
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  sheet.setRowHeight(1, 46);
  if (sheet.getMaxRows() > 1) {
    sheet.setRowHeights(2, sheet.getMaxRows() - 1, 38);
  }

  sheet.autoResizeColumns(1, columnCount);
  var leadColumnBounds = [
    [190, 230], [150, 190], [140, 190], [120, 150], [190, 260],
    [105, 140], [65, 85], [90, 120], [100, 130], [100, 130],
    [140, 200], [110, 140], [120, 180]
  ];
  var paymentColumnBounds = [
    [130, 170], [170, 210], [165, 205], [145, 185], [125, 155],
    [190, 250], [145, 185], [120, 155], [125, 165], [115, 150],
    [165, 205], [130, 160], [185, 225], [185, 225], [185, 225]
  ];
  var columnBounds = isPayment ? paymentColumnBounds : leadColumnBounds;
  columnBounds.forEach(function(bounds, index) {
    var width = sheet.getColumnWidth(index + 1);
    sheet.setColumnWidth(index + 1, Math.max(bounds[0], Math.min(width, bounds[1])));
  });

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, sheet.getMaxRows(), columnCount).createFilter();
  }
  if (sheet.getBandings().length === 0) {
    var banding = sheet.getRange(1, 1, sheet.getMaxRows(), columnCount).applyRowBanding();
    banding
      .setHeaderRowColor('#172b4d')
      .setFirstRowColor('#ffffff')
      .setSecondRowColor('#f5f7fb');
  }

  if (sheet.getMaxRows() > 1) {
    var body = sheet.getRange(2, 1, sheet.getMaxRows() - 1, columnCount);
    body
      .setFontFamily('Arial')
      .setFontSize(10)
      .setFontColor('#2e374a')
      .setVerticalAlignment('middle')
      .setWrap(true);
    if (isPayment) {
      sheet.getRange(2, 7, sheet.getMaxRows() - 1, 1).setHorizontalAlignment('center');
      sheet.getRange(2, 9, sheet.getMaxRows() - 1, 4)
        .setBackground('#fff1df')
        .setFontColor('#8c3d12')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
      sheet.getRange(2, 8, sheet.getMaxRows() - 1, 1)
        .setNumberFormat('₹#,##,##0.00')
        .setHorizontalAlignment('right');
    } else {
      sheet.getRange(2, 6, sheet.getMaxRows() - 1, 5).setHorizontalAlignment('center');
      sheet.getRange(2, 12, sheet.getMaxRows() - 1, 1)
        .setBackground('#fff1df')
        .setFontColor('#8c3d12')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
    }
  }

  var header = sheet.getRange(1, 1, 1, columnCount);
  header
    .setBackground('#172b4d')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setFontFamily('Arial')
    .setFontSize(11)
    .setBorder(null, null, true, null, false, false, '#f47716', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}`;

function GoogleSheetsAdminPanel({
  config,
  form,
  busy,
  onChange,
  onSave,
  onTest,
  onSyncPending,
  onCopyNotice,
}: {
  config: AdminOverviewData['googleSheetsConfig'];
  form: {
    sheetId: string;
    sheetTab: string;
  };
  busy: boolean;
  onChange: (next: {
    sheetId: string;
    sheetTab: string;
  }) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onTest: () => Promise<void>;
  onSyncPending: () => Promise<void>;
  onCopyNotice: (msg: string) => void;
}) {
  const modeLabel =
    config?.resolvedMode === 'sheets-api'
      ? 'Google Sheets API v4 (Service Account)'
      : config?.resolvedMode === 'apps-script'
      ? 'Google Apps Script Webhook'
      : 'Not Configured Yet';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form
        onSubmit={onSave}
        className="lg:col-span-7 bg-[#141719] border border-white/10 rounded-xl p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white">Google Spreadsheet Lead Sync</h2>
            <p className="text-xs text-[#A6A09A] mt-0.5">
              Entry popup aur checkout ke saare leads automatically is sheet mein append honge.
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
              config?.resolvedMode === 'unconfigured'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {modeLabel}
          </span>
        </div>

        <div className="text-xs text-[#C7BFB7] bg-[#0B0D0E] border border-white/10 rounded-lg p-3.5 leading-relaxed">
          <strong className="text-white">Backend credentials:</strong>{' '}
          {config?.envConfigured ? (
            <span className="text-emerald-400 font-semibold">Detected in the server environment</span>
          ) : (
            <span className="text-amber-300 font-semibold">Not configured</span>
          )}{' '}
          — This panel saves only the Sheet ID and tab name. Set the service-account email and private
          key, or the Apps Script webhook URL, in Vercel Project Settings → Environment Variables,
          then redeploy. Secrets are not stored in MongoDB.
        </div>

        <div className="space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F47716]">
            Option A — Google Service Account (Sheets API v4)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-[#A6A09A] mb-1">
                Google Sheet ID (<code>GOOGLE_SHEET_ID</code>)
              </label>
              <input
                type="text"
                value={form.sheetId}
                onChange={(e) => onChange({ ...form, sheetId: e.target.value })}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-xs sm:text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A6A09A] mb-1">
                Tab Name (<code>GOOGLE_SHEET_TAB</code>)
              </label>
              <input
                type="text"
                value={form.sheetTab}
                onChange={(e) => onChange({ ...form, sheetTab: e.target.value })}
                placeholder="Leads"
                className="w-full rounded-lg bg-[#0B0D0E] border border-white/15 px-3 py-2 text-xs sm:text-sm text-white"
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0B0D0E] p-3 text-xs text-[#BDB5AD] leading-relaxed">
            Set <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> and{' '}
            <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code> in the backend environment. Share the
            spreadsheet with that service-account email as an Editor.{' '}
            {config?.hasPrivateKey
              ? 'A service-account key is available to the backend.'
              : 'No service-account key is currently available to the backend.'}
          </div>
        </div>

        <div className="space-y-2.5 pt-3 border-t border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F47716]">
            Option B — Google Apps Script Webhook (Easiest Zero-GCP Setup)
          </h3>
          <p className="text-xs text-[#BDB5AD] leading-relaxed">
            Set <code>GOOGLE_APPS_SCRIPT_WEBHOOK_URL</code> in Vercel Environment Variables instead of
            entering it here. Redeploy after changing the URL.
          </p>
          <p className="text-xs text-[#BDB5AD] leading-relaxed">
            Lead records use the configured tab. Payment rows are upserted into a separate{' '}
            <strong>Payments</strong> tab with INR amounts and Asia/Kolkata timestamps. The generated
            script creates and formats that tab on the first payment sync. After updating the script,
            save it and deploy a new web app version.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 bg-[#F47716] hover:bg-[#FF9A32] text-white font-semibold text-xs sm:text-sm rounded-lg cursor-pointer disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Save Sheet Settings'}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onTest}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-xs sm:text-sm rounded-lg cursor-pointer disabled:opacity-60"
          >
            Test Connection
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onSyncPending}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-xs sm:text-sm rounded-lg cursor-pointer disabled:opacity-60"
          >
            Sync Leads &amp; Payments
          </button>
        </div>
      </form>

      <div className="lg:col-span-5 bg-[#141719] border border-white/10 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Quick Google Apps Script Code</h3>
        <ol className="list-decimal pl-4 space-y-1.5 text-xs text-[#BDB5AD] leading-relaxed">
          <li>Apni Google Sheet kholo aur menu mein <strong>Extensions → Apps Script</strong> click karo.</li>
          <li>Niche diya code paste karke Save karo.</li>
          <li>
            <strong>Deploy → New deployment → Web app</strong> select karo (Who has access:{' '}
            <strong>Anyone</strong>).
          </li>
          <li>Web app URL ko Vercel Environment Variables mein <code>GOOGLE_APPS_SCRIPT_WEBHOOK_URL</code> ke naam se set karke redeploy karo.</li>
        </ol>

        <div className="relative">
          <pre className="bg-[#0B0D0E] border border-white/10 rounded-lg p-3 text-[11px] text-[#D6CFC7] overflow-x-auto leading-relaxed">
            {APPS_SCRIPT_SNIPPET}
          </pre>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(APPS_SCRIPT_SNIPPET);
              onCopyNotice('Apps Script code copied to clipboard.');
            }}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Copy Apps Script Code</span>
          </button>
        </div>
      </div>
    </div>
  );
}

