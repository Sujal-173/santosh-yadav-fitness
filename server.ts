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
import { getOrCreatePrivatePdf, saveUploadedPrivatePdf, isPrivatePdfReady } from './server/pdfService';
import {
  hasVerifiedCapturedPayment,
  isVerifiedCapturedPayment,
} from './server/paymentSecurity';
import {
  createRazorpayOrder,
  createSignatureForOrderPayment,
  getRazorpayPublicConfig,
  isLocalTestPaymentSandboxEnabled,
  verifyCapturedStatusWithRazorpay,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from './server/razorpayService';
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

function isLoopbackRequest(req: Request): boolean {
  const remoteAddress = req.socket.remoteAddress?.toLowerCase();
  return (
    remoteAddress === '::1' ||
    remoteAddress === '127.0.0.1' ||
    remoteAddress === '::ffff:127.0.0.1'
  );
}

function validateEnvironment(): void {
  const required = ['MONGODB_URI', 'MONGODB_DB_NAME', 'MONGODB_STORE_COLLECTION', 'REDIS_URL', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH', 'BRAND_NAME', 'WHATSAPP_NUMBER', 'SUPPORT_EMAIL', 'PRODUCT_FATLOSS_NAME', 'PRODUCT_WEIGHT_GAIN_NAME', 'PRODUCT_FATLOSS_DESCRIPTION', 'PRODUCT_WEIGHT_GAIN_DESCRIPTION', 'PRODUCT_FATLOSS_PDF_FILENAME', 'PRODUCT_WEIGHT_GAIN_PDF_FILENAME'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Missing required .env values: ${missing.join(', ')}`);
  if (
    process.env.ENABLE_LOCAL_TEST_PAYMENT_SANDBOX === 'true' &&
    !isLocalTestPaymentSandboxEnabled()
  ) {
    throw new Error(
      'ENABLE_LOCAL_TEST_PAYMENT_SANDBOX is only allowed in development with APP_URL on localhost.',
    );
  }
  for (const key of ['PRODUCT_FATLOSS_PRICE_PAISE', 'PRODUCT_WEIGHT_GAIN_PRICE_PAISE']) {
    const value = Number(process.env[key]);
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${key} must be a positive integer in paise`);
  }
  if (isProduction) {
    const productionRequired = ['APP_URL', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET', 'BLOB_READ_WRITE_TOKEN'];
    const missingProduction = productionRequired.filter((key) => !process.env[key]?.trim());
    if (missingProduction.length) throw new Error(`Missing production secrets/config: ${missingProduction.join(', ')}`);
    if (!process.env.APP_URL!.startsWith('https://')) throw new Error('APP_URL must use HTTPS in production');
    if (!process.env.RAZORPAY_KEY_ID!.startsWith('rzp_live_')) throw new Error('Production requires an rzp_live_ key');
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

const VerifyPaymentSchema = z.object({
  orderId: z.string().min(4),
  razorpayOrderId: z.string().min(4),
  razorpayPaymentId: z.string().min(4),
  razorpaySignature: z.string().min(10),
  method: z.string().max(40).optional(),
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

  // Razorpay Webhook MUST receive raw Buffer BEFORE express.json()
  app.post(
    '/api/webhooks/razorpay',
    express.raw({ type: 'application/json', limit: '256kb' }),
    async (req, res) => {
      const signature = String(req.headers['x-razorpay-signature'] || '');
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');

      if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
      }

      let payload: {
        event?: string;
        payload?: {
          payment?: {
            entity?: {
              id?: string;
              order_id?: string;
              amount?: number;
              currency?: string;
              method?: string;
              status?: string;
            };
          };
        };
      };

      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        res.status(400).json({ error: 'Malformed JSON body' });
        return;
      }

      const eventId = String(
        req.headers['x-razorpay-event-id'] ||
          crypto.createHash('sha256').update(rawBody).digest('hex'),
      );

      const store = loadStore();
      if (store.processedWebhookEvents.includes(eventId)) {
        res.json({ status: 'already_processed' });
        return;
      }

      const eventName = payload.event || '';
      const paymentEntity = payload.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const rzpPaymentId = paymentEntity?.id;
      let orderToSync: OrderRecord | undefined;

      if (rzpOrderId) {
        const order = store.orders.find((o) => o.razorpayOrderId === rzpOrderId);
        if (order) {
          const existingPayment = rzpPaymentId
            ? store.payments.find((payment) => payment.razorpayPaymentId === rzpPaymentId)
            : undefined;
          const paymentBelongsToOrder =
            !existingPayment || existingPayment.orderId === order.id;

          if (eventName === 'payment.captured' || eventName === 'order.paid') {
            if (
              rzpPaymentId &&
              paymentBelongsToOrder &&
              paymentEntity?.amount === order.amountPaise &&
              paymentEntity.currency === 'INR'
            ) {
              order.paymentStatus = 'paid';
              order.orderStatus = 'completed';
              order.paidAt = order.paidAt || new Date().toISOString();

              if (existingPayment) {
                existingPayment.razorpayOrderId = rzpOrderId;
                existingPayment.orderId = order.id;
                existingPayment.amountPaise = order.amountPaise;
                existingPayment.currency = 'INR';
                existingPayment.method = paymentEntity.method || 'razorpay';
                existingPayment.status = 'captured';
                existingPayment.captured = true;
                existingPayment.signatureVerified = true;
                existingPayment.webhookEventId = eventId;
              } else {
                store.payments.unshift({
                  id: generateId('pay'),
                  razorpayPaymentId: rzpPaymentId,
                  razorpayOrderId: rzpOrderId,
                  orderId: order.id,
                  amountPaise: order.amountPaise,
                  currency: 'INR',
                  method: paymentEntity.method || 'razorpay',
                  status: 'captured',
                  captured: true,
                  signatureVerified: true,
                  webhookEventId: eventId,
                  createdAt: new Date().toISOString(),
                });
              }

              const lead = store.leads.find((l) => l.phone === order.customerPhone);
              if (lead) lead.purchased = true;
              orderToSync = order;
            }
          } else if (
            eventName === 'payment.failed' &&
            order.paymentStatus !== 'paid' &&
            rzpPaymentId &&
            paymentBelongsToOrder &&
            !existingPayment?.captured &&
            paymentEntity?.amount === order.amountPaise &&
            paymentEntity.currency === 'INR'
          ) {
            order.paymentStatus = 'failed';
            order.orderStatus = 'failed';
            if (existingPayment) {
              existingPayment.status = 'failed';
              existingPayment.captured = false;
              existingPayment.signatureVerified = true;
              existingPayment.webhookEventId = eventId;
            } else {
              store.payments.unshift({
                id: generateId('pay'), razorpayPaymentId: rzpPaymentId,
                razorpayOrderId: rzpOrderId, orderId: order.id,
                amountPaise: order.amountPaise, currency: 'INR',
                method: paymentEntity?.method || 'unknown', status: 'failed', captured: false,
                signatureVerified: true, webhookEventId: eventId, createdAt: new Date().toISOString(),
              });
            }
            orderToSync = order;
          }
        }
      }

      store.processedWebhookEvents.unshift(eventId);
      if (store.processedWebhookEvents.length > 500) {
        store.processedWebhookEvents.length = 500;
      }
      await saveStore(store);
      if (orderToSync) {
        await syncPaymentSheetRow(orderToSync, store.payments, store.siteConfig);
      }

      res.json({ status: 'ok' });
    },
  );

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

  // Public Configuration & Products (authoritative pricing from backend; strip private keys)
  app.get('/api/config', (_req, res) => {
    const store = loadStore();
    const rzp = getRazorpayPublicConfig();
    const { googleSheets: _hiddenSheets, ...publicSiteConfig } = store.siteConfig;

    res.json({
      siteConfig: publicSiteConfig,
      products: Object.values(store.products),
      razorpay: {
        keyId: rzp.keyId,
        mode: rzp.isConfigured
          ? 'razorpay'
          : isLocalTestPaymentSandboxEnabled()
            ? 'test-sandbox'
            : 'unconfigured',
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

  // Create Razorpay Order (Authoritative price from DB)
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

    try {
      if (!(await isPrivatePdfReady(product.pdfFilename))) {
        res.status(503).json({ error: 'This diet plan PDF is not uploaded yet. Please contact support or try again later.' });
        return;
      }
    } catch (error) {
      console.error('Private PDF readiness check failed:', error);
      res.status(503).json({ error: 'Diet plan download storage is unavailable. Please try again later.' });
      return;
    }

    const rzpConfig = getRazorpayPublicConfig();
    if (!rzpConfig.isConfigured && !isLocalTestPaymentSandboxEnabled()) {
      res.status(503).json({
        error: 'Payment gateway abhi configure nahi hai. Kripya baad mein try karein.',
      });
      return;
    }

    if (
      isLocalTestPaymentSandboxEnabled() &&
      !rzpConfig.isConfigured &&
      !isLoopbackRequest(req)
    ) {
      res.status(403).json({ error: 'The test payment sandbox is only available locally.' });
      return;
    }

    const orderId = `SYF${crypto.randomBytes(12).toString('hex').toUpperCase()}`;

    try {
      const { razorpayOrderId, mode } = await createRazorpayOrder({
        amountPaise: product.pricePaise,
        receipt: orderId,
        notes: {
          orderId,
          goal: product.id,
          phone: parsed.data.phone,
        },
      });

      store.orders.unshift({
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
        razorpayOrderId,
        amountPaise: product.pricePaise,
        currency: 'INR',
        paymentStatus: 'pending',
        orderStatus: 'created',
        createdAt: new Date().toISOString(),
      });

      // Record or update lead & sync to Google Sheets
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
          createdAt: new Date().toISOString(),
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
      const createdOrder = store.orders.find((order) => order.id === orderId);
      if (createdOrder) {
        await syncPaymentSheetRow(createdOrder, store.payments, store.siteConfig);
      }

      const rzp = getRazorpayPublicConfig();
      res.status(201).json({
        orderId,
        razorpayOrderId,
        amountPaise: product.pricePaise,
        currency: 'INR',
        productName: product.name,
        keyId: rzp.keyId,
        mode,
      });
    } catch (err) {
      console.error('Order creation error:', err);
      res.status(502).json({
        error: 'Payment order create karne mein problem aayi. Dobara try karein.',
      });
    }
  });

  // Local-only signature helper for the explicitly enabled development sandbox.
  app.post('/api/payments/sandbox-sign', (req, res) => {
    if (
      !isLocalTestPaymentSandboxEnabled() ||
      getRazorpayPublicConfig().isConfigured ||
      !isLoopbackRequest(req)
    ) {
      res.status(403).json({ error: 'The test payment sandbox is only available locally.' });
      return;
    }

    const razorpayOrderId = String(req.body?.razorpayOrderId || '');
    const store = loadStore();
    const order = store.orders.find((o) => o.razorpayOrderId === razorpayOrderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const razorpayPaymentId = `pay_test_${crypto.randomBytes(6).toString('hex')}`;
    const razorpaySignature = createSignatureForOrderPayment(
      razorpayOrderId,
      razorpayPaymentId,
    );

    res.json({ razorpayPaymentId, razorpaySignature });
  });

  // Record a browser-reported failure for support diagnostics only.
  // Only a signed Razorpay webhook or server-side payment verification can set canonical order status.
  app.post('/api/payments/fail', rateLimit('payment_fail_report', 10, 60_000), async (req, res) => {
    const orderId = String(req.body?.orderId || '');
    const store = loadStore();
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }
    if (order.paymentStatus !== 'paid' && !store.payments.some((payment) => payment.orderId === order.id && payment.status === 'reported_failed')) {
      const reportedPayment: PaymentRecord = {
        id: generateId('pay'), razorpayPaymentId: `reported_failed_${order.id}`,
        razorpayOrderId: order.razorpayOrderId, orderId: order.id,
        amountPaise: order.amountPaise, currency: 'INR', method: 'unknown',
        status: 'reported_failed', captured: false, signatureVerified: false,
        createdAt: new Date().toISOString(),
      };
      store.payments.unshift(reportedPayment);
      await saveStore(store);
      await syncPaymentSheetRow(order, store.payments, store.siteConfig);
    }
    res.json({ status: 'failure_report_recorded' });
  });

  // Verify Payment Signature + Capture Status + Issue Protected Download Token
  app.post('/api/payments/verify', rateLimit('verify', 20, 60_000), async (req, res) => {
    const parsed = VerifyPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Payment verification parameters missing.' });
      return;
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

    const store = loadStore();
    const order = store.orders.find(
      (o) => o.id === orderId && o.razorpayOrderId === razorpayOrderId,
    );

    if (!order) {
      res.status(404).json({ error: 'Order record nahi mila.' });
      return;
    }

    // Idempotent handling if already paid with same payment ID
    const existingPayment = store.payments.find(
      (p) => p.razorpayPaymentId === razorpayPaymentId,
    );
    if (existingPayment && existingPayment.orderId !== order.id) {
      res.status(409).json({
        verified: false,
        error: 'Payment is already associated with another order.',
      });
      return;
    }

    if (
      existingPayment &&
      isVerifiedCapturedPayment(order, existingPayment)
    ) {
      const downloadToken = await issueDownloadToken(order.id, order.productId);
      res.json({
        verified: true,
        orderId: order.id,
        paymentId: razorpayPaymentId,
        productId: order.productId,
        productName: order.productName,
        downloadToken,
      });
      return;
    }

    const sigValid = verifyRazorpayPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!sigValid) {
      res.status(400).json({
        verified: false,
        error: 'Payment signature verify nahi ho paya. Kripya support se contact karein.',
      });
      return;
    }

    const captureCheck = await verifyCapturedStatusWithRazorpay(
      razorpayPaymentId,
      order.amountPaise,
      order.razorpayOrderId,
    );

    if (!captureCheck.captured) {
      res.status(402).json({
        verified: false,
        error: 'Payment abhi capture nahi hua hai. Thodi der mein check karein.',
      });
      return;
    }

    order.paymentStatus = 'paid';
    order.orderStatus = 'completed';
    order.paidAt = order.paidAt || new Date().toISOString();

    if (existingPayment) {
      existingPayment.razorpayOrderId = razorpayOrderId;
      existingPayment.orderId = order.id;
      existingPayment.amountPaise = order.amountPaise;
      existingPayment.currency = 'INR';
      existingPayment.method = captureCheck.method;
      existingPayment.status = 'captured';
      existingPayment.captured = true;
      existingPayment.signatureVerified = true;
    } else {
      store.payments.unshift({
        id: generateId('pay'),
        razorpayPaymentId,
        razorpayOrderId,
        orderId: order.id,
        amountPaise: order.amountPaise,
        currency: 'INR',
        method: captureCheck.method,
        status: 'captured',
        captured: true,
        signatureVerified: true,
        createdAt: new Date().toISOString(),
      });
    }

    const lead = store.leads.find((l) => l.phone === order.customerPhone);
    if (lead) {
      lead.purchased = true;
    }

    await saveStore(store);
    await syncPaymentSheetRow(order, store.payments, store.siteConfig);

    const downloadToken = await issueDownloadToken(order.id, order.productId);

    res.json({
      verified: true,
      orderId: order.id,
      paymentId: razorpayPaymentId,
      productId: order.productId,
      productName: order.productName,
      downloadToken,
    });
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
      (p) => p.razorpayPaymentId === orderOrPaymentId,
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

    tokenRecord.downloadCount += 1;
    await saveStore(store);

    const pdfBuffer = await getOrCreatePrivatePdf(product.id, product.pdfFilename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Santosh_Yadav_${product.slug}.pdf"`,
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

    const { googleSheets: storedSheets, ...publicSiteConfig } = store.siteConfig;
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

  app.post('/api/admin/products/:id/pdf', requireAdmin, async (req, res) => {
    const id = req.params.id as GoalSlug;
    const store = loadStore();
    const product = store.products[id];
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const base64 = String(req.body?.base64Pdf || '');
    if (!base64) {
      res.status(400).json({ error: 'Missing PDF file payload' });
      return;
    }

    const cleanB64 = base64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanB64, 'base64');
    if (buffer.subarray(0, 4).toString('utf8') !== '%PDF') {
      res.status(400).json({ error: 'Uploaded file valid PDF nahi hai.' });
      return;
    }

    if (buffer.length > 3 * 1024 * 1024) {
      res.status(413).json({ error: 'PDF must be 3 MB or smaller for Vercel upload limits.' });
      return;
    }
    await saveUploadedPrivatePdf(product.pdfFilename, buffer);
    product.updatedAt = new Date().toISOString();

    const actor = (req as Request & { adminEmail?: string }).adminEmail || 'admin';
    appendAuditLog(store, actor, `Replaced private PDF for ${product.id} (${buffer.length} bytes)`);
    await saveStore(store);

    res.json({ status: 'uploaded', bytes: buffer.length });
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

    const { googleSheets: _hiddenSheets, ...publicSiteConfig } = store.siteConfig;
    res.json({ siteConfig: publicSiteConfig });
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
