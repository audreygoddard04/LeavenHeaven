# Leaven Heaven – Backend + Auth Setup

Macro-friendly sourdough bakery app with Supabase (auth + Postgres), Stripe (payments + subscriptions), and an Express server for secure server-side operations.

## Project Structure

```
/
├── client/          # Vite + React + TypeScript (reference frontend with full auth/lib)
├── server/          # Express + TypeScript backend (Stripe, webhooks)
├── supabase/        # SQL migrations
│   └── migrations/
│       └── 001_init.sql
└── my-app/          # Your existing Vite app – add VITE_API_URL and use client/src/lib/* in your app
```

To use the backend with `my-app`: copy `client/src/lib/*` into `my-app/src/lib/`, add `VITE_API_URL=http://localhost:3001` to your env, and ensure `VITE_SUPABASE_ANON_KEY` is set.

## Prerequisites

- Node.js 18+
- Supabase account
- Stripe account

---

## 1. Supabase Setup

### Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for the project to finish provisioning.
3. In **Project Settings → API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL` (client) and `SUPABASE_URL` (server)
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` (client)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose to client)

### Run the SQL migration

1. In Supabase Dashboard, go to **SQL Editor**.
2. Create a new query and paste the contents of `supabase/migrations/001_init.sql`.
3. Run the query.

### Configure Auth redirect URLs

1. Go to **Authentication → URL Configuration**.
2. Add to **Redirect URLs**:
   - `http://localhost:5173`
   - `http://localhost:5173/**`
   - Your production URL when deployed

3. For Google sign-in (optional):
   - **Authentication → Providers → Google** → enable and add OAuth credentials.

---

## 2. Stripe Setup

### Create Stripe account and get keys

1. Go to [stripe.com](https://stripe.com) and create an account.
2. In **Developers → API keys**, copy:
   - **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY` (client)
   - **Secret key** → `STRIPE_SECRET_KEY` (server only)

### Create a weekly loaf subscription price

1. In **Products**, create a product (e.g. "Weekly Loaf").
2. Add a recurring price (e.g. weekly).
3. Copy the **Price ID** (e.g. `price_xxx`) → `STRIPE_WEEKLY_LOAF_PRICE_ID`.

### Webhook for local development

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (macOS) or see [Stripe CLI docs](https://stripe.com/docs/stripe-cli).
2. Log in: `stripe login`
3. Forward webhooks to your server:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
4. Copy the **webhook signing secret** (e.g. `whsec_xxx`) → `STRIPE_WEBHOOK_SECRET`.

### Production webhook

1. In **Developers → Webhooks**, add endpoint: `https://your-api.com/api/stripe/webhook`
2. Select events: `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`, `payment_intent.succeeded`
3. Copy the signing secret → `STRIPE_WEBHOOK_SECRET` in production env.

---

## 3. Environment Variables

### Client (`client/.env`)

Copy from `client/.env.example`:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

### Server (`server/.env`)

Copy from `server/.env.example`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEEKLY_LOAF_PRICE_ID=price_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLIENT_ORIGIN=http://localhost:5173
```

---

## 4. Seed Listings (optional)

Insert bakery listings so orders work:

```sql
INSERT INTO listings (id, title, price_cents, is_active) VALUES
  ('classic-country-white', 'Classic Country', 1000, true),
  ('cinnamon-swirl', 'Cinnamon Swirl', 1000, true),
  ('rosemary', 'Rosemary', 1000, true);
```

---

## 5. Run Locally

### Terminal 1 – Server

```bash
cd server
npm install
npm run dev
```

Server runs at `http://localhost:3001`.

### Terminal 2 – Stripe webhooks (for subscriptions)

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

### Terminal 3 – Client

```bash
cd client
npm install
npm run dev
```

Client runs at `http://localhost:5173`.

---

## 6. Test Flows

### Auth

- Sign up / sign in with email or Google.
- Session is persisted and refreshed automatically.

### Orders + payments

1. Add items to cart (listing IDs must exist in `listings`).
2. Call `createOrder({ cart: [{ listingId: 'classic-country-white', qty: 1 }] })`.
3. Use returned `clientSecret` with Stripe.js `confirmCardPayment()`.
4. On success, order status can be updated to `paid` (e.g. via webhook or server logic).

### Subscriptions (weekly loaf)

1. User clicks "Subscribe".
2. Client calls `createSubscription()` → redirects to Stripe Checkout.
3. After payment, Stripe sends `customer.subscription.created` to webhook.
4. Webhook upserts `subscriptions` table.
5. Client reads `subscriptions` (RLS) to show "Subscribed" or "Not subscribed".

### Saved payment methods

1. Client calls `createSetupIntent()` → gets `clientSecret`.
2. Use Stripe.js `confirmCardSetup()` to save a card.
3. `listPaymentMethods()` returns masked cards for the customer.

---

## 7. Deployment (Production) – Next Steps

You have Supabase, domain (leavenheaven.shop), and Stripe set up. Here’s how to go live:

### 1. Run the Supabase migration

1. In Supabase Dashboard → **SQL Editor**, run the contents of `supabase/migrations/001_init.sql`.
2. Optionally seed listings (see section 4 above).

### 2. Configure Supabase Auth for your domain

1. Go to **Authentication → URL Configuration**.
2. Add to **Redirect URLs**:
   - `https://leavenheaven.shop`
   - `https://leavenheaven.shop/**`
   - `https://www.leavenheaven.shop`
   - `https://www.leavenheaven.shop/**`

### 3. Deploy the server (API)

Deploy the `server/` folder to a host that supports Node.js, e.g.:

- **Railway** – connect repo, set root to `server`, add env vars.
- **Render** – new Web Service, root `server`, add env vars.
- **Fly.io** – `fly launch` in `server/`, set env vars.

Production env vars for server:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEEKLY_LOAF_PRICE_ID=price_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLIENT_ORIGIN=https://leavenheaven.shop
```

### 4. Configure Stripe production webhook

1. In Stripe Dashboard → **Developers → Webhooks**, add endpoint:
   - URL: `https://your-api-domain.com/api/stripe/webhook` (use your deployed server URL)
2. Select events: `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`, `payment_intent.succeeded`
3. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in production.

### 5. Deploy the frontend (my-app)

Deploy `my-app/` to Vercel, Netlify, or similar:

- **Vercel** – connect repo, set root to `my-app`, add env vars.
- **Netlify** – build command: `npm run build`, publish: `my-app/dist`.

Production env vars for my-app:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://your-api-domain.com
```

### 6. Point your domain to the frontend

1. In your domain registrar (where you bought leavenheaven.shop), add DNS records:
   - For Vercel: CNAME `www` → `cname.vercel-dns.com` (or your project domain)
   - For Netlify: CNAME `www` → `apex-loadbalancer.netlify.com`
2. Add `leavenheaven.shop` as a custom domain in Vercel/Netlify and follow their instructions for apex + www.

### 7. Switch Stripe to live mode

1. In Stripe Dashboard, switch from **Test mode** to **Live mode**.
2. Use live API keys and live webhook secret in production env vars.

---

## Security Summary

- **Client** uses only: Supabase anon key, Stripe publishable key.
- **Server** uses: Stripe secret key, webhook secret, Supabase service role key.
- Stripe webhook signatures are verified.
- Card data is never stored in Supabase; only Stripe IDs.
- RLS ensures users access only their own profiles, favorites, orders, and subscriptions.
