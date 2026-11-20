import type { OrderRecord, PaymentRecord } from './store';

export function isVerifiedCapturedPayment(
  order: OrderRecord,
  payment: PaymentRecord,
): boolean {
  if (
    order.paymentStatus !== 'paid' ||
    payment.orderId !== order.id ||
    payment.amountPaise !== order.amountPaise ||
    payment.currency !== 'INR' ||
    payment.status !== 'captured' ||
    !payment.captured
  ) {
    return false;
  }

  if (order.gateway === 'upi_auto') {
    return Boolean(
      payment.gateway === 'upi_auto' &&
      payment.gatewayOrderId === order.gatewayOrderId &&
      payment.upiTransactionId &&
      payment.gatewayVerified,
    );
  }

  // Compatibility for existing verified Razorpay orders; no new Razorpay payments are accepted.
  return Boolean(
    payment.signatureVerified &&
    payment.razorpayPaymentId &&
    payment.razorpayOrderId &&
    payment.razorpayOrderId === order.razorpayOrderId,
  );
}

export function hasVerifiedCapturedPayment(
  order: OrderRecord,
  payments: PaymentRecord[],
): boolean {
  return payments.some((payment) => isVerifiedCapturedPayment(order, payment));
}
