<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/408971df-87e9-46de-8a0c-43a69b775b67

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## MongoDB, Redis and secure admin setup

1. Copy `.env.example` to `.env`. Replace both local development passwords with unique values. Keep `.env` out of Git.
2. Install dependencies with `npm install`.
3. Start local infrastructure with `npm run infra:up`.
4. Generate the admin password hash: `npm run admin:hash -- "a-long-unique-password-of-14-characters-or-more"`.
5. Put the returned `salt:hash` string into `ADMIN_PASSWORD_HASH`; set `ADMIN_EMAIL`.
6. Fill `WHATSAPP_NUMBER`, `SUPPORT_EMAIL`, product prices (in paise), and optional public profile fields in `.env`.
7. Check the services with `npm run db:check`.
8. Start the app with `npm run dev`. Admin login is at `/admin`.

The server refuses to start if required local configuration is missing. In production it additionally requires HTTPS `APP_URL`, Razorpay live keys, a webhook secret, a TLS MongoDB URI and a TLS Redis URL. Never use the sample development passwords or sandbox payment keys in production.

### Persistence model

The current app's store model is persisted as one MongoDB document in the collection configured by `MONGODB_STORE_COLLECTION`. Writes are serialized and awaited before mutating API requests return. This keeps the existing application logic and storefront UI intact. It is a single-writer persistence design; before running multiple API replicas or high write volume, migrate the store to separate collections with transactional repository methods and optimistic concurrency.

Redis stores opaque admin session tokens (only token hashes are used as keys) and shared rate-limit counters. Admin sessions are revoked on logout and expire according to `ADMIN_SESSION_TTL_SECONDS`.

### Payments and leads

Leads are stored in the MongoDB-backed store and shown in Admin → Leads. Orders and payment attempts are shown in Admin → Orders and Admin → Transactions. Razorpay webhooks update completed/failed transaction state; client-side failure reports are only diagnostic and never mark a payment as completed. Successful delivery still requires a verified Razorpay signature and a captured amount matching the server-created order.

Google service-account private keys and Apps Script webhook secrets are read only from environment variables; they are not stored in MongoDB. If a legacy local `data/store.json` is present and MongoDB has no application snapshot yet, startup imports it once and strips those legacy secrets before writing to MongoDB.

Install the `express-async-errors` compatibility shim (included in dependencies) so asynchronous API handler failures reach the centralized Express error handler.

### Secure payment and deployment checklist

- Configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in the backend host's secret manager. Use `rzp_test_` credentials only for testing and `rzp_live_` credentials for production. The key secret and webhook secret must never be exposed as `VITE_*` variables or committed.
- Set Razorpay's webhook URL to `https://<your-domain>/api/webhooks/razorpay`, use the same webhook secret, and subscribe to `payment.captured` and `payment.failed`. A browser callback alone cannot mark an order paid.
- Keep `ENABLE_LOCAL_TEST_PAYMENT_SANDBOX=false` on every deployed environment. It can only be enabled for `NODE_ENV=development` when `APP_URL` is localhost; it exists solely for local UI testing and does not represent a real payment.
- Set all required backend values from `.env.example` in the hosting provider, including `NODE_ENV=production`, HTTPS `APP_URL`, live Razorpay keys, TLS MongoDB and Redis URLs, admin credentials, product names/descriptions/prices, WhatsApp number, and support email. Generate `ADMIN_PASSWORD_HASH` with `npm run admin:hash -- "your-unique-password"`.
- Build and start the Express application with `npm run build` and `npm start`. This project requires a Node.js host that runs the Express API alongside the built frontend; a static-only Vite deployment does not provide payment verification, webhooks, or protected PDF downloads.
- Keep `private-pdfs` out of this public repository; it may contain paid product PDFs. The server generates fallback PDFs when files are absent. If admins upload replacements, mount `private-pdfs` on secure persistent storage on the server. The files are intentionally outside `dist`; Vite development file serving denies direct access to them, while production serves the frontend only from `dist`.
- Keep this store on one application instance, as described in Persistence model. Do not enable multiple API replicas until the store's single-document persistence is migrated to concurrency-safe repositories.
- Run `npm run test`, `npm run lint`, and `npm run build` before deployment. Never use simulated payments or sandbox credentials to accept production orders.


### Google Sheets lead sheet formatting

Both Google Sheets modes format the configured lead tab and a separate `Payments` tab with a dark navy header, orange accent, frozen header and ID columns, alternating row bands, wrapped body text, filters, and readable column widths. Each order is upserted by its internal order ID, so payment state changes update the existing row rather than adding duplicate order rows. The payment tab includes buyer and plan details, INR amount, canonical payment status, latest attempt status, and order/payment/attempt timestamps in `Asia/Kolkata` (`dd/MM/yyyy hh:mm:ss AM/PM IST`). Browser-reported failures remain labeled unverified and do not replace the canonical payment status. Use the admin sync action to backfill existing orders and retry pending leads.

Existing lead rows and headers are preserved; the integration does not clear the tab. The service account must have Editor access to the spreadsheet and the Google Sheets API must be enabled. Save the Sheet ID and lead tab name in the admin panel; set `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (or `GOOGLE_APPS_SCRIPT_WEBHOOK_URL`) in the backend environment and restart the backend after changes. Secrets are not stored in MongoDB. For Apps Script mode, copy the generated script into the bound spreadsheet, save it, and deploy a new web app version. The script creates the `Payments` tab automatically the first time a payment row is synced.
