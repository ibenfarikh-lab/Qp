# V4 Phase 01 — Gateway + Store Context

## Status
IMPLEMENTED — runtime/security verification pending.

## Baseline
`QP_V4_CUSTOMER_ROUTE_FIX_01.zip`

## Goal
Separate Store Context from Customer Auth and establish the Gateway as the public entry point for store preview, Customer access, and Admin access.

## Decisions locked
- Gateway/Welcome is the main public entry point.
- Gateway may show a limited store preview when a store context is available.
- Customer access is a separate path from Admin access.
- QR is optional and is only a shortcut to a store context; it is not required for entering a store.
- `tokoId` identifies the current Store Context and is not taken from `pengguna/{uid}` for Customer browsing.
- Customer Auth identifies the user; Store Context identifies the store being visited.
- Legacy `/pelanggan` remains as a compatibility route to `/customer`.

## Implemented files
- `app/page.jsx` — Gateway with optional store preview and Customer/Admin routes.
- `app/customer/page.jsx` — canonical Customer route.
- `app/pelanggan/page.jsx` — compatibility redirect to `/customer`.
- `components/StoreContext.jsx` — central Store Context provider.
- `components/CustomerSessionContext.jsx` — Auth-only Customer session; no permanent `tokoId` requirement.
- `app/globals.css` — Gateway preview styling.

## Store Context sources
1. `?tokoId=...`
2. `?store=...` compatibility alias
3. previously selected context from browser local storage

The context value is the technical `tokoId`. Human-readable `namaToko` is read from store identity data.

## Intentionally not changed yet
- Firestore public-read rules. These belong to the Security/Rules phase.
- `createCustomerOrder` authentication and multi-store contract. These belong to Checkout/Order backend phase.
- Order history cross-store model.
- Chat authorization changes.

## Verification status
- Static inspection: completed for changed files.
- Build: NOT VERIFIED in this phase because dependencies were not installed in the inspected baseline.
- Runtime: NOT VERIFIED.
- Firebase public-read access: NOT VERIFIED; current Rules still block unauthenticated storefront reads and will be addressed in the Rules phase.

## Risk notes
The Gateway preview code is prepared for public storefront data, but it cannot become publicly functional until the corresponding Firebase Rules are opened only for explicitly public storefront fields/collections.
