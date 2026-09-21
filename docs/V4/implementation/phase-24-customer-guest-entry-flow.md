# V4 Phase 24 — Customer Guest Entry Flow

## Status

Source implementation: **PASS**

Build/browser/Firebase runtime: **NOT VERIFIED in this environment**.

## Purpose

Align the actual Customer entry flow with the locked V4 Gateway + Store Context contract:

```text
Gateway
  ↓
Store Context
  ↓
Customer Home / catalog
  ↓
Login only when an account feature is required
  ↓
Checkout / Orders / Chat / Profile
```

## Changes

- Customer Home no longer blocks unauthenticated visitors.
- Customer can browse active storefront data using Store Context only.
- Cart can be used before login.
- Checkout redirects unauthenticated customers to login and preserves the current cart per store.
- After successful login, a pending checkout can be restored automatically.
- Order History and Customer Chat show an account gate instead of blocking the whole Customer Home.
- Settings remains available for local theme preferences; account actions request login when needed.
- Gateway primary action is labeled **Mulai Belanja** and explicitly states that login is not required to start browsing.

## Contract

Store Context identifies the store being viewed. Customer authentication identifies the person using account-protected features. A customer profile `tokoId` is not used as the prerequisite for storefront browsing.

## Verification

Static source inspection and the repository QA gate were run after the change. Production build, Firebase emulator/runtime, and browser/mobile interaction remain unverified until an environment with those capabilities is available.
