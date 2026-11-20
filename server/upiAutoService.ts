import type { SiteConfigRecord } from './store';

export interface UpiAutoSettings {
  enabled: boolean;
  merchantId: string;
  upiId: string;
  expiryMinutes: number;
}

export interface UpiIntentBundle {
  upiUri: string;
  qrCodeUrl: string;
  appLinks: {
    gpay: string;
    phonepe: string;
    paytm: string;
    bhim: string;
  };
}

export interface PaytmStatusResponse {
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  amountPaise?: number;
  paymentMode?: string;
  responseMessage?: string;
}

const PAYTM_STATUS_URL = 'https://securegw.paytm.in/merchant-status/getTxnStatus';

function parseAmountPaise(value: unknown): number | undefined {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value ?? '').trim());
  if (!match) return undefined;
  const rupees = Number(match[1]);
  const paise = Number((match[2] || '').padEnd(2, '0') || '0');
  const total = rupees * 100 + paise;
  return Number.isSafeInteger(total) ? total : undefined;
}

export function getUpiAutoSettings(siteConfig?: SiteConfigRecord): UpiAutoSettings {
  const configured = siteConfig?.upiAuto;
  return {
    enabled: Boolean(configured?.enabled),
    merchantId: (configured?.merchantId || '').trim(),
    upiId: (configured?.upiId || '').trim(),
    expiryMinutes: Math.min(60, Math.max(5, Number(configured?.expiryMinutes) || 10)),
  };
}

export function isUpiAutoConfigured(settings: UpiAutoSettings): boolean {
  return Boolean(settings.enabled && settings.merchantId && /^[^\s@]+@[^\s@]+$/.test(settings.upiId));
}

export function createUpiIntent(params: {
  upiId: string;
  amountPaise: number;
  payeeName: string;
  orderId: string;
  purpose: string;
}): UpiIntentBundle {
  const intentParams = new URLSearchParams({
    pa: params.upiId,
    pn: params.payeeName.slice(0, 50),
    am: (params.amountPaise / 100).toFixed(2),
    cu: 'INR',
    tr: params.orderId,
    tn: params.purpose.slice(0, 80),
  });
  const query = intentParams.toString();
  const upiUri = `upi://pay?${query}`;

  return {
    upiUri,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(upiUri)}`,
    appLinks: {
      gpay: `gpay://upi/pay?${query}`,
      phonepe: `phonepe://upi/pay?${query}`,
      paytm: `paytm://upi/pay?${query}`,
      bhim: `upi://pay?${query}`,
    },
  };
}

/**
 * SMMHUT's Paytm_business integration queries this endpoint with MID and ORDERID.
 * Keep TLS verification enabled (the source archive disabled it, which is unsafe).
 * The returned order, MID and amount are checked by the caller before fulfillment.
 */
