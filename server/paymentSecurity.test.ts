import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { OrderRecord, PaymentRecord } from './store';
import { hasVerifiedCapturedPayment, isVerifiedCapturedPayment } from './paymentSecurity';

const upiOrder: OrderRecord = {
  id: 'SYF0123456789ABCDEF012345',
  customerName: 'Test Buyer',
  customerPhone: '9876543210',
  productId: 'fatloss',
  productName: 'Fat Loss Diet Plan',
  gateway: 'upi_auto',
  gatewayOrderId: 'SYF0123456789ABCDEF012345',
  gatewayMerchantId: 'PAYTM-MID-123',
  amountPaise: 19900,
  currency: 'INR',
  paymentStatus: 'paid',
  orderStatus: 'completed',
  expiresAt: new Date(Date.now() + 60000).toISOString(),
  createdAt: new Date().toISOString(),
};

const capturedUpiPayment: PaymentRecord = {
  id: 'pay_1',
  gateway: 'upi_auto',
  gatewayOrderId: upiOrder.gatewayOrderId,
  upiTransactionId: '202611201234567890',
  orderId: upiOrder.id,
  amountPaise: 19900,
  currency: 'INR',
  method: 'UPI',
  status: 'captured',
  captured: true,
  gatewayVerified: true,
  createdAt: new Date().toISOString(),
};

test('UPI download access requires a matching server-verified Paytm transaction', () => {
  assert.equal(isVerifiedCapturedPayment(upiOrder, capturedUpiPayment), true);
  assert.equal(hasVerifiedCapturedPayment(upiOrder, [capturedUpiPayment]), true);
  assert.equal(isVerifiedCapturedPayment({ ...upiOrder, paymentStatus: 'pending' }, capturedUpiPayment), false);
  assert.equal(isVerifiedCapturedPayment(upiOrder, { ...capturedUpiPayment, captured: false }), false);
  assert.equal(isVerifiedCapturedPayment(upiOrder, { ...capturedUpiPayment, gatewayVerified: false }), false);
  assert.equal(isVerifiedCapturedPayment(upiOrder, { ...capturedUpiPayment, status: 'failed' }), false);
  assert.equal(isVerifiedCapturedPayment(upiOrder, { ...capturedUpiPayment, orderId: 'another-order' }), false);
  assert.equal(isVerifiedCapturedPayment(upiOrder, { ...capturedUpiPayment, gatewayOrderId: 'another-order' }), false);
  assert.equal(isVerifiedCapturedPayment(upiOrder, { ...capturedUpiPayment, upiTransactionId: '' }), false);
  assert.equal(isVerifiedCapturedPayment(upiOrder, { ...capturedUpiPayment, amountPaise: 1 }), false);
});

test('historical Razorpay orders keep access only when their old signature verification is intact', () => {
  const legacyOrder: OrderRecord = {
    id: 'SYF-LEGACY-1234',
    customerName: 'Legacy Buyer',
    customerPhone: '9876543210',
    productId: 'gain',
    productName: 'Weight Gain Diet Plan',
    razorpayOrderId: 'order_legacy_123',
    amountPaise: 19900,
    currency: 'INR',
    paymentStatus: 'paid',
    orderStatus: 'completed',
    createdAt: new Date().toISOString(),
  };
  const legacyPayment: PaymentRecord = {
    id: 'pay_legacy',
    razorpayPaymentId: 'pay_legacy_123',
    razorpayOrderId: 'order_legacy_123',
    orderId: legacyOrder.id,
    amountPaise: 19900,
    currency: 'INR',
    method: 'upi',
    status: 'captured',
    captured: true,
    signatureVerified: true,
    createdAt: new Date().toISOString(),
  };

  assert.equal(hasVerifiedCapturedPayment(legacyOrder, [legacyPayment]), true);
  assert.equal(hasVerifiedCapturedPayment(legacyOrder, [{ ...legacyPayment, signatureVerified: false }]), false);
});
