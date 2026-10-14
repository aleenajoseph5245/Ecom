# form & field — India storefront monorepo

A considered home goods store localized for Indian customers. The web app is Next.js, the mobile app is Expo / React Native, and product types and catalog data are shared.

## Apps and packages

- `apps/web` — responsive storefront, cart, Indian address checkout, Razorpay order creation and payment verification.
- `apps/mobile` — Expo storefront for iOS and Android; opens the shared web checkout for delivery details and payment.
- `packages/catalog` — product data and INR pricing shared by web and mobile.
- `packages/types` — shared TypeScript product/category definitions.

## Getting started

Requires Node.js 20+ and pnpm 9+.

```sh
pnpm install
pnpm dev:web
```

Open http://localhost:3000. Run the mobile app with `pnpm dev:mobile` and select an iOS simulator, Android emulator, or Expo Go device. Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to the reachable web app origin for checkout.

## India payments

The checkout creates Razorpay Orders on the server using prices from the shared catalog, collects an Indian delivery address and optional GSTIN, then verifies the Razorpay payment signature and confirms the captured payment with Razorpay before showing confirmation. It displays UPI, cards, netbanking and wallets as available payment methods; actual methods depend on account activation and Razorpay configuration.

Create a Razorpay account and use its **test mode** API keys first. Set these server-only variables in `apps/web/.env.local` or in Vercel Project Settings → Environment Variables:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never put `RAZORPAY_KEY_SECRET` in a `NEXT_PUBLIC_` variable or in the mobile app. For live transactions, activate the Razorpay account, replace test credentials with live credentials, and redeploy. The mobile app only needs `EXPO_PUBLIC_API_URL` set to the public web origin.

## Shipping, tax and invoices

Current sample shipping is ₹499 below ₹10,000 and free at or above ₹10,000. These are starter values and should be adjusted for the store's actual delivery costs. GSTIN collection is optional. This starter does not calculate GST, create GST tax invoices, save orders in an order database, handle refunds, or run fulfillment webhooks. Before production sales, configure applicable tax rates and product HSN classifications with an Indian tax professional, implement compliant invoice generation and order persistence, and add Razorpay webhooks for reliable fulfillment.

## Useful commands

```sh
pnpm dev             # start workspace dev tasks
pnpm build           # build all apps/packages
pnpm typecheck       # type check workspace packages
pnpm --filter @ecom/mobile ios
```

Replace the sample catalog, product images and policies, configure inventory, account and order management, and review local consumer-protection, privacy and tax requirements before launch.
