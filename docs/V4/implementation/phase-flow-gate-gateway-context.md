# V4 Flow Gate — Gateway Store Context

## Goal
Prevent the root Gateway from sending Customer users into a route without a store context.

## Decision
Store Context is required before entering the full Customer storefront. A normal deep link and QR are equivalent context carriers; QR is not mandatory.

## Change
- `/` with valid `tokoId`/`store`: Customer button opens `/customer?tokoId=...`.
- `/` without context: Customer button becomes an explanatory non-navigation state.
- Admin entry remains `/login`.

## Verification
- Source inspection: PASS.
- Next.js build: NOT VERIFIED.
- Browser runtime: NOT VERIFIED.
