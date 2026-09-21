# Phase 07 — Customer Profile, Account & Settings

## Goal
Separate Customer profile data from local UI preferences while keeping customer identity independent from store context.

## Changes
- Added `ProfilePanel` for Customer name, WhatsApp number, address, and read-only auth email.
- Added `updateCustomerProfile()` in `lib/services/authService.js`.
- Firestore rules allow a non-admin user to update only `nama`, `telepon`, `alamat`, and `updatedAt` on their own `pengguna/{uid}` document.
- Admin profile documents remain client-immutable.
- Settings keeps theme preference local to the device and links to the separate Profile panel.
- Profile is intentionally not a tenant identity and does not set or require `tokoId`.

## Security
- Client cannot change role or status.
- Client cannot edit another user's profile.
- Admin profile cannot be changed through this customer profile path.
- Email remains read-only in the UI; Firebase Auth remains the source of authentication email.

## Verification
- Static source review performed.
- Build/emulator/runtime verification: NOT VERIFIED.

## Status
IMPLEMENTED — NOT YET FULL PASS.
