# Phase 10 — Final Integration, Security & QA

## Goal
Run the V4 integration/security audit after the Customer and Admin implementation phases, fix deterministic integration defects, and document what is and is not verified.

## Audit scope
- Customer Gateway / Store Context
- Customer Auth separation
- Checkout + order callable
- Multi-store order history
- Customer Chat Admin + Chat Rumpi
- Customer Profile / Settings
- Customer AI
- Admin Experience + Admin AI
- Firestore Rules
- Function/service JavaScript syntax

## Changes
### Customer runtime fix
`app/customer/page.jsx` referenced `loginReturnTo` in the `sessionError` branch even though it had been declared only inside the `!authUser` branch. The value is now derived once before both branches.

## Static QA results
- JavaScript/MJS syntax check (`node --check`): PASS for `lib/`, `functions/`, and `scripts/`.
- Client-side hardcoded provider key scan: PASS; no OpenRouter secret value found.
- AI secret declaration: PASS; `OPENROUTER_API_KEY` is a Firebase Secret used by callable functions.
- Direct client order creation scan: PASS; order creation remains behind `createCustomerOrder` callable.
- Admin tenant enforcement: PASS; Admin AI validates role, active status, and `user.tokoId === requested tokoId`.
- Customer order contract: PASS; it does not require the Customer profile to own the store context.
- Firestore order creation: PASS; direct client `allow create` is false.

## Verification limitation
`npm install --ignore-scripts --no-audit --no-fund` timed out in the available environment, so `next build` could not be run with a complete dependency tree. Firebase emulator/runtime, browser flow, deployed callable functions, and provider-secret execution were therefore not verified.

## Status
**IMPLEMENTED — STATIC QA PASS / BUILD & RUNTIME NOT VERIFIED**

This phase must not be labeled full PASS until Build, Runtime, Data/Security, and end-to-end Flow checks are actually executed.
