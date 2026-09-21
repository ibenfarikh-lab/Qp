# BAB 22 — Deployment, Environment & Versioning

## Tujuan
Menetapkan kontrak deployment V4 tanpa mengubah arsitektur aplikasi.

## Environment
- Client hanya menerima variabel `NEXT_PUBLIC_*` yang memang aman untuk browser.
- Secret server seperti `OPENROUTER_API_KEY` hanya disediakan ke Firebase Functions.
- File `.env` dan `functions/.env` nyata tidak boleh masuk repository/ZIP release.
- `.env.example` dan `functions/.env.example` hanya menjadi template, tanpa nilai secret.

## Firebase
- Project target berasal dari `.firebaserc`.
- Firestore rules/indexes berasal dari root project.
- Functions source tetap `functions/` dan Node engine tetap 20.
- Emulator configuration tetap tersedia untuk QA lokal.

## Deployment contract
1. Isi environment client dari environment deployment, bukan dari source control.
2. Set `OPENROUTER_API_KEY` sebagai server secret/environment Functions.
3. Jalankan static QA gate.
4. Jalankan release gate: `node scripts/release-gate.mjs`.
5. Jalankan `npm run build` pada environment yang memiliki dependency terpasang.
6. Jalankan Firebase Emulator/Rules/Functions regression.
7. Setelah runtime PASS, deploy Next.js dan Firebase menggunakan project yang telah diverifikasi.

## Versioning
- Artifact tetap mempertahankan nama fase/BAB untuk traceability.
- Dokumentasi pusat `docs/V4/V4-DOCUMENTATION.md` menjadi indeks keputusan dan status.
- Tidak ada perubahan struktur route atau Store Context hanya demi versioning.

## Verification status
- Source deployment contract: PASS.
- Secret-template separation: PASS.
- Actual production deployment: NOT VERIFIED.
- Next.js production build: NOT VERIFIED.
- Firebase deployment: NOT VERIFIED.

BAB 22 selesai pada level kontrak/source. Production PASS tetap menunggu bukti runtime nyata.
