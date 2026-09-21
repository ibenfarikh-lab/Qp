'use client';

export default function CategoryList({ categories = [], activeCategory, onSelectCategory }) {
  return (
    <div className="category-chips" aria-label="Kategori produk">
      {categories.map((category, index) => {
        const key = typeof category === 'string' ? category : category.nama;
        const icon = typeof category === 'string' ? (index === 0 ? '⌂' : '•') : (category.ikon || (index === 0 ? '⌂' : '•'));
        return (
          <button
            key={key}
            type="button"
            className={activeCategory === key ? 'chip-btn active icon-only' : 'chip-btn icon-only'}
            onClick={() => onSelectCategory?.(key)}
            aria-label={key}
            title={key}
          >
            <span aria-hidden="true">{icon}</span>
          </button>
        );
      })}
    </div>
  );
}
