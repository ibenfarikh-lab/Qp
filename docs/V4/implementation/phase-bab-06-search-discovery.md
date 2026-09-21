# BAB 6 — Search & Discovery

## Scope
Menutup gap implementasi Search & Discovery agar search menyatu dengan katalog dan kategori Customer.

## Changes
- Search mempertahankan pencarian substring case-insensitive; contoh `ab` dapat menemukan nama/deskripsi yang mengandung `ab`.
- Search tetap memakai produk aktif dari Store Context; produk nonaktif tidak ikut hasil.
- Search dan filter kategori sekarang dapat dipakai bersamaan, bukan saling menonaktifkan.
- Hasil search tetap mengikuti mode List/Grid/Card dari BAB 2.
- Produk stok 0 tetap dapat ditemukan dan diberi status HABIS sesuai pengaturan tampilan stok.
- Ditambahkan empty state untuk hasil pencarian/kategori yang kosong, termasuk reset pencarian dan kategori.
- Tidak menambahkan typo-tolerance, synonym expansion, ranking, atau filter palsu tanpa sumber data/kontrak yang disepakati.

## Contract
Search adalah transformasi tampilan atas katalog tenant yang sudah dimuat oleh Store Context; tidak membuat query Firestore baru dan tidak mengubah data produk.

## Verification
- Source review: PASS.
- JSX/browser runtime: NOT VERIFIED.
- Next.js build: NOT VERIFIED.
