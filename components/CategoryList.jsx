// Lokasi file: components/CategoryList.jsx
'use client';

export default function CategoryList({ activeCategory, onSelectCategory }) {
  // Daftar kategori Kaka
  const categories = [
    'Home', 'Produk', 'Titipan Warga', 'Sembako', 'Minuman', 
    'Makanan', 'Snack', 'Bumbu', 'Perawatan', 'Kebutuhan Rumah', 'Lainnya'
  ];

  return (
    <div className="category-chips no-print" aria-label="Kategori produk">
      {categories.map((kategori) => (
        <button
          key={kategori}
          type="button"
          // Jika kategori ini sedang aktif, tambahkan class 'active'
          className={`chip-btn ${activeCategory === kategori ? 'active' : ''}`}
          onClick={() => onSelectCategory(kategori)}
          title={kategori}
        >
          {/* Untuk ikon SVG-nya, Kaka bisa copas dari HTML lama agar persis sama */}
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            {kategori === 'Home' ? '🏠' : '📦'} {kategori}
          </span>
        </button>
      ))}
    </div>
  );
}
