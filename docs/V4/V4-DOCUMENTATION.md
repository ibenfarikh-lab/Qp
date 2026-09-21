# KasirQuh V4 — Documentation Index

This folder is the structured documentation source for V4 architecture and implementation.

## Architecture chapters
- BAB 01–23: V4 architecture decisions and contracts.
- BAB 23 includes the revised Gateway/Welcome model.

## Implementation phases
- `implementation/phase-01-gateway-store-context.md`

## Current locked Gateway model
- `/` = public Gateway / Welcome.
- Gateway can provide a limited store preview when a Store Context exists.
- Gateway provides a Customer path and a separate Admin path.
- QR is optional and only a shortcut to a store context.
- Store Context (`tokoId`) is independent from Customer identity/Auth.
- `/customer` is the canonical Customer route.
- `/pelanggan` is retained as a compatibility redirect during migration.

## Verification policy
A phase is not marked PASS merely because code was edited. Final PASS requires the applicable Static, Build, Runtime, Data/Security, and Flow checks.

## Implementation Status

- Phase 01 — Gateway + Store Context: IMPLEMENTED; build/runtime pending verification.
- Phase 02 — Customer Auth Separation: IMPLEMENTED; build/runtime pending verification.

## Phase 04 — Checkout + Order Backend

Status: IMPLEMENTED / PENDING VERIFICATION

Order backend now uses Auth identity + Store Context independently; customer `tokoId` is no longer required to match the current store. Decimal quantities up to 3 decimal places are supported.


## Phase 05 — Order History Multi-store
- Customer history queries all `pesanan` subcollections through a collection-group query by `uidPelanggan`.
- Store context is retained per order for tenant-specific actions such as transfer confirmation.
- Customer order access is based on authenticated customer identity, not permanent `pengguna.tokoId`.
- Status: IMPLEMENTED — runtime/build not verified.

## Phase 06 — Customer Chat
- Chat Admin tetap privat dan tenant-scoped.
- Customer tidak lagi membutuhkan `pengguna.tokoId` untuk mengakses chat toko yang sedang aktif.
- Chat Rumpi ditambahkan sebagai kanal komunitas per toko.
- Admin pemilik toko mendapat kontrol moderasi hapus pesan.
- Status: IMPLEMENTED — runtime/build not verified.

## Phase 07 — Customer Profile, Account & Settings
Customer identity is separated from Store Context. Profile editing is limited to the authenticated customer's own `nama`, `telepon`, and `alamat`; role/status remain immutable from the client. Theme remains a local preference. Runtime/build verification remains pending.


## Phase 08 — Customer AI & Smart Assistance
Implemented server-side Customer AI with Store Context/catalog/cart context, authenticated Customer access, Admin handoff, and no client-side provider key. Runtime/provider verification remains pending.


## Phase 09 — Admin Experience
Admin shell is tenant-scoped through the authenticated admin profile. Dashboard, products, orders, chat, Rumpi moderation, and store settings remain separated from Customer UI. A read-only Admin AI callable was added with server-side admin/tokoId validation. Status: IMPLEMENTED — runtime/build/provider verification pending.


## Phase 10 — Final Integration, Security & QA
- Static integration audit completed across Customer/Admin routes, services, callable functions, and Firestore rules.
- JavaScript/MJS syntax checks passed for `lib/`, `functions/`, and `scripts/`.
- Confirmed no client-side provider API key; AI uses Firebase Secret `OPENROUTER_API_KEY`.
- Confirmed customer order creation remains callable-only and no direct client order creation was found.
- Confirmed the old Customer `pengguna.tokoId == current tokoId` gate is not used by the Customer order/AI/chat contracts; Admin remains tenant-bound.
- Fixed a Customer runtime error where `loginReturnTo` was referenced outside its declaration scope on session-error rendering.
- Next.js dependency installation/build could not be completed in this environment because `npm install` timed out; browser/Firebase runtime and deployed-provider tests remain NOT VERIFIED.
- Status: IMPLEMENTED — STATIC QA PASS; BUILD/RUNTIME/DEPLOYED SECURITY TESTS NOT VERIFIED.
## Flow Gate — Gateway without Store Context

- Root Gateway remains the first entry point.
- A Customer session is never started against an unknown store.
- When a store context (`tokoId`/`store`) is present, the Gateway links to `/customer?tokoId=...`.
- When no store context is present, the Customer action is intentionally non-navigating and explains that a normal store link or QR/deep link is needed to establish context.
- QR remains optional; a normal store link carrying the context is equally valid.
- This avoids sending users into a Customer page that cannot load a store.


## Final Release Checklist
The V4 source/architecture gates are consolidated in `implementation/final-release-checklist.md`.
Static/source verification is complete. Build, Firebase Emulator, browser runtime, and deployed provider tests remain explicitly NOT VERIFIED in the current environment.


## BAB 02 implementation update
- Three Customer catalog presentation modes are implemented: List, Grid, and Card (modern).
- All modes share the same product data/filtering/cart/detail behavior.
- Selected mode is stored locally as `kasirquh-catalog-mode`.
- Runtime/build remains NOT VERIFIED.


## BAB 6 — Search & Discovery
- Implemented substring search, combined category filtering, catalog-mode reuse, and empty-state recovery.

## BAB 20 Implementation Update
- PWA manifest, install icons, and service-worker registration are now present in the V4 source.
- Service worker caching is limited to same-origin GET responses and does not cache Firebase/auth data.
- Browser install/offline runtime remains NOT VERIFIED until tested on a real browser/device.


## BAB 21 — Observability, Testing & QA

QA V4 menggunakan gate berjenjang dan tidak mengklaim runtime PASS tanpa bukti. Regression script: `scripts/v4-qa-gate.mjs`. Status environment dicatat sebagai PASS atau NOT VERIFIED sesuai bukti aktual.

## BAB 22 — Deployment, Environment & Versioning
- Client environment uses `NEXT_PUBLIC_*` values only.
- Server-only AI secret uses `functions/.env`/deployment secret and is never committed.
- Release gate: `node scripts/release-gate.mjs`.
- Actual production deployment remains NOT VERIFIED until build/runtime evidence exists.

## BAB 23 — Final V4 Architecture Map
- Final Gateway/Store Context/Auth separation is locked.
- `/` remains the public Gateway; `/customer` is the canonical Customer route; `/pelanggan` remains compatibility during migration.
- Admin remains tenant-bound through authenticated admin `tokoId`.
- Customer Store Context is independent from permanent store ownership.
- Sensitive order operations remain callable-backed.
- See `implementation/bab-23-final-architecture-map.md` and `V4-FINAL-CROSS-AUDIT.md` for the consolidated map and audit.

## Final cross-audit status
- Architecture: LOCKED.
- Static/source verification: VERIFIED.
- Build, Firebase Emulator, browser/mobile runtime, deployed provider, and production smoke test: NOT VERIFIED.
- Known completion gap: Customer UI decimal quantity flow must be verified/fixed to match the backend decimal-quantity contract.


## BAB 23 Follow-up — Customer Guest Entry Flow

The final architecture audit identified that the Customer page was still login-gated. Phase 24 aligns the implementation with the locked Gateway/Store Context contract: storefront browsing is available without authentication; account-gated features request login only when needed. Checkout preserves the guest cart across the login redirect. See `implementation/phase-24-customer-guest-entry-flow.md`.
