# V4 Phase 02 — Customer Auth Separation

## Tujuan
Memisahkan identitas Customer dari Store Context. Customer authentication tidak lagi menjadi sumber `tokoId`; `tokoId` berasal dari Store Context.

## Perubahan
- `CustomerSessionContext` hanya bertanggung jawab atas Firebase Auth + profil user.
- `AuthPanel` mempertahankan `returnTo` untuk mengembalikan Customer ke toko/context yang sedang dibuka setelah login.
- `/customer` mengirim context toko saat mengarahkan user ke login.
- Registrasi pada `/register` tetap khusus akun admin toko.
- Wording dokumentasi/UI yang masih menyatakan Customer wajib memiliki `tokoId` dihapus dari alur Auth.

## Kontrak
```text
Store Context = toko yang sedang dikunjungi
Auth          = identitas user
```

Auth tidak menentukan toko Customer.

## Belum disentuh
- Firestore Rules public-read.
- `createCustomerOrder` Cloud Function.
- Order History multi-store.
- Chat authorization.

Bagian tersebut masuk phase berikutnya.

## QA
- Static inspection: PASS.
- Customer Auth masih membutuhkan login untuk area Customer penuh sesuai keputusan V4.
- Redirect Customer mempertahankan `tokoId` melalui `returnTo`.
- Build/runtime: NOT VERIFIED pada environment ini.
