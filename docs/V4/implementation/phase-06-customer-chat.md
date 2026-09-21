# Phase 06 — Customer Chat: Admin + Chat Rumpi

## Tujuan
Memisahkan dua kebutuhan komunikasi Customer: Chat Admin (privat) dan Chat Rumpi (komunitas per toko), tetap menggunakan Store Context tanpa mengikat Customer ke `pengguna.tokoId`.

## Perubahan
- `chatPelanggan/{uid}/messages` tetap menjadi kanal privat Customer ↔ Admin.
- Akses Customer pada chat privat menggunakan identitas Auth + `chatId == request.auth.uid`; tidak lagi bergantung pada `pengguna.tokoId`.
- Ditambahkan `toko/{tokoId}/chatRumpi/{messageId}` untuk obrolan komunitas.
- Customer aktif dapat membaca/mengirim Chat Rumpi pada toko yang sedang dibuka.
- Admin pemilik toko dapat membaca dan menghapus pesan Chat Rumpi untuk moderasi.
- UI Customer memiliki tab `Admin Toko` dan `Chat Rumpi`.
- UI Admin memiliki tab inbox Chat Admin dan moderasi Chat Rumpi.

## Keamanan
- Semua operasi tetap tenant-scoped melalui `tokoId`.
- Customer tidak dapat menghapus atau mengubah pesan Rumpi.
- Admin hanya dapat memoderasi Rumpi milik tokonya sendiri melalui `isAdminFor(tokoId)`.
- Pesan privat tetap hanya dapat dibaca oleh Customer pemilik chat atau Admin toko.

## Verifikasi
- Static/syntax check: dilakukan setelah perubahan.
- Build/runtime/emulator: belum diverifikasi pada tahap ini.

## Status
IMPLEMENTED — NOT YET FULL PASS
