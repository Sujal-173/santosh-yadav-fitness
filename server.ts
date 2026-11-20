import 'dotenv/config';
import 'express-async-errors';
import crypto from 'node:crypto';
import express, { type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  clearAdminSessionCookie,
  getAdminCredentials,
  parseCookie,
  createAdminSession,
  getAdminSession,
  destroyAdminSession,
  verifyAdminPassword,
  requireAdmin,
  setAdminSessionCookie,
} from './server/authService';
import { getOrCreatePrivatePdf } from './server/pdfService';
import { hasVerifiedCapturedPayment } from './server/paymentSecurity';
import { normalizeOrderId } from './server/orderId';
import {
  createUpiIntent,
  getPaytmTransactionStatus,
  getUpiAutoSettings,
  isUpiAutoConfigured,
} from './server/upiAutoService';
import { connectInfrastructure, infrastructureHealth, getRedis } from './server/database';
import {
  initializeStore, getStorePersistenceError,
  appendAuditLog,
  generateId,
  hashToken,
  loadStore,
  saveStore,
  type GoalSlug,
  type LeadRecord,
  type OrderRecord,
  type PaymentRecord,
} from './server/store';
import {
  appendLeadToGoogleSheet,
  resolveGoogleSheetsConfig,
  syncOrderToGoogleSheet,
  testGoogleSheetConnection,
} from './server/sheetsService';

const isProduction = process.env.VERCEL_ENV === 'production' || (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV);

async function syncPaymentSheetRow(
  order: OrderRecord,
  payments: PaymentRecord[],
  siteConfig: ReturnType<typeof loadStore>['siteConfig'],
): Promise<void> {
  const result = await syncOrderToGoogleSheet(order, payments, siteConfig);
  if (!result.synced && result.error) {
    console.error(`Google Sheets payment sync failed for ${order.id}: ${result.error}`);
  }
}

