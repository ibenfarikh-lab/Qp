# V4 Final Release Checklist

## Scope
Final pre-release consolidation after Phase 10 and Flow Gate.

## Verified
- [x] V4 Next.js/App Router structure preserved.
- [x] Gateway is the first entry point.
- [x] Store Context is separate from Customer Auth.
- [x] Customer route is `/customer`; `/pelanggan` remains compatibility redirect.
- [x] Customer order flow no longer requires permanent `pengguna.tokoId` ownership.
- [x] Customer order creation remains callable-only.
- [x] Multi-store order history is keyed by authenticated customer identity.
- [x] Customer/Admin chat contracts are tenant-scoped.
- [x] Customer profile cannot mutate role/status/tokoId.
- [x] Customer and Admin AI provider keys are server-side.
- [x] Admin access remains tenant-bound.
- [x] Source syntax checks completed successfully for JS/MJS in `lib/`, `functions/`, and `scripts/`.
- [x] Gateway flow without Store Context no longer sends the user into an unusable Customer page.

## Not Verified in this environment
- [ ] `npm install` completed successfully.
- [ ] `next build` completed successfully.
- [ ] Firebase Emulator Rules tests completed.
- [ ] Firebase Functions runtime tests completed.
- [ ] Browser/mobile runtime flow completed.
- [ ] Deployed OpenRouter runtime completed with `OPENROUTER_API_KEY`.
- [ ] Production smoke test completed.

## Release status
**NOT YET PRODUCTION PASS**

Current state: **STATIC/SOURCE VERIFIED; BUILD, EMULATOR, BROWSER RUNTIME, AND DEPLOYED PROVIDER TESTS NOT VERIFIED.**

No production-readiness claim should be made until the unchecked gates are executed successfully.

## BAB 23 closure gate
- [x] Final V4 architecture map documented.
- [x] BAB 1–23 cross-audit documented.
- [ ] Customer UI decimal quantity flow verified end-to-end.
- [ ] Next.js production build verified.
- [ ] Firebase Emulator Rules/Functions regression verified.
- [ ] Browser/mobile runtime verified.
- [ ] Deployed provider smoke test verified.
- [ ] Production smoke test verified.
