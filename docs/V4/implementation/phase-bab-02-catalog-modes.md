# BAB 02 — Customer Catalog Modes

Status: IMPLEMENTED

## Scope
Customer catalog now supports three presentations over the same `produkList` data and ProductCard contract: List, Grid, and Card (modern).

The selected mode is stored locally as `kasirquh-catalog-mode` and does not change Firebase data or the service layer.

## Files changed
- `app/customer/page.jsx`
- `components/ProductCard.jsx`
- `app/globals.css`

## Contract
All modes share the same active-product filtering, category/search filtering, product detail action, and cart action. Only presentation changes.

## QA
- Source review: PASS
- Firebase schema unchanged: PASS
- Runtime/build: NOT VERIFIED
