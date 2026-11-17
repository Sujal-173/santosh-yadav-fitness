import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { persistStoreSnapshot, readPersistedStore } from './database';

export type GoalSlug = 'fatloss' | 'gain';

export interface ProductRecord {
  id: GoalSlug;
  slug: string;
  name: string;
  description: string;
  pricePaise: number;
  active: boolean;
  pdfFilename: string;
  updatedAt: string;
}

export interface LeadRecord {
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
  consentAccepted: boolean;
  source: string;
  purchased: boolean;
  sheetSynced?: boolean;
  sheetSyncedAt?: string;
  sheetSyncError?: string;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  dietPreference?: string;
  productId: GoalSlug;
  productName: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: 'INR';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'created' | 'completed' | 'failed';
  createdAt: string;
  paidAt?: string;
}

export interface PaymentRecord {
  id: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  orderId: string;
  amountPaise: number;
  currency: 'INR';
  method: string;
  status?: 'captured' | 'failed' | 'reported_failed';
  captured: boolean;
  signatureVerified: boolean;
  webhookEventId?: string;
  createdAt: string;
}

export interface DownloadTokenRecord {
  tokenHash: string;
  orderId: string;
  productId: GoalSlug;
  expiresAt: string;
  downloadCount: number;
  maxDownloads: number;
  revoked: boolean;
  createdAt: string;
}

export interface SiteConfigRecord {
  brandName: string;
  whatsappNumber: string;
  supportEmail: string;
  instagramUrl: string;
  youtubeUrl: string;
  instagramFollowers: string;
  youtubeSubscribers: string;
  totalAudience: string;
  referencePriceInr: number | null;
  heroHeadline: string;
  heroDescription: string;
  maintenanceMode: boolean;
  googleSheets?: {
    sheetId: string;
    sheetTab: string;
    serviceAccountEmail: string;
    serviceAccountPrivateKey: string;
    appsScriptWebhookUrl: string;
  };
  updatedAt: string;
}

export interface AdminAuditRecord {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

export interface StoreDatabase {
  products: Record<GoalSlug, ProductRecord>;
  leads: LeadRecord[];
  orders: OrderRecord[];
  payments: PaymentRecord[];
  downloadTokens: DownloadTokenRecord[];
  processedWebhookEvents: string[];
  siteConfig: SiteConfigRecord;
  auditLogs: AdminAuditRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

function createDefaultStore(): StoreDatabase {
  const now = new Date().toISOString();
  return {
    products: {
      fatloss: {
        id: 'fatloss',
        slug: 'fat-loss-diet-plan',
        name: process.env.PRODUCT_FATLOSS_NAME || '',
        description: process.env.PRODUCT_FATLOSS_DESCRIPTION || '',
        pricePaise: Number(process.env.PRODUCT_FATLOSS_PRICE_PAISE || 0),
        active: true,
        pdfFilename: process.env.PRODUCT_FATLOSS_PDF_FILENAME || 'fat-loss-diet-plan.pdf',
        updatedAt: now,
      },
      gain: {
        id: 'gain',
        slug: 'weight-gain-diet-plan',
        name: process.env.PRODUCT_WEIGHT_GAIN_NAME || '',
        description: process.env.PRODUCT_WEIGHT_GAIN_DESCRIPTION || '',
        pricePaise: Number(process.env.PRODUCT_WEIGHT_GAIN_PRICE_PAISE || 0),
        active: true,
        pdfFilename: process.env.PRODUCT_WEIGHT_GAIN_PDF_FILENAME || 'weight-gain-diet-plan.pdf',
        updatedAt: now,
      },
    },
    leads: [],
    orders: [],
    payments: [],
    downloadTokens: [],
    processedWebhookEvents: [],
    siteConfig: {
      brandName: process.env.BRAND_NAME || '',
      whatsappNumber: process.env.WHATSAPP_NUMBER || '',
      supportEmail: process.env.SUPPORT_EMAIL || '',
      instagramUrl: process.env.INSTAGRAM_URL || '',
      youtubeUrl: process.env.YOUTUBE_URL || '',
      instagramFollowers: process.env.INSTAGRAM_FOLLOWERS || '',
      youtubeSubscribers: process.env.YOUTUBE_SUBSCRIBERS || '',
      totalAudience: process.env.TOTAL_AUDIENCE || '',
      referencePriceInr: null,
      heroHeadline: process.env.HERO_HEADLINE || '',
      heroDescription: process.env.HERO_DESCRIPTION || '',
      maintenanceMode: false,
      updatedAt: now,
    },
    auditLogs: [],
  };
}

let cachedStore: StoreDatabase | null = null;
let persistenceError: string | null = null;

export async function initializeStore(): Promise<void> {
  const persisted = await readPersistedStore();
  if (persisted) { cachedStore = persisted; return; }
  // One-time migration from the legacy local JSON store, if it exists.
  if (fs.existsSync(STORE_PATH)) {
    const legacy = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as StoreDatabase;
    if (legacy.siteConfig?.googleSheets) {
      legacy.siteConfig.googleSheets.serviceAccountPrivateKey = '';
      legacy.siteConfig.googleSheets.appsScriptWebhookUrl = '';
      legacy.siteConfig.googleSheets.serviceAccountEmail = '';
    }
    cachedStore = legacy;
  } else {
    cachedStore = createDefaultStore();
  }
  await persistStoreSnapshot(cachedStore);
}

export function loadStore(): StoreDatabase {
  if (!cachedStore) throw new Error('Store is not initialized. Connect MongoDB before accepting requests.');
  return cachedStore;
}

export async function saveStore(store: StoreDatabase): Promise<void> {
  cachedStore = store;
  try { await persistStoreSnapshot(store); persistenceError = null; }
  catch (error) { persistenceError = error instanceof Error ? error.message : 'MongoDB persistence failed'; console.error('MongoDB persistence failed:', persistenceError); throw error; }
}

export function getStorePersistenceError(): string | null { return persistenceError; }

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

export function appendAuditLog(store: StoreDatabase, actor: string, action: string): void {
  store.auditLogs.unshift({
    id: generateId('audit'),
    actor,
    action,
    timestamp: new Date().toISOString(),
  });
  if (store.auditLogs.length > 100) {
    store.auditLogs.length = 100;
  }
}
