# Leaven Heaven

Leaven Heaven is a sourdough bakery storefront built with:
- Vite + React
- Supabase (authentication and database)
- Stripe (payments and subscriptions)

## Features

- User accounts and authentication
- Secure checkout with Stripe
- Order history
- Favorites
- Optional weekly loaf subscription

## Development

```bash
cd my-app && npm install && npm run dev
```

Environment variables: copy `my-app/.env.example` to `my-app/.env.local` and add your Supabase keys.

## Deployment (Vercel)

1. Connect the repo at [vercel.com](https://vercel.com) → Import → `audreygoddard04/LeavenHeaven`
2. Add environment variables in Project Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy. The `vercel.json` config builds from `my-app/`.
4. Add your domain (e.g. leavenheaven.shop) in Vercel → Domains.
