import type { OrderRecord, PaymentRecord } from './store';

export function isVerifiedCapturedPayment(
  order: OrderRecord,
  payment: PaymentRecord,
): boolean {
  return (
    order.paymentStatus === 'paid' &&
    Boolean(payment.razorpayPaymentId) &&
    Boolean(payment.razorpayOrderId) &&
    payment.orderId === order.id &&
    payment.razorpayOrderId === order.razorpayOrderId &&
    payment.amountPaise === order.amountPaise &&
    payment.currency === 'INR' &&
    payment.status === 'captured' &&
    payment.captured &&
    payment.signatureVerified
  );
}

export function hasVerifiedCapturedPayment(
  order: OrderRecord,
  payments: PaymentRecord[],
): boolean {
  return payments.some((payment) => isVerifiedCapturedPayment(order, payment));
}
