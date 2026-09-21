# V4 Phase 25 — Gateway Manual Store Context

## Tujuan
Memastikan Gateway V4 dapat menerima konteks toko secara manual melalui query parameter URL tanpa bergantung pada QR.

## Perubahan
- `components/StoreContext.jsx`
  - Pembacaan query parameter dibuat toleran terhadap variasi kapitalisasi: `tokoId`, `tokoid`, `storeId`, dan `store`.
  - Nilai tetap dinormalisasi melalui `cleanTokoId()` sebelum digunakan.
- `app/page.jsx`
  - Fallback Gateway tidak lagi menyebut QR.
  - Petunjuk testing manual menggunakan `?tokoId=ID_TOKO`.

## Alur
`/?tokoId=ID_TOKO` → `StoreContextProvider` → `tokoId` → `subscribeStoreHome()` → Gateway membaca identitas/settings/produk → tombol Customer membawa `tokoId` yang sama.

## Verifikasi
- QA Gate: PASS, 30 checks, 0 failure.
- Build Next.js belum diverifikasi pada environment ini.
- Runtime Firebase/API tidak disentuh pada fase ini.

## File runtime untuk deploy
1. `components/StoreContext.jsx`
2. `app/page.jsx`

## Catatan
Phase ini sengaja tidak mengubah API/backend, QR, atau mekanisme autentikasi.
