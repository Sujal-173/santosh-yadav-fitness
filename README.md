# Santosh Yadav Fitness — Next.js on Vercel

This package migrates the existing Santosh Yadav Fitness website to the Next.js App Router while preserving its original React components, layout, styling, animations, copy, and image assets.

## Architecture

- **Web app:** Next.js App Router.
- **API entry point:** `app/api/[...path]/route.ts` is a Next.js Route Handler running on the Node.js runtime. It hosts the existing Express API implementation through `serverless-http`, so there is no separate Express process or Render service to deploy.
- **Database:** MongoDB Atlas.
- **Sessions and request coordination:** Redis.
- **Paid PDF files:** Vercel Blob Private Storage; the function filesystem is not used for production PDF storage.
- **Payments:** Razorpay order creation, server-side signature/capture verification, and signed webhooks.
- **Lead and payment spreadsheet:** Google Sheets API or the configured Apps Script webhook.

**Backend migration boundary:** The public API is served by a Next.js Route Handler, but the existing Express controllers are retained behind an adapter to preserve the current API contracts. This is a Vercel-hosted compatibility migration, not a controller-by-controller rewrite into native Next.js handlers. It is intentional to reduce the risk of changing working checkout and admin behaviour while preserving the design.

## Local setup

1. Install Node.js 22 or newer.
2. Run `npm install` in this folder.
3. Copy `.env.example` to `.env` and set valid development values for MongoDB, Redis, admin and products.
4. Start local MongoDB and Redis with `docker compose up -d`.
5. Generate an admin password hash: `npm run admin:hash -- "A-strong-password-of-14-or-more-characters"`.
6. Put the generated `salt:hash` string in `ADMIN_PASSWORD_HASH` and set `ADMIN_EMAIL`.
7. Run `npm run dev` and open `http://localhost:3000`.

## Vercel deployment

Follow [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md) for Vercel project settings, the environment-variable list, MongoDB/Redis/Blob configuration, Razorpay webhooks, and the production checklist.

Do not commit `.env`, private service-account keys, Razorpay secrets, MongoDB credentials, Redis credentials, or paid PDF files to source control.

## Data model and traffic limits

The existing backend persists the application state as a single MongoDB document. A Redis lock serializes mutating API requests and the backend refreshes this document from MongoDB for each API request to avoid warm-function stale reads and lost updates in this low-volume MVP setup. This design is not intended for high concurrency or horizontal scaling. Before scaling, migrate leads, orders, payments, products, downloads, webhook events, and audit logs to separate collections with atomic per-record operations and idempotent indexes.

## Payment and delivery safety

- A browser-side checkout success callback does not mark an order paid.
- The server verifies Razorpay signatures and captured amount/status against the server-created order.
- Razorpay webhook signatures are verified against the raw request body; duplicate webhook IDs are ignored.
- Production order creation is blocked until the corresponding approved PDF exists in private Blob storage.
- The PDF download endpoint checks verified captured payment and a time-limited, download-limited token.

## Verification status

The migration source was syntax-parsed, and JSON configuration files were checked. A full dependency install, Next.js build, live MongoDB/Redis connection, Vercel deployment, Razorpay checkout, and live Blob/Google Sheets integration were not run in this environment. Run `npm install`, `npm run lint`, `npm test`, and `npm run build` locally before connecting the repository to production.
