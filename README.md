# Santosh Yadav Fitness — Next.js on Vercel

This package runs the Santosh Yadav Fitness storefront on the Next.js App Router while preserving its React components, layout, styling, animations, copy, and image assets.

## Architecture

- **Web app:** Next.js App Router.
- **API entry point:** `app/api/[...path]/route.ts` is a Next.js Route Handler running on the Node.js runtime. It hosts the Express API implementation through `serverless-http`; no separate Express service is required.
- **Database:** MongoDB Atlas.
- **Sessions and request coordination:** Redis.
- **Paid PDFs:** Vercel Blob Private Storage.
- **Payments:** UPI intent QR and UPI app deep links, with server-side Paytm transaction-status lookup based on the uploaded SMMHUT reference flow.
- **Lead and payment spreadsheet:** Google Sheets API or the configured Apps Script webhook.

The Express controllers are retained behind a Vercel-compatible adapter. This is a Vercel-hosted compatibility architecture, not a controller-by-controller rewrite into native Next.js handlers.

## Local setup

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and configure MongoDB, Redis, admin, Blob, and product settings.
4. Start MongoDB and Redis using your chosen local/hosted setup.
5. Generate an admin password hash: `npm run admin:hash -- "A-strong-password-of-14-or-more-characters"`.
6. Put the generated `salt:hash` string in `ADMIN_PASSWORD_HASH` and set `ADMIN_EMAIL`.
7. Run `npm run dev` and open `http://localhost:3000`.

## Configure UPI Auto

After logging into the admin panel, open **UPI Auto Gateway** and enter:

- **Paytm Business Merchant ID (MID)** — used by the backend for the reference status lookup.
- **UPI ID / VPA** — the receiving UPI address embedded in the customer's QR and UPI intent.
- **QR expiry** — between 5 and 60 minutes.
- Enable the gateway only after confirming with Paytm that your MID supports the status lookup flow used by this integration.

Every checkout creates a unique internal order ID and a fixed-amount UPI intent. The server polls Paytm's status endpoint when the customer opens/checks payment status. It only fulfills the order when the returned merchant and order IDs match, `STATUS` is `TXN_SUCCESS`, the transaction ID is present, and `TXNAMOUNT` exactly matches the stored INR amount. A browser callback or customer click cannot mark an order paid. Historical Razorpay records are retained only so previously verified purchases continue to have download/recovery access; no new Razorpay checkout is active.

**Important integration limitation:** this reproduces the SMMHUT archive's legacy flow (`upi://pay` QR + `securegw.paytm.in/merchant-status/getTxnStatus` lookup with MID and order ID). It is not the standard Paytm Payment Gateway initiate-transaction flow. Paytm's published PG documentation describes an Initiate Transaction API that returns a `txnToken`, followed by a status API and checksum validation. Therefore a Paytm MID alone does not prove that this QR-originated order status lookup is enabled for your account. Confirm compatibility with Paytm before enabling live payments. If Paytm does not report these QR payments against the generated order IDs, the checkout will remain pending and will not unlock the PDF.

Official reference: [Paytm Payment Flow documentation](https://business.paytm.com/docs/miniapps/payment-flow) and [Paytm payment callback fields](https://business.paytm.com/docs/api/miniapps/payment-flow/paytmpayment).

## Vercel deployment

Follow [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md) for project settings and the environment-variable list.

Do not commit `.env`, service-account private keys, MongoDB credentials, Redis credentials, or paid PDF files to source control. The UPI MID and receiving VPA are configured through the authenticated admin panel and are not exposed in public config responses.

## Data model and scaling

The existing backend persists application state as one MongoDB document. A Redis lock serializes mutating API requests, and the backend refreshes the document from MongoDB per API request to avoid stale warm-function reads and lost updates in this low-volume MVP design. It is not intended for high concurrency or horizontal scaling. Before scaling, migrate leads, orders, payments, products, downloads, and audit logs to separate collections with atomic per-record operations and idempotent indexes.

## Payment and delivery safety

- Order amount and product price are loaded from the server-side product record; the browser cannot set the payable amount.
- Payment status is queried by the server. The frontend never submits a self-asserted successful status.
- The server checks Paytm's returned MID, order ID, transaction ID, and amount before marking an order paid.
- Customer-reported cancellation is logged for support only and does not mark an order failed or paid.
- A personalized PDF is generated from the shared server-side template after the order has a verified captured payment. Customer measurements and diet preference are loaded from the stored order.
- PDF download requires a verified captured payment and a time-limited, download-limited token. Each paid order receives a separate profile-personalized PDF; no shared static customer PDF is served.

## Verification status

Run `npm ci`, `npm run lint`, `npm test`, and `npm run build` locally after extracting this archive and before production deployment. A successful local build does not validate the Paytm MID/account compatibility; perform a real low-value payment test and reconcile it in the Paytm merchant dashboard before accepting customer payments.
For the latest UPI payment-status recovery changes and the Paytm compatibility limitation, see [PAYMENT_STATUS_FIX.md](./PAYMENT_STATUS_FIX.md).
