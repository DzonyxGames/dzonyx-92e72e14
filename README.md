# Dzonyx

Dzonyx is an English-language digital-comic catalogue, protected online reader
and creator admin studio.

## Current status

The application includes PayPal Sandbox checkout for individual issues and the
Universe Pass. Sandbox mode never charges real money. Do not switch to Live
until the adult store operator has completed PayPal production verification,
legal notices and end-to-end payment testing.

Included now:

- Clerk passwordless authentication using email verification codes
- Server-side administrator authorization using the stable Clerk user ID
- Public catalogue and collections in reading order
- Personal reader library
- Protected page-by-page comic reader
- Admin tools for issue metadata, EUR and USD prices, covers and page uploads
- Per-issue Universe Pass inclusion and draft/published state
- D1 structured storage and private R2 comic-image storage
- Verified PayPal single-issue orders and recurring EUR/USD subscriptions
- Signed PayPal webhook handling for activation, cancellation and expiration
- Honest empty and not-configured states

## Important hosting note

GitHub should store the source code. GitHub Pages is static hosting and is not
the final runtime for this application because Dzonyx requires protected server
routes, a database, private file storage and eventually commercial payments.
Keep the current production site unchanged until a transaction-capable host is
connected and tested.

The repository includes a standalone `wrangler.jsonc` and these Cloudflare
commands:

    npm run build:cloudflare
    npm run deploy:cloudflare

The first command builds the complete Worker locally. The second command uses
Wrangler after the Cloudflare account has been authenticated. Add the D1
binding as `DB` and the private R2 binding as `BUCKET` before enabling the admin
upload workflow.

## Local setup

Requirements:

- Node.js 22.13 or newer
- npm

Install and start:

    npm ci
    npm run dev

Quality checks:

    npm run lint
    npx tsc --noEmit
    npm test

## Configuration

Copy .env.example to .env.local and fill in your own values. Never commit
.env.local, a Clerk secret key, a PayPal secret, or another private credential.

The supplied Clerk publishable key is a Development key for preview builds.
Configure the Clerk Production publishable key and `https://clerk.dzonyx.com`
issuer in the production hosting environment before switching the domain.

Server-side access checks use:

- DZONYX_ADMIN_USER_ID
- CLERK_ISSUER
- DZONYX_ALLOWED_ORIGINS

PayPal Sandbox uses:

- PAYPAL_CLIENT_ID (encrypted secret)
- PAYPAL_CLIENT_SECRET (encrypted secret)
- PAYPAL_ENVIRONMENT=sandbox
- PAYPAL_PLAN_ID_EUR
- PAYPAL_PLAN_ID_USD
- PAYPAL_WEBHOOK_ID (encrypted secret, added after webhook creation)

The webhook URL is `https://dzonyx.com/api/paypal/webhook`. Subscribe it to:

- BILLING.SUBSCRIPTION.ACTIVATED
- BILLING.SUBSCRIPTION.CANCELLED
- BILLING.SUBSCRIPTION.SUSPENDED
- BILLING.SUBSCRIPTION.EXPIRED

Application storage uses the logical Cloudflare bindings:

- DB for D1
- BUCKET for R2

Schema migrations live in drizzle. They must be applied by the selected hosting
workflow before the admin studio can store comics.

## Publishing a comic

1. Sign in with the pre-created administrator email account.
2. Open Admin Studio and create a draft issue.
3. Upload one JPG, PNG or WebP cover.
4. Upload JPG, PNG or WebP pages in reading order.
5. Set EUR and USD prices and choose Universe Pass inclusion.
6. Publish only after reviewing the real issue.

Setting both issue prices to zero makes an issue free. Paid access is granted
only after Dzonyx verifies the PayPal order or active subscription on the
server. A verified cancellation, suspension or expiration revokes Universe
Pass access automatically.

## Security model

- The browser never decides who is an administrator.
- Every protected API request verifies the Clerk session JWT signature,
  issuer, lifetime and authorised origin.
- Administrator mutations compare the verified Clerk subject with the
  server-side administrator allowlist.
- Comic pages are kept in private object storage and streamed only after a
  server-side access check.
- Uploaded files are size-limited and checked as actual JPG, PNG or WebP bytes.
- Subscription confirmation verifies the PayPal status, configured plan and
  signed-in Clerk user before creating D1 access.
- Webhook messages are accepted only after PayPal signature verification.

No web reader can make copying or screenshots impossible. Copyright terms,
private delivery and account controls discourage casual sharing but do not
replace legal enforcement.
