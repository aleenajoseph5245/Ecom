# form & field — E-commerce monorepo

A considered home goods storefront built as a pnpm monorepo. The web app is Next.js, the mobile app is Expo / React Native, and product types and catalog data are shared.

## Apps and packages

- `apps/web` — responsive storefront, product browsing, cart, product details, catalog API, and Stripe Checkout endpoint.
- `apps/mobile` — Expo storefront for iOS and Android, using the shared catalog.
- `packages/catalog` — product data shared by web and mobile.
- `packages/types` — shared TypeScript product/category definitions.

## Getting started

Requires Node.js 20+ and pnpm 9+.

```sh
pnpm install
pnpm dev:web
```

Open http://localhost:3000. Run the mobile app with `pnpm dev:mobile` and select an iOS simulator, Android emulator, or Expo Go device. To use a single API endpoint for app data, run the web app too; the app currently renders the bundled shared catalog directly.

## Payments

The web cart sends product IDs and quantities to `POST /api/checkout`. The server looks up prices from its own catalog and creates a Stripe Checkout Session, so client-provided amounts are never trusted. Add a Stripe test secret key to `apps/web/.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Checkout uses Stripe-hosted payment collection and collects a billing address, shipping address (US, CA, GB, AU), and phone number. It adds $8.95 standard shipping below $150 and free shipping at $150 or more. Set up Stripe webhooks and an order database before accepting production orders; this starter does not yet persist orders or process fulfillment events. Never commit secret keys. Without a key, checkout returns a clear setup message.

## Useful commands

```sh
pnpm dev             # start workspace dev tasks
pnpm build           # build all apps/packages
pnpm typecheck       # type check workspace packages
pnpm --filter @ecom/mobile ios
```

## Before production

Configure Stripe production credentials, webhooks and order persistence; replace the sample catalog and imagery; set shipping/tax rules; add inventory, account, and order-management services; and configure store policies and analytics.
