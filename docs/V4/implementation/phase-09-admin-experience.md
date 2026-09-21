# V4 Phase 09 — Admin Experience

## Goal
Complete the Admin shell as a separate tenant-scoped experience and provide a read-only operational AI assistant.

## Changes
- Admin session resolves `pengguna/{uid}` and requires `role=admin`, `status=aktif`, and a tenant `tokoId`.
- Admin navigation covers Dashboard, Pesanan, Chat, Produk, and Pengaturan.
- Dashboard summarizes orders, omzet, unread chats, and low stock.
- Product, order, chat, and store settings panels consume tenant-scoped services.
- Chat Rumpi moderation is exposed to the store admin.
- Added `AdminAiPanel` and `adminAiAssistant` callable.
- Admin AI validates the authenticated admin and requires `user.tokoId === requested tokoId` server-side.
- Admin AI is read-only: it receives limited product/order context and cannot mutate Firestore data.
- Provider secret remains server-side as `OPENROUTER_API_KEY`.

## Security contract
The browser may request an answer for the current admin tenant, but the callable independently verifies identity, role, status, and tenant ownership before reading operational data.

## Verification
- Node syntax checks: required before release.
- Next.js build: pending if dependencies are unavailable.
- Firebase callable runtime/provider: pending deployment and secret configuration.

## Status
IMPLEMENTED — NOT YET FULL PASS.
