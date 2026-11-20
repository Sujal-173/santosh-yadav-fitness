import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createUpiIntent,
  getPaytmTransactionStatus,
  getUpiAutoSettings,
  isUpiAutoConfigured,
} from './upiAutoService';
import type { SiteConfigRecord } from './store';

test('UPI Auto setup requires enabled status, a MID and a valid VPA', () => {
  const base = {
    enabled: true,
    merchantId: 'PAYTM-MID-123',
    upiId: 'merchant@paytm',
    expiryMinutes: 10,
  };
  const config = { upiAuto: base } as SiteConfigRecord;
  assert.equal(isUpiAutoConfigured(getUpiAutoSettings(config)), true);
  assert.equal(isUpiAutoConfigured(getUpiAutoSettings({ upiAuto: { ...base, enabled: false } } as SiteConfigRecord)), false);
  assert.equal(isUpiAutoConfigured(getUpiAutoSettings({ upiAuto: { ...base, upiId: 'not-a-vpa' } } as SiteConfigRecord)), false);
});

test('UPI intent contains the correct VPA, amount, INR currency and unique order reference', () => {
  const intent = createUpiIntent({
    upiId: 'merchant@paytm',
    amountPaise: 19900,
    payeeName: 'Santosh Yadav Fitness',
    orderId: 'SYF0123456789ABCDEF012345',
    purpose: 'Fat Loss Diet Plan',
  });
  const url = new URL(intent.upiUri);
  assert.equal(url.protocol, 'upi:');
  assert.equal(url.searchParams.get('pa'), 'merchant@paytm');
  assert.equal(url.searchParams.get('am'), '199.00');
  assert.equal(url.searchParams.get('cu'), 'INR');
  assert.equal(url.searchParams.get('tr'), 'SYF0123456789ABCDEF012345');
  assert.ok(intent.qrCodeUrl.includes(encodeURIComponent(intent.upiUri)));
  assert.ok(intent.appLinks.phonepe.startsWith('phonepe://'));
});

test('Paytm status query is bound to the expected MID and order ID and parses transaction amount', async () => {
  const originalFetch = globalThis.fetch;
  let requestBody = '';
  globalThis.fetch = async (_input, init) => {
    requestBody = String(init?.body || '');
    return new Response(JSON.stringify({
      MID: 'PAYTM-MID-123',
      ORDERID: 'SYF0123456789ABCDEF012345',
      TXNID: '202611201234567890',
      TXNAMOUNT: '199.00',
      PAYMENTMODE: 'UPI',
      STATUS: 'TXN_SUCCESS',
      RESPMSG: 'Txn Success',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const result = await getPaytmTransactionStatus('PAYTM-MID-123', 'SYF0123456789ABCDEF012345');
    assert.deepEqual(result, {
      status: 'success',
      transactionId: '202611201234567890',
      amountPaise: 19900,
      paymentMode: 'UPI',
      responseMessage: 'Txn Success',
    });
    const body = new URLSearchParams(requestBody);
    assert.deepEqual(JSON.parse(body.get('JsonData') || '{}'), {
      MID: 'PAYTM-MID-123',
      ORDERID: 'SYF0123456789ABCDEF012345',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Paytm status service rejects a response that belongs to another order', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    MID: 'PAYTM-MID-123',
    ORDERID: 'A-DIFFERENT-ORDER',
    STATUS: 'TXN_SUCCESS',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    await assert.rejects(
      getPaytmTransactionStatus('PAYTM-MID-123', 'SYF0123456789ABCDEF012345'),
      /did not match/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test('Paytm status service rejects an explicitly mismatched MID', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    MID: 'SOME-OTHER-MERCHANT',
    ORDERID: 'SYF0123456789ABCDEF012345',
    TXNID: '202611201234567890',
    TXNAMOUNT: '199.00',
    STATUS: 'TXN_SUCCESS',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    await assert.rejects(
      getPaytmTransactionStatus('PAYTM-MID-123', 'SYF0123456789ABCDEF012345'),
      /different merchant ID/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Paytm status service accepts a wrapped successful response with exact order binding', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ body: {
    MID: 'PAYTM-MID-123',
    ORDERID: 'SYF0123456789ABCDEF012345',
    TXNID: '202611201234567891',
    TXNAMOUNT: '199.00',
    STATUS: 'TXN_SUCCESS',
  } }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    const result = await getPaytmTransactionStatus('PAYTM-MID-123', 'SYF0123456789ABCDEF012345');
    assert.equal(result.status, 'success');
    assert.equal(result.transactionId, '202611201234567891');
    assert.equal(result.amountPaise, 19900);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Paytm status amount must be a valid INR decimal with no more than two fraction digits', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ORDERID: 'SYF0123456789ABCDEF012345',
    BANKTXNID: '202611201234567890',
    TXNAMOUNT: '199.001',
    STATUS: 'TXN_SUCCESS',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    const result = await getPaytmTransactionStatus('PAYTM-MID-123', 'SYF0123456789ABCDEF012345');
    assert.equal(result.status, 'success');
    assert.equal(result.amountPaise, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Paytm invalid-order lookup errors are pending, not customer payment failures', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    MID: 'PAYTM-MID-123',
    ORDERID: 'SYF0123456789ABCDEF012345',
    STATUS: 'TXN_FAILURE',
    RESPCODE: '309',
    RESPMSG: 'Invalid Order Id',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    const result = await getPaytmTransactionStatus('PAYTM-MID-123', 'SYF0123456789ABCDEF012345');
    assert.equal(result.status, 'pending');
    assert.match(result.responseMessage || '', /Invalid Order Id/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Paytm NO_RECORD_FOUND is pending even when no transaction has been indexed yet', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ body: {
    resultInfo: {
      resultCode: '331',
      resultStatus: 'NO_RECORD_FOUND',
      resultMsg: 'No Record Found',
    },
  } }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    const result = await getPaytmTransactionStatus('PAYTM-MID-123', 'SYF0123456789ABCDEF012345');
    assert.equal(result.status, 'pending');
    assert.match(result.responseMessage || '', /No Record Found/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('newer Paytm resultInfo responses remain pending until signature verification is implemented', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ body: {
    mid: 'PAYTM-MID-123',
    orderId: 'SYF0123456789ABCDEF012345',
    txnId: '202611201234567890',
    txnAmount: '199.00',
    paymentMode: 'UPI',
    resultInfo: {
      resultCode: '227',
      resultStatus: 'TXN_FAILURE',
      resultMsg: 'Your payment has been declined by your bank.',
    },
  } }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    const result = await getPaytmTransactionStatus('PAYTM-MID-123', 'SYF0123456789ABCDEF012345');
    assert.equal(result.status, 'pending');
    assert.match(result.responseMessage || '', /cannot authenticate|unconfirmed/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('unknown Paytm TXN_FAILURE response remains pending instead of being assumed final', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    MID: 'PAYTM-MID-123',
    ORDERID: 'SYF0123456789ABCDEF012345',
    STATUS: 'TXN_FAILURE',
    RESPMSG: 'Could not resolve transaction status',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    const result = await getPaytmTransactionStatus('PAYTM-MID-123', 'SYF0123456789ABCDEF012345');
    assert.equal(result.status, 'pending');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
