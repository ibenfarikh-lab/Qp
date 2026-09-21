# Phase 20 — Performance, Mobile & PWA

## Scope
Close the PWA portion of the V4 architecture without introducing a new app shell or changing the Store Context contract.

## Implemented
- Added `public/manifest.webmanifest` with standalone display and store-oriented metadata.
- Added installable SVG icons at `public/icons/icon-192.svg` and `public/icons/icon-512.svg`.
- Added `public/sw.js` for same-origin shell/runtime caching with network-first behavior and offline fallback.
- Added `components/PwaRegister.jsx` and registered the service worker from the root layout.
- Added Next metadata for the manifest and theme color.

## Constraints
- No Firebase data is cached by the service worker.
- No authentication/session data is stored by the service worker.
- External-origin requests are not intercepted.
- Existing routes and Store Context remain unchanged.

## Verification
- Static/source review: PASS.
- Browser install prompt, offline navigation, and Lighthouse/PWA audit: NOT VERIFIED in this environment.
- Next.js production build: NOT VERIFIED because dependencies/build environment are unavailable.

## Status
**IMPLEMENTED — STATIC PASS / RUNTIME NOT VERIFIED**
