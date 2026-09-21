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


## BAB 23 Follow-up — Customer Guest Entry Flow

The final architecture audit identified that the Customer page was still login-gated. Phase 24 aligns the implementation with the locked Gateway/Store Context contract: storefront browsing is available without authentication; account-gated features request login only when needed. Checkout preserves the guest cart across the login redirect. See `implementation/phase-24-customer-guest-entry-flow.md`.
