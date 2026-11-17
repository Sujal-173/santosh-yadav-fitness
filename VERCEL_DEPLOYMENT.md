# Santosh Yadav Fitness — Vercel deployment

This version uses Next.js App Router for site rendering and a Next.js catch-all Route Handler as the Vercel API entry point. The existing Express API implementation is retained behind a Vercel-compatible adapter to preserve the existing payment/admin logic. There is no separate Express server to deploy. This is a Next.js-hosted compatibility migration, not yet a pure native Route Handler rewrite of every backend controller.

## Vercel project settings

Run `npm install` locally once after extracting the ZIP, commit the generated `package-lock.json`, and then deploy. This workspace could not contact the npm registry to regenerate the lockfile.


- Framework preset: Next.js
- Root directory: project root
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave blank / default
- Node.js: 22.x

## Required environment variables

Add these in Vercel Project → Settings → Environment Variables. Use Preview environment for Razorpay test keys, Production environment for live keys. Vercel sets `VERCEL_ENV` automatically; do not add it manually.

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
PRODUCT_FATLOSS_PDF_FILENAME=fat-loss-diet-plan.pdf
PRODUCT_FATLOSS_PRICE_PAISE=19900
PRODUCT_WEIGHT_GAIN_NAME=Weight Gain Diet Plan
PRODUCT_WEIGHT_GAIN_DESCRIPTION=Affordable Indian food guide for healthy weight gain.
PRODUCT_WEIGHT_GAIN_PDF_FILENAME=weight-gain-diet-plan.pdf
PRODUCT_WEIGHT_GAIN_PRICE_PAISE=19900
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
RAZORPAY_KEY_ID=rzp_test_... # Preview; rzp_live_... only on Production
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
GOOGLE_SHEET_ID=...
GOOGLE_SHEET_TAB=Leads
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

Other optional config keys from `.env.example` can be added for social links and hero copy. `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` must be stored server-side only, never in `NEXT_PUBLIC_*` variables. Share the Google Sheet with the service-account email as Editor.

Generate the admin password hash locally:

```bash
npm install
npm run admin:hash -- "A-strong-password-with-at-least-14-characters"
```

Copy the full output into `ADMIN_PASSWORD_HASH`. Do not use the password itself as the hash.

## Storage setup

1. Create a MongoDB Atlas database and allow the Vercel deployment to connect. Use a strong database user and TLS `mongodb+srv://` URI.
2. Create an Upstash Redis database and use its TLS `rediss://` URL.
3. Create a **Private** Vercel Blob store and attach it to this Vercel project. Vercel will add `BLOB_READ_WRITE_TOKEN`.
4. After deploy, open Admin → Products & PDFs and upload the approved Fat Loss and Weight Gain PDFs. The API stores them in private Blob storage. Production order creation is blocked until the matching PDF exists, preventing a customer from paying for a plan whose PDF is missing. Downloads are issued only after verified captured payments.

## Razorpay setup

- Preview: set Razorpay Test Key ID/Secret. The backend allows test keys for Vercel Preview deployments.
- Production: set Live Key ID/Secret and a dedicated webhook secret.
- Configure webhook URL: `https://YOUR_PRODUCTION_DOMAIN/api/webhooks/razorpay`.
- Subscribe to `payment.captured` and `payment.failed`.
- Set the webhook secret to the exact value stored in `RAZORPAY_WEBHOOK_SECRET`.

## API/runtime notes

- `app/api/[...path]/route.ts` is the Next Route Handler that dispatches the existing `/api/*` Express routes. It uses the Node.js runtime and is capped at 60 seconds.
- The legacy store is one MongoDB document. A Redis lock serializes requests and the document is refreshed from MongoDB per request to prevent warm-instance stale state and lost updates. This is appropriate only for low-volume MVP traffic; before scaling, migrate to separate MongoDB collections with atomic per-record operations.
- Vercel Function request/response payload limit is 4.5 MB. The admin PDF upload is limited to 3 MB to stay within this limit.
- Private PDF files are stored in Vercel Private Blob, not the Vercel function filesystem.
- `GET /api/health` reports MongoDB and Redis health without revealing secrets.

## Validation checklist

1. Preview URL `/api/health` returns 200 with both MongoDB and Redis `true`.
2. Preview `/api/config` returns configured test Razorpay key ID.
3. Admin login works and remains signed in after reload.
4. Upload both approved PDF files through Admin.
5. Test Google Sheets integration and sync pending leads.
6. Complete a Razorpay Test Mode purchase and verify the matching private PDF is downloaded.
7. Verify captured and failed payment webhooks from Razorpay dashboard.
8. Only after all checks pass, add live Razorpay keys and webhook settings to Production environment and redeploy.

## Commercial-plan note

Vercel Hobby is restricted to personal/non-commercial use. This storefront sells paid digital products, so do not run its commercial production activity under Hobby; use a Vercel plan whose terms permit commercial use. Verify current pricing/terms before launch. The function entry point is capped at 60 seconds for broad plan compatibility, but the plan restriction still applies.
