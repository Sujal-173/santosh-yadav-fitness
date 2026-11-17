import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { OrderRecord, PaymentRecord } from './store';
import {
  createRazorpayOrder,
  createSignatureForOrderPayment,
  isLocalTestPaymentSandboxEnabled,
  verifyCapturedStatusWithRazorpay,
  verifyRazorpayPaymentSignature,
} from './razorpayService';
import { hasVerifiedCapturedPayment, isVerifiedCapturedPayment } from './paymentSecurity';

const ENV_KEYS = [
  'NODE_ENV',
  'APP_URL',
  'ENABLE_LOCAL_TEST_PAYMENT_SANDBOX',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

async function withEnv(
  values: Record<string, string | undefined>,
  run: () => void | Promise<void>,
): Promise<void> {
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    await run();
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('download authorization requires a verified captured payment for the same order', () => {
  const order: OrderRecord = {
    id: 'SYF1234567890ABCDEF123456',
    customerName: 'Test Buyer',
    customerPhone: '9876543210',
    productId: 'fatloss',
    productName: 'Fat Loss Diet Plan',
    razorpayOrderId: 'order_test_123',
    amountPaise: 19900,
    currency: 'INR',
    paymentStatus: 'paid',
    orderStatus: 'completed',
    createdAt: new Date().toISOString(),
  };
  const payment: PaymentRecord = {
    id: 'pay_1',
    razorpayPaymentId: 'pay_test_123',
    razorpayOrderId: order.razorpayOrderId,
    orderId: order.id,
    amountPaise: order.amountPaise,
    currency: 'INR',
    method: 'test',
    status: 'captured',
    captured: true,
    signatureVerified: true,
    createdAt: new Date().toISOString(),
  };

  assert.equal(isVerifiedCapturedPayment(order, payment), true);
  assert.equal(hasVerifiedCapturedPayment(order, [payment]), true);
  assert.equal(isVerifiedCapturedPayment({ ...order, paymentStatus: 'pending' }, payment), false);
  assert.equal(isVerifiedCapturedPayment(order, { ...payment, captured: false }), false);
  assert.equal(isVerifiedCapturedPayment(order, { ...payment, signatureVerified: false }), false);
  assert.equal(isVerifiedCapturedPayment(order, { ...payment, status: 'failed' }), false);
  assert.equal(isVerifiedCapturedPayment(order, { ...payment, orderId: 'another-order' }), false);
  assert.equal(isVerifiedCapturedPayment(order, { ...payment, razorpayOrderId: 'another-order' }), false);
  assert.equal(isVerifiedCapturedPayment(order, { ...payment, amountPaise: 1 }), false);
  assert.equal(isVerifiedCapturedPayment(order, { ...payment, razorpayPaymentId: '' }), false);
});

test('simulated payments require explicit localhost development opt-in', async () => {
  await withEnv(
    {
      NODE_ENV: 'development',
      APP_URL: 'http://localhost:3000',
      ENABLE_LOCAL_TEST_PAYMENT_SANDBOX: undefined,
      RAZORPAY_KEY_ID: undefined,
      RAZORPAY_KEY_SECRET: undefined,
    },
    async () => {
      assert.equal(isLocalTestPaymentSandboxEnabled(), false);
      await assert.rejects(
        createRazorpayOrder({ amountPaise: 19900, receipt: 'test', notes: {} }),
        /Razorpay credentials are required/,
      );

      process.env.ENABLE_LOCAL_TEST_PAYMENT_SANDBOX = 'true';
      assert.equal(isLocalTestPaymentSandboxEnabled(), true);
      const order = await createRazorpayOrder({
        amountPaise: 19900,
        receipt: 'test',
        notes: {},
      });
      assert.equal(order.mode, 'test-sandbox');
      assert.match(order.razorpayOrderId, /^order_test_/);

      process.env.NODE_ENV = 'production';
      assert.equal(isLocalTestPaymentSandboxEnabled(), false);
      process.env.NODE_ENV = 'development';
      process.env.APP_URL = 'https://public.example';
      assert.equal(isLocalTestPaymentSandboxEnabled(), false);
    },
  );
});

test('payment signatures are rejected without a secret and bind the order ID', async () => {
  await withEnv(
    {
      NODE_ENV: 'development',
      APP_URL: 'http://localhost:3000',
      ENABLE_LOCAL_TEST_PAYMENT_SANDBOX: 'true',
      RAZORPAY_KEY_ID: undefined,
      RAZORPAY_KEY_SECRET: undefined,
    },
    () => {
      const signature = createSignatureForOrderPayment('order_test_1', 'pay_test_1');
      assert.equal(
        verifyRazorpayPaymentSignature('order_test_1', 'pay_test_1', signature),
        true,
      );
      assert.equal(
        verifyRazorpayPaymentSignature('order_test_2', 'pay_test_1', signature),
        false,
      );
      process.env.ENABLE_LOCAL_TEST_PAYMENT_SANDBOX = 'false';
      assert.equal(
        verifyRazorpayPaymentSignature('order_test_1', 'pay_test_1', signature),
        false,
      );
    },
  );
});

test('captured status must match Razorpay order, amount, and INR currency', async () => {
  await withEnv(
    {
      NODE_ENV: 'test',
      APP_URL: 'https://public.example',
      ENABLE_LOCAL_TEST_PAYMENT_SANDBOX: 'false',
      RAZORPAY_KEY_ID: 'rzp_test_key',
      RAZORPAY_KEY_SECRET: 'test-secret',
    },
    async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            status: 'captured',
            captured: true,
            amount: 19900,
            currency: 'INR',
            order_id: 'order_expected',
            method: 'upi',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );

      try {
        assert.deepEqual(
          await verifyCapturedStatusWithRazorpay('pay_test_1', 19900, 'order_expected'),
          { captured: true, method: 'upi' },
        );
        assert.equal(
          (await verifyCapturedStatusWithRazorpay('pay_test_1', 19900, 'order_other')).captured,
          false,
        );
        assert.equal(
          (await verifyCapturedStatusWithRazorpay('pay_test_1', 20000, 'order_expected')).captured,
          false,
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    },
  );
});