function validateEnvironment(): void {
  const required = ['MONGODB_URI', 'MONGODB_DB_NAME', 'MONGODB_STORE_COLLECTION', 'REDIS_URL', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH', 'BRAND_NAME', 'WHATSAPP_NUMBER', 'SUPPORT_EMAIL', 'PRODUCT_FATLOSS_NAME', 'PRODUCT_WEIGHT_GAIN_NAME', 'PRODUCT_FATLOSS_DESCRIPTION', 'PRODUCT_WEIGHT_GAIN_DESCRIPTION'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Missing required .env values: ${missing.join(', ')}`);
  for (const key of ['PRODUCT_FATLOSS_PRICE_PAISE', 'PRODUCT_WEIGHT_GAIN_PRICE_PAISE']) {
    const value = Number(process.env[key]);
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${key} must be a positive integer in paise`);
  }
  if (isProduction) {
    const productionRequired = ['APP_URL'];
    const missingProduction = productionRequired.filter((key) => !process.env[key]?.trim());
    if (missingProduction.length) throw new Error(`Missing production secrets/config: ${missingProduction.join(', ')}`);
    if (!process.env.APP_URL!.startsWith('https://')) throw new Error('APP_URL must use HTTPS in production');
    if (!process.env.MONGODB_URI!.includes('tls=true') && !process.env.MONGODB_URI!.includes('mongodb+srv://')) throw new Error('Production MongoDB URI must use TLS');
    if (!process.env.REDIS_URL!.startsWith('rediss://')) throw new Error('Production Redis URL must use TLS (rediss://)');
  }
}

// Shared Redis fixed-window rate limiter (works across application instances).
function rateLimit(keyPrefix: string, maxRequests: number, windowMs: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `rate:${keyPrefix}:${ip}`;
      const redis = getRedis();
      const count = await redis.incr(key);
      if (count === 1) await redis.pExpire(key, windowMs);
      if (count > maxRequests) {
        res.status(429).json({ error: 'Bahut zyada requests aayi hain. Kripya thodi der baad try karein.' });
        return;
      }
      next();
    } catch (error) {
      console.error('Redis rate limiter unavailable:', error);
      res.status(503).json({ error: 'Security service temporarily unavailable. Please retry.' });
    }
  };
}

const LeadSchema = z.object({
  name: z.string().trim().min(2, 'Kripya apna sahi naam daalo.').max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Sahi 10-digit Indian mobile number daalo.'),
  email: z
    .string()
    .trim()
    .email('Email address sahi format mein daalo.')
    .optional()
    .or(z.literal('')),
  goal: z.enum(['fatloss', 'gain']),
  age: z.coerce.number().int().min(14, 'Age 14 se 80 ke beech daalo.').max(80).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  heightCm: z.coerce.number().min(120, 'Height 120-230 cm mein daalo.').max(230).optional(),
  weightKg: z.coerce.number().min(30, 'Weight 30-200 kg mein daalo.').max(200).optional(),
  dietPreference: z.enum(['Vegetarian', 'Non-Vegetarian', 'Eggetarian']).optional(),
  consentAccepted: z.boolean().refine((v) => v === true, {
    message: 'Order updates aur PDF delivery ke liye consent zaroori hai.',
  }),
  source: z.string().max(160).optional(),
});

const CreateOrderSchema = z.object({
  name: z.string().trim().min(2, 'Kripya apna sahi naam daalo.').max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Sahi 10-digit WhatsApp mobile number daalo.'),
  email: z
    .string()
    .trim()
    .email('Email sahi nahi hai.')
    .optional()
    .or(z.literal('')),
  goal: z.enum(['fatloss', 'gain']),
  age: z.coerce.number().int().min(14, 'Age 14 se 80 ke beech daalo.').max(80, 'Age 14 se 80 ke beech daalo.'),
  gender: z.enum(['Male', 'Female', 'Other']),
  heightCm: z.coerce.number().min(120, 'Height 120-230 cm mein daalo.').max(230, 'Height 120-230 cm mein daalo.'),
  weightKg: z.coerce.number().min(30, 'Weight 30-200 kg mein daalo.').max(200, 'Weight 30-200 kg mein daalo.'),
  dietPreference: z.enum(['Vegetarian', 'Non-Vegetarian', 'Eggetarian']),
  consentAccepted: z.boolean().refine((v) => v === true, {
    message: 'Order & PDF delivery consent zaroori hai.',
  }),
  source: z.string().max(160).optional(),
});

const RecoverSchema = z.object({
  orderOrPaymentId: z.string().trim().min(4),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Sahi 10-digit mobile number daalo.'),
});

async function issueDownloadToken(orderId: string, productId: GoalSlug): Promise<string> {
  const store = loadStore();
  const order = store.orders.find((candidate) => candidate.id === orderId);
  if (
    !order ||
    order.productId !== productId ||
    !hasVerifiedCapturedPayment(order, store.payments)
  ) {
    throw new Error('Cannot issue a PDF download token without verified captured payment.');
  }

  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(); // 48 hours

  store.downloadTokens.unshift({
    tokenHash,
    orderId,
    productId,
    expiresAt,
    downloadCount: 0,
    maxDownloads: 10,
    revoked: false,
    createdAt: new Date().toISOString(),
  });
  await saveStore(store);
  return rawToken;
}

export async function createApiApp() {
  validateEnvironment();
  await connectInfrastructure();
  await initializeStore();
  const app = express();
  app.set('trust proxy', 1);

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // The legacy store is a single MongoDB snapshot. Serialize API requests across
  // Vercel instances with Redis and refresh the snapshot on every invocation so
  // warm function memory never becomes the source of truth.
  app.use(async (_req, res, next) => {
    const redis = getRedis();
    const lockKey = 'syf:store:request-lock';
    const lockToken = crypto.randomUUID();
    let locked = false;
    try {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const result = await redis.set(lockKey, lockToken, { NX: true, PX: 65000 });
        if (result === 'OK') { locked = true; break; }
        await new Promise((resolve) => setTimeout(resolve, 75));
      }
      if (!locked) {
        res.status(503).json({ error: 'Server is busy processing another request. Please retry shortly.' });
        return;
      }
      await initializeStore();
      res.once('finish', () => {
        void redis.eval(
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
          { keys: [lockKey], arguments: [lockToken] },
        ).catch((error) => console.error('Could not release request lock:', error));
      });
      res.once('close', () => {
        if (!res.writableEnded) {
          void redis.eval(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            { keys: [lockKey], arguments: [lockToken] },
          ).catch((error) => console.error('Could not release request lock:', error));
        }
      });
      next();
    } catch (error) {
      if (locked) {
        await redis.eval(
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
          { keys: [lockKey], arguments: [lockToken] },
        ).catch(() => undefined);
      }
      console.error('Request initialization failed:', error);
      res.status(503).json({ error: 'Backend dependencies are unavailable. Check MongoDB and Redis configuration.' });
    }
  });

  app.use(express.json({ limit: '5mb' }));

  // SEO: robots.txt & sitemap.xml
  app.get('/robots.txt', (req, res) => {
    const base =
      process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`,
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const base =
      process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const urls = ['/', '/privacy-policy', '/terms', '/refund-policy'];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(
        (u) =>
          `  <url><loc>${base}${u}</loc><changefreq>weekly</changefreq><priority>${
            u === '/' ? '1.0' : '0.5'
          }</priority></url>`,
      )
      .join('\n')}\n</urlset>`;
    res.type('application/xml').send(xml);
  });

  // Health: report dependency state without exposing connection strings.
  app.get('/api/health', async (_req, res) => {
    try {
      const dependencies = await infrastructureHealth();
      const healthy = dependencies.mongodb && dependencies.redis && !getStorePersistenceError();
      res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', dependencies, timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'degraded', dependencies: { mongodb: false, redis: false } });
    }
  });

  // Public Configuration & Products. Only the payment VPA is public; the Paytm MID stays server-side.
  app.get('/api/config', (_req, res) => {
    const store = loadStore();
    const upiSettings = getUpiAutoSettings(store.siteConfig);
    const { googleSheets: _hiddenSheets, upiAuto: _hiddenUpiAuto, ...publicSiteConfig } = store.siteConfig;

    res.json({
      siteConfig: publicSiteConfig,
      products: Object.values(store.products),
      upiAuto: {
        configured: isUpiAutoConfigured(upiSettings),
        upiId: isUpiAutoConfigured(upiSettings) ? upiSettings.upiId : null,
        expiryMinutes: upiSettings.expiryMinutes,
      },
    });
  });

  // Lead Capture (automatically persisted locally + synced to Google Sheets)
  app.post('/api/leads', rateLimit('leads', 20, 60_000), async (req, res) => {
    const parsed = LeadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Details sahi se bharo.',
      });
      return;
    }

    const store = loadStore();
    const record: LeadRecord = {
      id: generateId('lead'),
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      goal: parsed.data.goal,
      age: parsed.data.age,
      gender: parsed.data.gender,
      heightCm: parsed.data.heightCm,
      weightKg: parsed.data.weightKg,
      dietPreference: parsed.data.dietPreference,
      consentAccepted: parsed.data.consentAccepted,
      source: parsed.data.source || 'direct',
      purchased: false,
      sheetSynced: false,
      createdAt: new Date().toISOString(),
    };

    const syncResult = await appendLeadToGoogleSheet(record, store.siteConfig);
    if (syncResult.synced) {
      record.sheetSynced = true;
      record.sheetSyncedAt = new Date().toISOString();
    } else if (syncResult.error) {
      record.sheetSyncError = syncResult.error;
    }

    store.leads.unshift(record);
    await saveStore(store);

    res.status(201).json({
      leadId: record.id,
      sheetSynced: Boolean(record.sheetSynced),
    });
  });

  // Create a UPI Auto order: QR + UPI deep links are generated from the authoritative product price.
  app.post('/api/orders', rateLimit('orders', 15, 60_000), async (req, res) => {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Order details invalid hain.',
      });
      return;
    }

    const store = loadStore();
    if (store.siteConfig.maintenanceMode) {
      res.status(503).json({
        error: 'Website abhi maintenance mein hai. Thodi der baad try karein.',
      });
      return;
    }

    const product = store.products[parsed.data.goal];
    if (!product || !product.active) {
      res.status(400).json({ error: 'Selected diet plan abhi available nahi hai.' });
      return;
    }

    const upiSettings = getUpiAutoSettings(store.siteConfig);
    if (!isUpiAutoConfigured(upiSettings)) {
      res.status(503).json({
        error: 'UPI Auto payment abhi admin panel mein configure nahi hai. Please contact support.',
      });
      return;
    }

    const orderId = `SYF${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + upiSettings.expiryMinutes * 60_000).toISOString();
    const intent = createUpiIntent({
      upiId: upiSettings.upiId,
      amountPaise: product.pricePaise,
      payeeName: store.siteConfig.brandName || 'Santosh Yadav Fitness',
      orderId,
      purpose: `Diet Plan ${product.id === 'fatloss' ? 'Fat Loss' : 'Weight Gain'} ${orderId}`,
    });

    const order: OrderRecord = {
      id: orderId,
      customerName: parsed.data.name,
      customerPhone: parsed.data.phone,
      customerEmail: parsed.data.email || undefined,
      age: parsed.data.age,
      gender: parsed.data.gender,
      heightCm: parsed.data.heightCm,
      weightKg: parsed.data.weightKg,
      dietPreference: parsed.data.dietPreference,
      productId: product.id,
      productName: product.name,
      gateway: 'upi_auto',
      gatewayOrderId: orderId,
      gatewayMerchantId: upiSettings.merchantId,
      amountPaise: product.pricePaise,
      currency: 'INR',
      paymentStatus: 'pending',
      orderStatus: 'created',
      expiresAt,
      createdAt: now.toISOString(),
    };

    store.orders.unshift(order);

    // Record or update lead & sync to Google Sheets.
    const existingLead = store.leads.find(
      (l) => l.phone === parsed.data.phone && l.goal === product.id,
    );
    if (!existingLead) {
      const newLead: LeadRecord = {
        id: generateId('lead'),
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || undefined,
        goal: product.id,
        age: parsed.data.age,
        gender: parsed.data.gender,
        heightCm: parsed.data.heightCm,
        weightKg: parsed.data.weightKg,
        dietPreference: parsed.data.dietPreference,
        consentAccepted: parsed.data.consentAccepted,
        source: parsed.data.source || 'checkout',
        purchased: false,
        sheetSynced: false,
        createdAt: now.toISOString(),
      };
      const syncResult = await appendLeadToGoogleSheet(newLead, store.siteConfig);
      if (syncResult.synced) {
        newLead.sheetSynced = true;
        newLead.sheetSyncedAt = new Date().toISOString();
      } else if (syncResult.error) {
        newLead.sheetSyncError = syncResult.error;
      }
      store.leads.unshift(newLead);
    }

    await saveStore(store);
    await syncPaymentSheetRow(order, store.payments, store.siteConfig);

    res.status(201).json({
      orderId,
      amountPaise: product.pricePaise,
      currency: 'INR',
      productName: product.name,
      upiUri: intent.upiUri,
      qrCodeUrl: intent.qrCodeUrl,
      upiId: upiSettings.upiId,
      appLinks: intent.appLinks,
      expiresAt,
      expiryMinutes: upiSettings.expiryMinutes,
      mode: 'upi-auto',
    });
  });

  // Record a customer-reported cancellation for support only; this never changes paid status.
  app.post('/api/payments/fail', rateLimit('payment_fail_report', 10, 60_000), async (req, res) => {
    const orderId = String(req.body?.orderId || '');
    const store = loadStore();
    const order = store.orders.find((candidate) => candidate.id === orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (
      order.gateway === 'upi_auto' &&
      order.paymentStatus !== 'paid' &&
      !store.payments.some((payment) => payment.orderId === order.id && payment.status === 'reported_failed')
    ) {
      store.payments.unshift({
        id: generateId('pay'),
        gateway: 'upi_auto',
        gatewayOrderId: order.gatewayOrderId,
        orderId: order.id,
        amountPaise: order.amountPaise,
        currency: 'INR',
        method: 'UPI',
        status: 'reported_failed',
        captured: false,
        gatewayVerified: false,
        createdAt: new Date().toISOString(),
      });
      await saveStore(store);
      await syncPaymentSheetRow(order, store.payments, store.siteConfig);
    }
    res.json({ status: 'failure_report_recorded' });
  });

  // Server-to-server Paytm status verification. Browser events / screenshots are never accepted as proof.
  app.post('/api/payments/verify', rateLimit('upi_status', 30, 60_000), async (req, res) => {
    // The database record is the source of truth. Accept safe legacy IDs too;
    // a strict SYF+24-hex regex can reject valid orders created by older builds.
    const orderId = normalizeOrderId(req.body?.orderId ?? req.body?.gatewayOrderId);
    if (!orderId) {
      console.warn('Payment verification rejected a missing or malformed order ID', {
        bodyType: typeof req.body,
        bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : [],
        receivedOrderIdType: typeof req.body?.orderId,
        receivedOrderIdLength: typeof req.body?.orderId === 'string' ? req.body.orderId.length : undefined,
      });
      res.status(400).json({
        verified: false,
        status: 'review',
        code: 'ORDER_ID_INVALID',
        error: 'Checkout order ID is missing or malformed. Please contact support with the order shown on this screen.',
      });
      return;
    }

    const store = loadStore();
    const order = store.orders.find((candidate) => candidate.id === orderId)
      || store.orders.find((candidate) => candidate.gatewayOrderId === orderId);
    if (!order || order.gateway !== 'upi_auto' || !order.gatewayOrderId || !order.gatewayMerchantId) {
      console.warn('Payment verification order lookup failed', {
        orderIdPrefix: orderId.slice(0, 6),
        orderIdLength: orderId.length,
        orderFound: Boolean(order),
        gateway: order?.gateway || null,
        hasGatewayOrderId: Boolean(order?.gatewayOrderId),
        hasMerchantId: Boolean(order?.gatewayMerchantId),
      });
      res.status(404).json({
        verified: false,
        status: 'review',
        code: 'ORDER_NOT_FOUND',
        error: 'This checkout order could not be found in the payment records. Do not pay again; contact support with the order ID.',
      });
      return;
    }

    const existingPayment = store.payments.find(
      (payment) => payment.orderId === order.id && payment.gateway === 'upi_auto' && payment.captured,
    );
    if (order.paymentStatus === 'paid' && existingPayment && hasVerifiedCapturedPayment(order, [existingPayment])) {
      const downloadToken = await issueDownloadToken(order.id, order.productId);
      res.json({
        verified: true,
        status: 'success',
        orderId: order.id,
        paymentId: existingPayment.upiTransactionId,
        productId: order.productId,
        productName: order.productName,
        downloadToken,
      });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.status(409).json({ verified: false, status: 'review', error: 'Payment is marked paid but its verified transaction record is missing. Please contact support.' });
      return;
    }

    try {
      const status = await getPaytmTransactionStatus(order.gatewayMerchantId, order.gatewayOrderId);

      if (status.status === 'success') {
        if (!status.transactionId || status.amountPaise !== order.amountPaise) {
          res.status(409).json({
            verified: false,
            status: 'review',
            error: 'Paytm response amount/transaction ID did not match this order. Do not make another payment; contact support.',
          });
          return;
        }

        const duplicateTransaction = store.payments.find(
          (payment) => payment.upiTransactionId === status.transactionId,
        );
        if (duplicateTransaction && duplicateTransaction.orderId !== order.id) {
          res.status(409).json({
            verified: false,
            status: 'review',
            error: 'This transaction ID is already linked to another order. Please contact support.',
          });
          return;
        }

        order.paymentStatus = 'paid';
        order.orderStatus = 'completed';
        order.paidAt = order.paidAt || new Date().toISOString();

        if (existingPayment) {
          existingPayment.gateway = 'upi_auto';
          existingPayment.gatewayOrderId = order.gatewayOrderId;
          existingPayment.upiTransactionId = status.transactionId;
          existingPayment.amountPaise = order.amountPaise;
          existingPayment.currency = 'INR';
          existingPayment.method = status.paymentMode || 'UPI';
          existingPayment.status = 'captured';
          existingPayment.captured = true;
          existingPayment.gatewayVerified = true;
        } else {
          store.payments.unshift({
            id: generateId('pay'),
            gateway: 'upi_auto',
            gatewayOrderId: order.gatewayOrderId,
            upiTransactionId: status.transactionId,
            orderId: order.id,
            amountPaise: order.amountPaise,
            currency: 'INR',
            method: status.paymentMode || 'UPI',
            status: 'captured',
            captured: true,
            gatewayVerified: true,
            createdAt: new Date().toISOString(),
          });
        }

        const lead = store.leads.find((candidate) => candidate.phone === order.customerPhone && candidate.goal === order.productId);
        if (lead) lead.purchased = true;

        await saveStore(store);
        await syncPaymentSheetRow(order, store.payments, store.siteConfig);
        const downloadToken = await issueDownloadToken(order.id, order.productId);

        res.json({
          verified: true,
          status: 'success',
          orderId: order.id,
          paymentId: status.transactionId,
          productId: order.productId,
          productName: order.productName,
          downloadToken,
        });
        return;
      }

      if (status.status === 'failed') {
        order.paymentStatus = 'failed';
        order.orderStatus = 'failed';
        const failedAlreadyRecorded = store.payments.some(
          (payment) => payment.orderId === order.id && payment.status === 'failed',
        );
        if (!failedAlreadyRecorded) {
          store.payments.unshift({
            id: generateId('pay'),
            gateway: 'upi_auto',
            gatewayOrderId: order.gatewayOrderId,
            upiTransactionId: status.transactionId,
            orderId: order.id,
            amountPaise: status.amountPaise ?? order.amountPaise,
            currency: 'INR',
            method: status.paymentMode || 'UPI',
            status: 'failed',
            captured: false,
            gatewayVerified: true,
            createdAt: new Date().toISOString(),
          });
        }
        await saveStore(store);
        await syncPaymentSheetRow(order, store.payments, store.siteConfig);
        res.json({
          verified: false,
          status: 'failed',
          error: status.responseMessage || 'Paytm has confirmed that this payment failed.',
        });
        return;
      }

      const qrExpiredAt = order.expiresAt ? Date.parse(order.expiresAt) : Number.NaN;
      const qrExpired = Number.isFinite(qrExpiredAt) && qrExpiredAt <= Date.now();
      // UPI/issuer confirmation can arrive after the QR countdown. Do not stop
      // reconciliation at the QR expiry itself; keep checking for late success.
      // Only close the order after a further 30-minute reconciliation window.
      const reconciliationEnded = qrExpired && Date.now() > qrExpiredAt + 30 * 60_000;
      if (reconciliationEnded) {
        order.paymentStatus = 'expired';
        order.orderStatus = 'expired';
        await saveStore(store);
        await syncPaymentSheetRow(order, store.payments, store.siteConfig);
        res.json({
          verified: false,
          status: 'expired',
          error: 'No matching successful transaction was found. The QR has expired. Contact support before paying again.',
        });
        return;
      }

      res.json({
        verified: false,
        status: 'pending',
        qrExpired,
        message: qrExpired
          ? 'QR timer ended. We are still checking for a delayed UPI confirmation. Do not pay again yet.'
          : status.responseMessage || 'Payment abhi confirm nahi hua. Status automatically check hota rahega.',
      });
    } catch (error) {
      console.error('UPI Auto payment status check failed:', error instanceof Error ? error.message : 'Unknown Paytm status error');
      res.status(503).json({
        verified: false,
        status: 'pending',
        error: 'Payment status service temporarily unavailable. Please keep this window open; it will retry automatically.',
      });
    }
  });

  // Recover Download Link for Paid Orders
  app.post('/api/downloads/recover', rateLimit('recover', 10, 60_000), async (req, res) => {
    const parsed = RecoverSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Sahi Order/Payment ID aur 10-digit mobile daalo.' });
      return;
    }

    const { orderOrPaymentId, phone } = parsed.data;
    const store = loadStore();

    const matchedPayment = store.payments.find(
      (payment) =>
        payment.upiTransactionId === orderOrPaymentId ||
        payment.razorpayPaymentId === orderOrPaymentId,
    );

    const order = store.orders.find(
      (o) =>
        o.customerPhone === phone &&
        hasVerifiedCapturedPayment(o, store.payments) &&
        (o.id === orderOrPaymentId ||
          o.razorpayOrderId === orderOrPaymentId ||
          (matchedPayment && o.id === matchedPayment.orderId)),
    );

    if (!order) {
      res.status(404).json({
        error:
          'Is mobile number aur Order/Payment ID ke saath koi paid order nahi mila.',
      });
      return;
    }

    const downloadToken = await issueDownloadToken(order.id, order.productId);
    res.json({
      orderId: order.id,
      productId: order.productId,
      productName: order.productName,
      downloadToken,
    });
  });

  // Protected Private PDF Download Endpoint
  app.get('/api/downloads/:token', rateLimit('downloads', 30, 60_000), async (req, res) => {
    const rawToken = String(req.params.token || '');
    if (!rawToken || rawToken.length < 16) {
      res.status(400).json({ error: 'Invalid download token.' });
      return;
    }

    const store = loadStore();
    const hashed = hashToken(rawToken);
    const tokenRecord = store.downloadTokens.find((t) => t.tokenHash === hashed);

    if (!tokenRecord || tokenRecord.revoked) {
      res.status(403).json({ error: 'Download link invalid ya revoke ho chuka hai.' });
      return;
    }

    if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
      res.status(410).json({
        error: 'Download link expire ho chuka hai. Recover My PDF option use karein.',
      });
      return;
    }

    if (tokenRecord.downloadCount >= tokenRecord.maxDownloads) {
      res.status(429).json({
        error: 'Maximum download limit poori ho gayi hai. Recover My PDF use karein.',
      });
      return;
    }

    const order = store.orders.find((o) => o.id === tokenRecord.orderId);
    if (
      !order ||
      !hasVerifiedCapturedPayment(order, store.payments) ||
      tokenRecord.productId !== order.productId
    ) {
      res.status(403).json({ error: 'Order payment verified nahi hai.' });
      return;
    }

    const product = store.products[order.productId];
    if (!product) {
      res.status(404).json({ error: 'Product file nahi mili.' });
      return;
    }

    // Render the order-specific PDF before consuming a download attempt.
    const pdfBuffer = await getOrCreatePrivatePdf(product.id, order);
    tokenRecord.downloadCount += 1;
    await saveStore(store);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Santosh_Yadav_${product.slug}_${order.id}.pdf"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.send(pdfBuffer);
  });

  // =========================================================================
  // ADMIN AUTHENTICATION & PROTECTED ADMIN APIs
  // =========================================================================

  app.post('/api/admin/login', rateLimit('admin_login', Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || 8), Number(process.env.ADMIN_LOGIN_WINDOW_MS || 900000)), async (req, res) => {
    const creds = getAdminCredentials();
    if (!creds) { res.status(503).json({ error: 'ADMIN_EMAIL aur ADMIN_PASSWORD_HASH .env mein configure karein.' }); return; }
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (email !== creds.email.toLowerCase() || !verifyAdminPassword(password, creds.passwordHash)) {
      res.status(401).json({ error: 'Galat email ya password.' }); return;
    }
    const token = await createAdminSession(email);
    setAdminSessionCookie(res, token);
    const store = loadStore();
    appendAuditLog(store, email, 'Admin logged in');
    await saveStore(store);
    res.json({ authenticated: true, email });
  });

  app.post('/api/admin/logout', async (req, res) => {
    await destroyAdminSession(parseCookie(req, 'syf_admin_session'));
    clearAdminSessionCookie(res);
    res.json({ authenticated: false });
  });

  app.get('/api/admin/session', async (req, res) => {
    const session = await getAdminSession(parseCookie(req, 'syf_admin_session'));
    res.json(session ? { authenticated: true, email: session.email } : { authenticated: false });
  });

  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const store = loadStore();
    const paidOrders = store.orders.filter((o) => o.paymentStatus === 'paid');
    const failedOrders = store.orders.filter((o) => o.paymentStatus === 'failed');
    const pendingOrders = store.orders.filter((o) => o.paymentStatus === 'pending');
    const totalRevenueInr = Math.round(
      paidOrders.reduce((acc, o) => acc + o.amountPaise, 0) / 100,
    );

    const { googleSheets: storedSheets, upiAuto: storedUpiAuto, ...publicSiteConfig } = store.siteConfig;
    const upiSettings = getUpiAutoSettings({ ...store.siteConfig, upiAuto: storedUpiAuto });
    const resolvedSheets = resolveGoogleSheetsConfig(store.siteConfig);

    res.json({
      stats: {
        totalOrders: store.orders.length,
        paidOrders: paidOrders.length,
        failedOrders: failedOrders.length,
        pendingOrders: pendingOrders.length,
        totalRevenueInr,
        totalLeads: store.leads.length,
      },
      products: Object.values(store.products),
      orders: store.orders.slice(0, 100),
      payments: store.payments.slice(0, 100),
      leads: store.leads.slice(0, 200),
      downloadTokens: store.downloadTokens.slice(0, 100),
      siteConfig: publicSiteConfig,
      upiAutoConfig: {
        enabled: Boolean(upiSettings.enabled),
        configured: isUpiAutoConfigured(upiSettings),
        merchantId: upiSettings.merchantId,
        upiId: upiSettings.upiId,
        expiryMinutes: upiSettings.expiryMinutes,
      },
      googleSheetsConfig: {
        sheetId: storedSheets?.sheetId || '',
        sheetTab: storedSheets?.sheetTab || process.env.GOOGLE_SHEET_TAB || 'Leads',
        serviceAccountEmail: resolvedSheets.serviceAccountEmail,
        hasPrivateKey: Boolean(resolvedSheets.serviceAccountPrivateKey),
        appsScriptWebhookUrl: '',
        resolvedMode: resolvedSheets.mode,
        envConfigured: Boolean(
          (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() &&
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim()) ||
            process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL?.trim(),
        ),
      },
      auditLogs: store.auditLogs.slice(0, 30),
    });
  });

  app.patch('/api/admin/products/:id', requireAdmin, async (req, res) => {
    const id = req.params.id as GoalSlug;
    const store = loadStore();
    const product = store.products[id];
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const priceInr = Number(req.body?.priceInr);
    if (Number.isFinite(priceInr) && priceInr >= 1 && priceInr <= 50000) {
      product.pricePaise = Math.round(priceInr * 100);
    }
    if (typeof req.body?.active === 'boolean') {
      product.active = req.body.active;
    }
    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      product.name = req.body.name.trim();
    }
    if (typeof req.body?.description === 'string' && req.body.description.trim()) {
      product.description = req.body.description.trim();
    }
    product.updatedAt = new Date().toISOString();

    const actor = (req as Request & { adminEmail?: string }).adminEmail || 'admin';
    appendAuditLog(
      store,
      actor,
      `Updated product ${product.id} (₹${product.pricePaise / 100}, active=${product.active})`,
    );
    await saveStore(store);

    res.json({ product });
  });


  app.patch('/api/admin/content', requireAdmin, async (req, res) => {
    const store = loadStore();
    const body = req.body || {};

    if (typeof body.whatsappNumber === 'string' && body.whatsappNumber.trim()) {
      store.siteConfig.whatsappNumber = body.whatsappNumber.replace(/\D/g, '');
    }
    if (typeof body.supportEmail === 'string' && body.supportEmail.trim()) {
      store.siteConfig.supportEmail = body.supportEmail.trim();
    }
    if (typeof body.instagramUrl === 'string' && body.instagramUrl.trim()) {
      store.siteConfig.instagramUrl = body.instagramUrl.trim();
    }
    if (typeof body.youtubeUrl === 'string' && body.youtubeUrl.trim()) {
      store.siteConfig.youtubeUrl = body.youtubeUrl.trim();
    }
    if (typeof body.instagramFollowers === 'string' && body.instagramFollowers.trim()) {
      store.siteConfig.instagramFollowers = body.instagramFollowers.trim();
    }
    if (typeof body.youtubeSubscribers === 'string' && body.youtubeSubscribers.trim()) {
      store.siteConfig.youtubeSubscribers = body.youtubeSubscribers.trim();
    }
    if (typeof body.totalAudience === 'string' && body.totalAudience.trim()) {
      store.siteConfig.totalAudience = body.totalAudience.trim();
    }
    if (typeof body.heroHeadline === 'string' && body.heroHeadline.trim()) {
      store.siteConfig.heroHeadline = body.heroHeadline.trim();
    }
    if (typeof body.heroDescription === 'string' && body.heroDescription.trim()) {
      store.siteConfig.heroDescription = body.heroDescription.trim();
    }
    if (typeof body.maintenanceMode === 'boolean') {
      store.siteConfig.maintenanceMode = body.maintenanceMode;
    }

    store.siteConfig.updatedAt = new Date().toISOString();
    const actor = (req as Request & { adminEmail?: string }).adminEmail || 'admin';
    appendAuditLog(store, actor, 'Updated site content & settings');
    await saveStore(store);

    const { googleSheets: _hiddenSheets, upiAuto: _hiddenUpiAuto, ...publicSiteConfig } = store.siteConfig;
    res.json({ siteConfig: publicSiteConfig });
  });

  app.patch('/api/admin/upi-auto', requireAdmin, async (req, res) => {
    const store = loadStore();
    const body = req.body || {};
    const enabled = typeof body.enabled === 'boolean' ? body.enabled : false;
    const merchantId = String(body.merchantId || '').trim();
    const upiId = String(body.upiId || '').trim();
    const expiryMinutes = Number(body.expiryMinutes);

    if (merchantId.length > 64) {
      res.status(400).json({ error: 'Paytm Merchant ID must be 64 characters or fewer.' });
      return;
    }
    if (upiId && !/^[^\s@]+@[^\s@]+$/.test(upiId)) {
      res.status(400).json({ error: 'Enter a valid UPI ID / VPA (example: name@bank).' });
      return;
    }
    if (!Number.isInteger(expiryMinutes) || expiryMinutes < 5 || expiryMinutes > 60) {
      res.status(400).json({ error: 'Payment expiry must be between 5 and 60 minutes.' });
      return;
    }
    if (enabled && (!merchantId || !upiId)) {
      res.status(400).json({ error: 'Merchant ID and UPI ID are required before enabling UPI Auto.' });
      return;
    }

    store.siteConfig.upiAuto = { enabled, merchantId, upiId, expiryMinutes };
    store.siteConfig.updatedAt = new Date().toISOString();
    const actor = (req as Request & { adminEmail?: string }).adminEmail || 'admin';
    appendAuditLog(store, actor, `Updated UPI Auto settings (enabled=${enabled}, VPA=${upiId || 'unset'})`);
    await saveStore(store);

    res.json({
      upiAutoConfig: {
        enabled,
        configured: isUpiAutoConfigured(getUpiAutoSettings(store.siteConfig)),
        merchantId,
        upiId,
        expiryMinutes,
      },
    });
  });

  app.patch('/api/admin/google-sheets', requireAdmin, async (req, res) => {
    const store = loadStore();
    const body = req.body || {};
    const secretFields = [
      body.serviceAccountEmail,
      body.serviceAccountPrivateKey,
      body.appsScriptWebhookUrl,
    ];
    if (secretFields.some((value) => typeof value === 'string' && value.trim())) {
      res.status(400).json({
        error:
          'Google credentials are server environment-only. Set them in the backend .env and restart the server.',
      });
      return;
    }

    const current = store.siteConfig.googleSheets || {
      sheetId: '',
      sheetTab: 'Leads',
      serviceAccountEmail: '',
      serviceAccountPrivateKey: '',
      appsScriptWebhookUrl: '',
    };

    store.siteConfig.googleSheets = {
      sheetId: typeof body.sheetId === 'string' ? body.sheetId.trim() : current.sheetId,
      sheetTab:
        typeof body.sheetTab === 'string' && body.sheetTab.trim()
          ? body.sheetTab.trim()
          : current.sheetTab || 'Leads',
      serviceAccountEmail: '',
      serviceAccountPrivateKey: '',
      appsScriptWebhookUrl: '',
    };
    store.siteConfig.updatedAt = new Date().toISOString();

    const actor = (req as Request & { adminEmail?: string }).adminEmail || 'admin';
    appendAuditLog(store, actor, 'Updated Google Sheets integration credentials');
    await saveStore(store);

    const resolved = resolveGoogleSheetsConfig(store.siteConfig);
    res.json({
      saved: true,
      resolvedMode: resolved.mode,
      hasPrivateKey: Boolean(resolved.serviceAccountPrivateKey),
    });
  });

  app.post('/api/admin/google-sheets/test', requireAdmin, async (req, res) => {
    const store = loadStore();
    const result = await testGoogleSheetConnection(store.siteConfig);
    const actor = (req as Request & { adminEmail?: string }).adminEmail || 'admin';
    appendAuditLog(
      store,
      actor,
      result.synced
        ? `Verified Google Sheets connection (${result.sheetTitle || result.provider})`
        : `Google Sheets connection check failed: ${result.error}`,
    );
    await saveStore(store);

    res.status(result.synced ? 200 : 400).json(result);
  });

  app.post('/api/admin/google-sheets/sync-pending', requireAdmin, async (req, res) => {
    const store = loadStore();
    const pendingLeads = store.leads.filter((l) => !l.sheetSynced);
    let syncedCount = 0;
    let orderSyncedCount = 0;
    let lastError = '';

    for (const lead of pendingLeads) {
      const result = await appendLeadToGoogleSheet(lead, store.siteConfig);
      if (result.synced) {
        lead.sheetSynced = true;
        lead.sheetSyncedAt = new Date().toISOString();
        lead.sheetSyncError = undefined;
        syncedCount += 1;
      } else if (result.error) {
        lead.sheetSyncError = result.error;
        lastError = result.error;
      }
    }

    for (const order of store.orders) {
      const result = await syncOrderToGoogleSheet(order, store.payments, store.siteConfig);
      if (result.synced) {
        orderSyncedCount += 1;
      } else if (result.error) {
        lastError = result.error;
      }
    }

    const actor = (req as Request & { adminEmail?: string }).adminEmail || 'admin';
    appendAuditLog(
      store,
      actor,
      `Synced ${syncedCount}/${pendingLeads.length} pending leads and ${orderSyncedCount}/${store.orders.length} payment rows to Google Sheets`,
    );
    await saveStore(store);

    res.json({
      attempted: pendingLeads.length,
      syncedCount,
      ordersAttempted: store.orders.length,
      orderSyncedCount,
      lastError: lastError || undefined,
    });
  });

  app.get('/api/admin/leads/export', requireAdmin, async (req, res) => {
    const store = loadStore();
    const goalFilter = String(req.query.goal || 'all');
    const filtered = store.leads.filter((l) =>
      goalFilter === 'all' ? true : l.goal === goalFilter,
    );

    const header = 'ID,Name,Phone,Email,Goal,Age,Gender,HeightCm,WeightKg,DietPreference,Purchased,Source,CreatedAt\n';
    const rows = filtered
      .map((l) =>
        [
          l.id,
          `"${l.name.replace(/"/g, '""')}"`,
          l.phone,
          `"${(l.email || '').replace(/"/g, '""')}"`,
          l.goal,
          l.age ?? '',
          l.gender ?? '',
          l.heightCm ?? '',
          l.weightKg ?? '',
          l.dietPreference ?? '',
          l.purchased ? 'Yes' : 'No',
          `"${l.source.replace(/"/g, '""')}"`,
          l.createdAt,
        ].join(','),
      )
      .join('\n');

    const actor = (req as Request & { adminEmail?: string }).adminEmail || 'admin';
    appendAuditLog(store, actor, `Exported ${filtered.length} leads to CSV`);
    await saveStore(store);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="santosh-yadav-leads.csv"');
    res.send(header + rows);
  });

  // Centralized async route error handling. Do not leak internal errors to clients.
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled API error:', error);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Internal server error. Please retry or contact support.' });
  });

  // Next.js owns all page rendering. This function only constructs the API app.
  return app;
}
