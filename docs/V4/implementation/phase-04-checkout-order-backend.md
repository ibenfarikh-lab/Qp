# Phase 04 — Checkout + Order Backend

Status: IMPLEMENTED / PENDING VERIFICATION

## Tujuan
Menyelaraskan pembuatan order dengan arsitektur V4: `tokoId` berasal dari Store Context, sedangkan identitas customer berasal dari Firebase Auth. Profil customer tidak lagi wajib memiliki `pengguna/{uid}.tokoId` yang sama dengan toko tempat order dibuat.

## Perubahan
- `functions/index.js` tidak lagi menolak order hanya karena `user.tokoId !== tokoId`.
- Admin tetap ditolak dari `createCustomerOrder`.
- Profil customer tetap wajib ada dan berstatus `aktif`.
- Toko dan produk tetap divalidasi server-side.
- Harga dan stok tetap diambil dari data canonical Firebase, bukan dari client.
- Idempotency `uid + requestId` tetap atomik melalui transaction.
- Quantity sekarang menerima nilai desimal sampai 3 angka desimal (mis. 1.5 Kg), selain quantity bulat.
- Batas quantity tetap 0 < qty <= 1000.
- `CheckoutModal` tetap mengirim `tokoId` dari Store Context.

## Kontrak order
```text
Store Context (tokoId)
        +
Customer Identity (Auth UID)
        +
Cart
        ↓
createCustomerOrder callable
        ↓
validate store/product/stock/price
        ↓
canonical order
```

## Yang sengaja tidak diubah
- Struktur `toko/{tokoId}/pesanan/{orderId}`.
- Status order dan payment transition yang sudah ada.
- Stock reduction tetap terjadi saat admin memproses order, bukan saat checkout.
- Order history multi-store akan ditangani pada Phase 5.

## Verifikasi
- Static inspection: PASS untuk perubahan kontrak.
- Build/runtime/Firebase emulator: belum dijalankan pada environment ini.
- Karena itu fase belum boleh disebut PASS penuh sampai verifikasi runtime dilakukan.

## Risiko/catatan
- Customer tanpa `tokoId` sekarang dapat membuat order untuk Store Context yang valid setelah login dan status aktif.
- Rules/order-history tetap perlu diselaraskan pada fase berikutnya.
