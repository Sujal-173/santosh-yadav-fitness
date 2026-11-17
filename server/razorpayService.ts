import crypto from 'node:crypto';

const EPHEMERAL_SANDBOX_SECRET = crypto.randomBytes(32).toString('hex');

export function isLocalTestPaymentSandboxEnabled(): boolean {
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.ENABLE_LOCAL_TEST_PAYMENT_SANDBOX !== 'true'
  ) {
    return false;
  }

  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) return false;

  try {
    const url = new URL(appUrl);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase()) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function getRazorpayPublicConfig(): {
  keyId: string | null;
  isConfigured: boolean;
} {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
  const isConfigured =
    Boolean(keyId && keySecret) &&
    !keyId.includes('XXXX') &&
    (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'));

  return {
    keyId: isConfigured ? keyId : null,
    isConfigured,
  };
}

function getSigningSecret(): string | null {
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (keySecret) return keySecret;
  return isLocalTestPaymentSandboxEnabled() ? EPHEMERAL_SANDBOX_SECRET : null;
}

export function getWebhookSecret(): string | null {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (webhookSecret) return webhookSecret;
  if (process.env.NODE_ENV === 'development') return getSigningSecret();
  return null;
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ razorpayOrderId: string; mode: 'razorpay' | 'test-sandbox' }> {
  const { keyId, isConfigured } = getRazorpayPublicConfig();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';

  if (isConfigured && keyId && keySecret) {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: 'INR',
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Razorpay order creation failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as { id: string };
    return { razorpayOrderId: data.id, mode: 'razorpay' };
  }

  if (isLocalTestPaymentSandboxEnabled()) {
    const sandboxOrderId = `order_test_${crypto.randomBytes(7).toString('hex')}`;
    return { razorpayOrderId: sandboxOrderId, mode: 'test-sandbox' };
  }

  throw new Error('Razorpay credentials are required to create payment orders.');
}

export function createSignatureForOrderPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
): string {
  const secret = getSigningSecret();
  if (!secret) throw new Error('Razorpay signing secret is not configured.');

  return crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
}

export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;

  const secret = getSigningSecret();
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(razorpaySignature, 'utf8');

  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export async function verifyCapturedStatusWithRazorpay(
  razorpayPaymentId: string,
  expectedAmountPaise: number,
  expectedRazorpayOrderId: string,
): Promise<{ captured: boolean; method: string }> {
  const { isConfigured, keyId } = getRazorpayPublicConfig();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';

  if (!isConfigured || !keyId || !keySecret) {
    return {
      captured: isLocalTestPaymentSandboxEnabled(),
      method: 'test_sandbox',
    };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpayPaymentId)}`,
    {
      headers: { Authorization: `Basic ${auth}` },
    },
  );

  if (!response.ok) {
    return { captured: false, method: 'unknown' };
  }

  const payment = (await response.json()) as {
    status?: string;
    captured?: boolean;
    amount?: number;
    currency?: string;
    order_id?: string;
    method?: string;
  };

  const isCaptured =
    (payment.status === 'captured' || payment.captured === true) &&
    payment.amount === expectedAmountPaise &&
    payment.currency === 'INR' &&
    payment.order_id === expectedRazorpayOrderId;

  return {
    captured: isCaptured,
    method: payment.method || 'razorpay',
  };
}

export function verifyRazorpayWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string,
): boolean {
  if (!signatureHeader || !rawBody.length) return false;
  const secret = getWebhookSecret();
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(signatureHeader, 'utf8');
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
