/**
 * Validate the shape of an order ID received from the browser.
 * The order must still be found in the server-side store before it can be
 * verified. Do not couple this check to one historical ID-generation format.
 */
export function normalizeOrderId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const orderId = value.trim();
  if (orderId.length < 4 || orderId.length > 128) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(orderId)) return null;
  return orderId;
}
