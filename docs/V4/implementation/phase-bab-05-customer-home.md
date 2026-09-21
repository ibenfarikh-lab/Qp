# BAB 5 — Customer Home

## Scope
Menyelaraskan Customer Home dengan Kitab V4 dan hasil BAB 2.

## Changes
- Header customer dibuat lebih ringkas dan mobile-first.
- Identitas toko dan info toko tetap berasal dari Store Context/Admin settings.
- Info toko ditampilkan sebagai running information tanpa promo palsu/hardcoded.
- Kategori menjadi baris ikon horizontal yang dapat digeser; nama tetap tersedia melalui `aria-label`/tooltip.
- Mode katalog BAB 2 tetap dipakai tanpa menggandakan engine produk.
- `tampilkanStok` dari pengaturan beranda sekarang benar-benar mengontrol badge/detail stok pada ProductCard.
- Loading, session, dan store error tetap memiliki state tersendiri.

## Deliberate constraints
- Tidak membuat data penjualan/produk terlaris fiktif. Fitur discovery yang membutuhkan metrik `terjual` hanya dapat ditampilkan setelah sumber datanya tersedia.
- Tidak membuat konten ide masak fiktif. Field resep/ide masak dapat diintegrasikan saat sumber data tersebut tersedia.

## Verification
- Source changes reviewed directly.
- JSX syntax could not be independently executed with plain `node --check` because Node does not parse `.jsx` directly in this environment.
- Next.js build/browser runtime remain not verified.