export async function getPaytmTransactionStatus(
  merchantId: string,
  orderId: string,
): Promise<PaytmStatusResponse> {
  // Keep the request shape used by the supplied SMMHUT reference implementation.
  // Paytm's legacy endpoint expects the JsonData form field containing MID + ORDERID.
  const payload = new URLSearchParams({
    JsonData: JSON.stringify({ MID: merchantId, ORDERID: orderId }),
  }).toString();

  const response = await fetch(PAYTM_STATUS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: payload,
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Paytm status service returned HTTP ${response.status}: ${responseText.slice(0, 300)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(`Paytm returned a non-JSON status response: ${responseText.slice(0, 300)}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Paytm returned an invalid status response.');
  }

  const outer = parsed as Record<string, unknown>;
  // Paytm's legacy status endpoint returns a flat payload. Newer Paytm APIs use
  // { head, body: { resultInfo, ...transactionFields } }. Parse both shapes.
  const raw = outer.body && typeof outer.body === 'object' && !Array.isArray(outer.body)
    ? outer.body as Record<string, unknown>
    : outer;
  const resultInfo = raw.resultInfo && typeof raw.resultInfo === 'object' && !Array.isArray(raw.resultInfo)
    ? raw.resultInfo as Record<string, unknown>
    : {};

  const legacyStatus = String(raw.STATUS || raw.status || '').trim().toUpperCase();
  const apiStatus = String(resultInfo.resultStatus || '').trim().toUpperCase();
  const status = legacyStatus || apiStatus;
  const responseCode = String(
    raw.RESPCODE || raw.respCode || resultInfo.resultCode || '',
  ).trim().toUpperCase();
  const responseOrderId = String(
    raw.ORDERID || raw.ORDER_ID || raw.orderId || raw.orderID || '',
  ).trim();
  const responseMid = String(raw.MID || raw.mid || '').trim();
  const transactionId = String(
    raw.TXNID || raw.BANKTXNID || raw.txnId || raw.bankTxnId || raw.bankTransactionId || '',
  ).trim();
  const amountPaise = parseAmountPaise(
    raw.TXNAMOUNT ?? raw.TXN_AMOUNT ?? raw.txnAmount ?? raw.amount,
  );
  const paymentMode = String(raw.PAYMENTMODE || raw.paymentMode || 'UPI');
  const responseMessage = String(
    raw.RESPMSG || raw.respMsg || resultInfo.resultMsg || '',
  );

  // A status lookup error is not a payment outcome. Paytm's status API can
  // return TXN_FAILURE for Invalid Order ID / invalid MID, and NO_RECORD_FOUND
  // when the payment order is not visible yet. Never mark these as a customer
  // payment failure. Only a successful lookup for this exact order may do so.
  const lookupErrorCodes = new Set(['309', '331', '334', '335', '501']);
  if (status === 'NO_RECORD_FOUND' || lookupErrorCodes.has(responseCode)) {
    return {
      status: 'pending',
      transactionId: transactionId || undefined,
      amountPaise,
      paymentMode,
      responseMessage: `Paytm status lookup issue (${responseCode || status}): ${responseMessage || 'no matching gateway transaction was found'}. This does not prove your UPI payment failed. Do not pay again until the transaction is checked.`,
    };
  }

  // The current checkout still calls the legacy unsigned form endpoint. Do
  // not trust success/failure fields from Paytm's newer signed JSON API shape
  // until that API's request/response signature flow has been implemented.
  if (!legacyStatus && apiStatus) {
    return {
      status: 'pending',
      transactionId: transactionId || undefined,
      amountPaise,
      paymentMode,
      responseMessage: 'Paytm returned a newer status format that this legacy integration cannot authenticate. Payment remains unconfirmed; contact support before paying again.',
    };
  }

  // Successful or terminal-failure transaction results must be correlated to
  // the order. A mismatched MID is always rejected. Older responses may omit MID.
  if (responseOrderId && responseOrderId !== orderId) {
    throw new Error('Paytm status response did not match the requested order ID.');
  }
  if (responseMid && responseMid !== merchantId) {
    throw new Error('Paytm status response belongs to a different merchant ID.');
  }

  if (status === 'TXN_SUCCESS') {
    if (!responseOrderId) {
      throw new Error('Paytm successful status response did not include an order ID.');
    }
    return {
      status: 'success',
      transactionId: transactionId || undefined,
      amountPaise,
      paymentMode,
      responseMessage: responseMessage || 'Transaction successful',
    };
  }

  // Fail closed: only documented transaction-decline codes, together with an
  // exact order match, are treated as a failed customer payment. Generic or
  // unrecognized TXN_FAILURE responses remain pending for reconciliation.
  const confirmedDeclineCodes = new Set(['227', '235', '295', '401', '810', '820', '843']);
  if (status === 'TXN_FAILURE' && responseOrderId === orderId && confirmedDeclineCodes.has(responseCode)) {
    return {
      status: 'failed',
      transactionId: transactionId || undefined,
      amountPaise,
      paymentMode,
      responseMessage: responseMessage || `Paytm confirmed transaction failure (${responseCode}).`,
    };
  }

  return {
    status: 'pending',
    transactionId: transactionId || undefined,
    amountPaise,
    paymentMode,
    responseMessage: responseMessage || (status
      ? `Paytm returned ${status}${responseCode ? ` (${responseCode})` : ''}; payment outcome is not confirmed yet.`
      : 'Paytm has not confirmed this payment yet'),
  };
}
