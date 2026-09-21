# BAB 21 — Observability, Testing & QA

## Tujuan
Menjadikan QA V4 berbasis bukti. PASS hanya diberikan pada gate yang benar-benar dijalankan; gate yang belum dapat dijalankan dicatat sebagai NOT VERIFIED.

## QA gate
1. Static/source syntax
2. Build
3. Firebase emulator/rules/functions
4. Browser runtime
5. Data contract
6. Security regression
7. End-to-end flow

## Automation
`node scripts/v4-qa-gate.mjs` memeriksa file inti, syntax JS/JSX/MJS, dan beberapa guard keamanan yang dapat diverifikasi tanpa emulator.

## Hasil artifact ini
- Static/source gate: dapat dijalankan oleh script.
- Next.js build: NOT VERIFIED bila dependency/build environment belum tersedia.
- Firebase Emulator: NOT VERIFIED bila Firebase CLI/emulator tidak tersedia.
- Browser runtime: NOT VERIFIED tanpa browser runtime.
- Data/runtime integration: NOT VERIFIED tanpa Firebase environment.

## Aturan status
- PASS = gate dieksekusi dan hasilnya memenuhi kriteria.
- NOT VERIFIED = belum ada runtime evidence.
- FAIL = ditemukan kegagalan nyata.

## Catatan
Dokumen ini tidak mengubah arsitektur V4. Ia hanya menyediakan regression gate dan dokumentasi status QA.

## Static gate execution result
Executed from the artifact baseline with `node scripts/v4-qa-gate.mjs`:
- status: PASS
- checks: 29
- failures: 0

This is a static/source gate only. It does not imply Next.js build, Firebase emulator, or browser runtime PASS.
