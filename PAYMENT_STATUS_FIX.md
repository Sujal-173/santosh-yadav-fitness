# UPI payment status recovery fix

This update addresses delayed UPI status confirmation in the UPI Auto checkout.

## Changes

- The Paytm status client reads the full response body and returns a useful server-side error if Paytm returns non-JSON, HTTP errors, or an invalid response.
- It accepts the flat response used by the SMMHUT reference and a wrapped `body` response.
- It still requires the Paytm response to contain the exact requested `ORDERID`. If a response includes `MID`, it must match the merchant configured for that order. A missing MID alone no longer causes a false rejection.
- It accepts `TXNID` or, when that is not supplied, `BANKTXNID` as the provider transaction reference.
- Exact amount matching remains mandatory before an order is marked paid or the PDF is unlocked.
- A QR reaching its expiry time no longer causes the backend to stop checking immediately. The site continues status reconciliation for 30 minutes after QR expiry, and expired orders remain manually re-checkable for a late success response.
- The modal displays the pending message returned by the backend and keeps the payment status check available for expired orders.

## Deploy

1. Replace the deployed project with this updated source and deploy it.
2. Confirm the production environment has the correct Paytm MID and receiving UPI VPA saved under Admin → UPI Auto Gateway.
3. Create a new low-value test order after deployment. Complete the UPI payment and keep the checkout open until it confirms.
4. Check the Paytm merchant dashboard for the same order ID. The provider status query must return `TXN_SUCCESS`, the exact `ORDERID`, a matching MID when included, the exact `TXNAMOUNT`, and a transaction reference.

## Important limitation

This remains the SMMHUT-style direct UPI intent + Paytm legacy status lookup flow. A `upi://pay` URI and QR do not, by themselves, notify this website that a payment completed. Automatic confirmation only works when Paytm exposes that QR-originated transaction through the configured MID/order-ID status lookup. If the Paytm dashboard shows the money received but the legacy status API keeps returning `PENDING`, the remaining issue is merchant-side API support/mapping, not browser polling. Obtain the supported UPI QR reconciliation or webhook/API details from Paytm before treating the flow as production-verified.


## Invalid order ID polling fix

- The verification endpoint no longer assumes every valid database order ID must match only the newest `SYF` + 24-hex format. It validates that the supplied value is a safe ID, then looks up the exact order in MongoDB (first by order ID, then by gateway order ID).
- Missing/malformed IDs and IDs absent from MongoDB now return separate error codes (`ORDER_ID_INVALID` and `ORDER_NOT_FOUND`) instead of being conflated.
- The checkout stops automatic polling on permanent 400/404 order errors. Those errors are not treated as pending payment states.
- Each new checkout order remounts the payment modal so it cannot reuse the previous order's local status state.
- Server logs include the request-body shape and masked order-ID metadata for diagnosing a deployment/API mismatch without logging the full ID.

This change does not override Paytm's payment status. An unpaid order should remain `pending`; a paid order is fulfilled only after Paytm reports a matching successful transaction and the exact amount.


## False failure after the first status polls

The Paytm status parser now distinguishes a payment decline from a failed status lookup:

- Paytm response codes `309` (legacy invalid-order response), `331` (no record found), `334` (invalid order ID), `335` (invalid MID), and `501` (server error) remain `pending`. They do not prove that the payer's UPI transaction failed.
- Unknown `TXN_FAILURE` responses also remain pending. A payment is set to `failed` only when Paytm returns a recognized decline code (`227`, `235`, `295`, `401`, `810`, `820`, or `843`) together with the exact requested order ID.
- Newer nested `resultInfo` responses are not trusted for success/failure by this legacy integration because it does not yet implement Paytm's signed JSON request/response flow.
- The checkout now styles pending status as pending rather than using the success/green style.

This is a **false-failure guard**, not a complete Paytm gateway integration. The current order endpoint still builds a generic `upi://pay` intent from a VPA; it does not call Paytm's Dynamic QR Create API. Paytm's documented Dynamic QR flow creates the QR through the merchant API (MID, unique order ID, exact amount, `UPI_QR_CODE`, POS ID and a request signature), then confirms payment through Paytm's status API or configured S2S webhook. The MID + VPA alone are not enough to implement that flow. See:

- https://www.paytmpayments.com/docs/api/create-qr-code-api
- https://www.paytmpayments.com/docs/api/v3/transaction-status-api
- https://www.paytmpayments.com/docs/dynamic-qr-code-payments/

Before enabling live payments, obtain the Paytm merchant key/client ID and POS ID, implement signed dynamic QR creation and signed status verification (or Paytm's configured webhook), and reconcile a low-value test against the Paytm dashboard. Until then, the app intentionally keeps uncertain transactions pending and does not unlock the PDF.
