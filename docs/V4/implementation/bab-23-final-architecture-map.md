# BAB 23 — Final V4 Architecture Map

## Tujuan
Mengunci peta arsitektur V4 setelah Gateway, Store Context, Customer/Admin separation, backend contract, QA, dan deployment contract selesai.

## Final flow
```text
PUBLIC GATEWAY
  / 
  ├── Store Context / Preview
  │     └── Customer → /customer?tokoId=<store>
  │
  └── Admin → /login → /admin

CUSTOMER
  ROUTE
    ↓
  LAYOUT / SESSION
    ↓
  PAGE
    ↓
  COMPONENT
    ↓
  ACTION / SERVICE
    ↓
  FIREBASE
    ↓
  CLOUD FUNCTIONS (untuk operasi sensitif)

ADMIN
  ROUTE
    ↓
  ADMIN SESSION / TENANT CHECK
    ↓
  PAGE
    ↓
  COMPONENT
    ↓
  SERVICE / ACTION
    ↓
  FIREBASE / CLOUD FUNCTIONS
```

## Route contract
- `/` — Gateway / Welcome.
- `/login` — autentikasi; dapat menerima `returnTo`.
- `/register` — registrasi akun/store Admin.
- `/customer` — canonical Customer route.
- `/pelanggan` — compatibility route selama migrasi.
- `/admin` — Admin dashboard.
- `/admin/products` — produk.
- `/admin/orders` — pesanan.
- `/admin/chat` — chat + moderasi Rumpi.
- `/admin/settings` — pengaturan toko.

## Identity vs Store Context
Customer identity dan Store Context adalah dua kontrak berbeda.

- Auth menjawab: **siapa pengguna?**
- Store Context menjawab: **toko mana yang sedang dikunjungi?**
- Customer tidak memakai `pengguna.tokoId` sebagai tiket permanen untuk membuka toko.
- Admin tetap tenant-bound melalui `pengguna.tokoId`.
- Order menyimpan `tokoId` sendiri agar riwayat multi-store tetap dapat ditelusuri.

## Data boundary
```text
pengguna/{uid}
  └── identity / role / status / admin tokoId

 t o k o/{tokoId}
  ├── identitas/utama
  ├── pengaturan/beranda
  ├── pengaturan/pembayaran
  ├── kategori/{id}
  ├── produk/{id}
  ├── pesanan/{id}
  └── chatPelanggan/{chatId}/messages/{messageId}
```

## Security boundary
- Storefront public: identity utama, home settings yang memang public, kategori aktif, produk aktif.
- Admin: hanya tenant sendiri.
- Customer: identity global + Store Context untuk store yang sedang aktif.
- Order creation: callable backend; client tidak membuat order secara langsung.
- Customer order history: berdasarkan UID customer dan menyimpan konteks toko pada order.
- AI provider key: server-side; tidak dikirim ke browser.
- Profile customer: role/status/tokoId tidak boleh dimutasi oleh client.

## Catalog contract
List, Grid, dan Card memakai sumber data/filter/cart/detail yang sama. Mode adalah presentation preference, bukan tiga sistem katalog berbeda.

## Checkout contract
Checkout menggunakan Store Context dan Auth Customer. Backend memvalidasi toko, produk, harga, stok, quantity, dan idempotency. Decimal quantity didukung di backend hingga 3 desimal.

## Verification contract
V4 tidak boleh disebut Production PASS hanya dari static/source checks. Final release membutuhkan:
1. Static/source QA.
2. Next.js production build.
3. Firebase Emulator/Rules/Functions regression.
4. Browser/mobile runtime.
5. Deployed provider smoke test.
6. Production smoke test.

Status aktual pada baseline ini: **STATIC/SOURCE VERIFIED; BUILD, EMULATOR, BROWSER RUNTIME, DEPLOYED PROVIDER, DAN PRODUCTION SMOKE TEST NOT VERIFIED.**

## Known follow-up from cross-audit
Backend checkout sudah menerima quantity desimal, tetapi kontrol quantity Customer pada UI masih perlu diverifikasi/diperbaiki agar skenario seperti `1.5 Kg` benar-benar dapat dilakukan dari UI. Ini tidak mengubah arsitektur; ini adalah completion item BAB 8/Customer Checkout.

## Final decision
BAB 23 mengunci arsitektur dan kontrak di atas. Implementasi berikutnya tidak boleh mengubah struktur dasar hanya karena satu fitur membutuhkan penyesuaian. Gap yang tersisa diselesaikan sebagai completion/fix pada modul terkait, lalu diuji melalui release gates.
