# Phase 08 — Customer AI & Smart Assistance

## Goal
Provide a server-side Customer shopping assistant that uses the current Store Context and catalog without exposing an API key to the browser.

## Changes
- Added `CustomerAiPanel` with quick prompts, conversation history, loading/error states, and Admin handoff.
- Added `lib/services/aiService.js` to call the Firebase callable function.
- Added `customerAiAssistant` callable in `functions/index.js`.
- AI receives only bounded store/catalog/cart context supplied by the Customer UI.
- AI is explicitly prohibited from changing cart/order/account data; transaction actions remain in the normal UI/services.
- Provider model is `openai/gpt-oss-20b` through OpenRouter; the key is a server secret named `OPENROUTER_API_KEY`.
- Floating AI button now opens the assistant instead of a placeholder alert.

## Security
- No provider API key is shipped to the client.
- Callable requires an authenticated, active non-admin Customer.
- The callable verifies the requested store exists.
- Catalog context is bounded and treated as advisory data; server-side order validation remains authoritative.

## Verification
- JavaScript syntax checks: performed locally.
- Next build: NOT VERIFIED in this environment.
- Firebase callable runtime/provider test: NOT VERIFIED; requires deployed function and configured `OPENROUTER_API_KEY`.

## Status
IMPLEMENTED — NOT YET FULL PASS.
