# Santosh Yadav Fitness — Vercel deployment

This project uses Next.js App Router for site rendering and a Next.js catch-all Route Handler as the Vercel API entry point. The Express API implementation is retained behind a Vercel-compatible adapter. There is no separate Express process to deploy.

## Vercel project settings

- Framework preset: Next.js
- Root directory: project root
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave blank / default
- Node.js: 22.x

## Required environment variables

Add these in Vercel Project → Settings → Environment Variables:

```env
APP_URL=https://YOUR_PRODUCTION_DOMAIN
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=santosh_yadav_fitness
MONGODB_STORE_COLLECTION=application_state
REDIS_URL=rediss://...
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD_HASH=generated-salt:generated-scrypt-hash
BRAND_NAME=Santosh Yadav Fitness
WHATSAPP_NUMBER=918770423010
SUPPORT_EMAIL=your-support-email@example.com
PRODUCT_FATLOSS_NAME=Fat Loss Diet Plan
PRODUCT_FATLOSS_DESCRIPTION=Simple Indian diet guide for a sustainable fat-loss routine.
PRODUCT_FATLOSS_PRICE_PAISE=19900
PRODUCT_WEIGHT_GAIN_NAME=Weight Gain Diet Plan
PRODUCT_WEIGHT_GAIN_DESCRIPTION=Affordable Indian food guide for healthy weight gain.
PRODUCT_WEIGHT_GAIN_PRICE_PAISE=19900
GOOGLE_SHEET_ID=...
GOOGLE_SHEET_TAB=Leads
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n
```

Other optional configuration keys from `.env.example` can be added for social links and hero copy. `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` must remain server-side and must never use a `NEXT_PUBLIC_*` variable. Share the Google Sheet with the service-account email as Editor.

Generate the admin password hash locally:

```bash
npm install
npm run admin:hash -- "A-strong-password-with-at-least-14-characters"
```

Copy the full `salt:hash` output into `ADMIN_PASSWORD_HASH`. Do not use the password itself as the hash.

## Storage setup

1. Create a MongoDB Atlas database and allow the Vercel deployment to connect. Use a strong database user and TLS `mongodb+srv://` URI.
2. Create an Upstash Redis database and use its TLS `rediss://` URL.
3. No private Blob upload is required for the personalized diet PDFs. The application renders a fresh PDF from the shared server-side content template after payment is verified, using the profile saved with that order.

## Configure UPI Auto in the admin panel

1. Log in to the admin panel using the credentials configured in `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`.
2. Open **UPI Auto Gateway**.
3. Enter the Paytm Business Merchant ID (MID), the receiving UPI ID/VPA, and expiry (5–60 minutes).
4. Save the settings. Keep **Enable UPI Auto payments** unchecked until Paytm confirms that your merchant account can query payment status for QR-originated order IDs using the legacy endpoint in this implementation.
5. After written/account-level confirmation, enable the gateway and run a low-value end-to-end test. Verify the exact transaction and amount in the Paytm merchant dashboard before promoting the deployment to customers.

### Important Paytm compatibility warning

This implementation follows the uploaded SMMHUT source: it creates a `upi://pay` intent with a unique order ID, displays a QR/deep links, then queries `https://securegw.paytm.in/merchant-status/getTxnStatus` using MID and ORDERID. The SMMHUT source did not initiate a standard Paytm PG transaction or use a transaction token. Paytm's published Payment Gateway flow documents a different process: initiate the transaction server-side, obtain a `txnToken`, then verify status and checksum. The SMMHUT-style lookup is account/integration dependent and should not be assumed to work for every VPA or MID. If Paytm cannot map the QR payment to the given merchant order ID, the order will remain pending and the PDF will not be released.

Official docs:
- [Paytm Payment Flow](https://business.paytm.com/docs/miniapps/payment-flow)
- [Paytm payment callback response and amount-validation fields](https://business.paytm.com/docs/api/miniapps/payment-flow/paytmpayment)

## API/runtime notes

- `app/api/[...path]/route.ts` dispatches `/api/*` Express routes via `serverless-http` on the Node.js runtime.
- The legacy store is one MongoDB document. A Redis lock serializes requests and the document is refreshed per request. This is intended only for low-volume MVP traffic; before scaling, move records into separate collections with atomic operations and idempotent indexes.
- Personalized PDFs are generated per order in the protected download endpoint; no shared customer PDF file is stored or served.
- `GET /api/health` reports MongoDB and Redis health without revealing secrets.

## Validation checklist

1. Preview URL `/api/health` returns 200 with MongoDB and Redis healthy.
2. `GET /api/config` shows whether UPI Auto is configured and returns only the receiving VPA/expiry; it does not expose the MID.
3. Admin login works and remains signed in after reload.
4. Place a test order with a test customer profile, complete a verified payment, and confirm the generated PDF contains that order’s name, measurements, goal, and food preference.
5. Test Google Sheets integration and sync pending leads.
6. Keep UPI Auto disabled until Paytm confirms merchant account compatibility.
7. Enable UPI Auto in Admin, create a low-value test order, complete payment, and verify that the backend records the matching transaction ID/amount and issues the download only after server verification.
8. Check that failed, pending, and expired orders do not unlock the PDF.

## Commercial-plan note

Vercel Hobby is restricted to personal/non-commercial use. This storefront sells paid digital products, so do not run its commercial production activity under Hobby; use a Vercel plan whose terms permit commercial use. Verify current pricing and terms before launch. The function entry point is capped at 60 seconds for broad plan compatibility, but the plan restriction still applies.
