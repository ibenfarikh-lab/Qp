# Phase 05 — Order History Multi-store

## Goal
Customer order history is global by customer UID, while each order remains stored under its owning `toko/{tokoId}/pesanan/{orderId}` tenant.

## Changes
- `subscribeCustomerOrders()` now uses a Firestore `collectionGroup('pesanan')` query filtered by `uidPelanggan`.
- Each returned order carries `tokoId` derived from its parent collection, with the stored field as fallback.
- `OrderHistory` no longer requires the current Store Context to load history.
- Transfer confirmation uses the order's own `tokoId`, not the current storefront context.
- Firestore rules add an active-customer identity check for orders owned by the authenticated UID.
- Added the required collection-group index for `pesanan` by `uidPelanggan` and `createdAt`.

## Contract
`Customer Account != Store Context`: history belongs to the authenticated customer; order tenancy remains owned by the store that created the order.

## Security
Customers can read/update only their own orders. Admin access remains restricted to the admin's own store. Client order creation remains disabled and goes through the callable backend.

## QA
- Static source inspection: PASS.
- Build/emulator/runtime: NOT VERIFIED in this phase artifact.

## Status
IMPLEMENTED — NOT YET FULL PASS.
