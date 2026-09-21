# V4 Phase 3 — Firestore Public Storefront Access

## Status
🟡 IMPLEMENTED — static review complete; Firebase Emulator/runtime security verification still required.

## Tujuan
Membuka data storefront yang memang dibutuhkan Gateway/Preview tanpa membuka data privat Customer/Admin.

## Kontrak
- `toko/{tokoId}/identitas/utama` dapat dibaca publik untuk Gateway/Preview.
- `toko/{tokoId}/pengaturan/beranda` dapat dibaca publik.
- `toko/{tokoId}/kategori/{kategoriId}` publik hanya bila `aktif == true`.
- `toko/{tokoId}/produk/{produkId}` publik hanya bila `aktif == true`.
- `pengaturan/pembayaran` tetap privat.
- `pesanan`, `chatPelanggan`, dan `pengguna` tetap privat sesuai role/ownership.

## Service adjustment
`lib/services/storeService.js` sekarang memakai query `where('aktif', '==', true)` untuk produk dan kategori pada `subscribeStoreHome()` agar query publik konsisten dengan Firestore Rules.

## File changed
- `firestore.rules`
- `lib/services/storeService.js`
- `docs/V4_PHASE3_FIRESTORE_PUBLIC_STOREFRONT.md`
- `docs/V4_DOCUMENTATION.md`

## Security note
Firestore Rules tidak melakukan filtering query seperti SQL. Karena itu query publik harus membatasi dokumen aktif agar cocok dengan kondisi rule. Admin/customer yang terautentikasi tetap dapat membaca data sesuai izin yang sudah ada.

## Belum diverifikasi
- Firebase Emulator Rules Unit Test
- Guest browser runtime terhadap Gateway
- Guest tidak dapat membaca payment/order/chat/private user data
- Query publik produk/kategori terhadap dataset aktual

## PASS criteria
Phase 3 baru dinyatakan PASS penuh setelah Rules + Runtime + Security test terverifikasi.
