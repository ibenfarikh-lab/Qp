'use client';

export default function ProductCard({ produk, mode = 'card', onAddToCart, onOpenDetail, showStock = true }) {
  const stok = Number(produk.stok || 0);
  const harga = Number(produk.hargaJual || produk.harga || 0);
  const satuan = produk.satuan || 'pcs';
  const foto = produk.foto || '/placeholder.svg';
  const nama = produk.nama || 'Tanpa nama';

  const addButton = (className = 'product-add-btn') => (
    <button className={className} type="button" disabled={stok <= 0} aria-label={`Tambah ${nama} ke keranjang`} onClick={(event) => { event.stopPropagation(); onAddToCart?.(produk); }}>🛒</button>
  );

  if (mode === 'list') return (
    <article className="product-list-card" onClick={() => onOpenDetail?.(produk)}>
      <div className="product-list-image"><img src={foto} alt={nama} loading="lazy" />{showStock && stok <= 0 && <span className="soldout">HABIS</span>}</div>
      <div className="product-list-info"><b>{nama}</b><strong>Rp {harga.toLocaleString('id-ID')}</strong><small>{showStock ? (stok > 0 ? `Stok ${stok} ${satuan}` : 'Stok habis') : satuan}</small></div>
      {addButton('product-list-add')}
    </article>
  );

  if (mode === 'grid') return (
    <article className="product-grid-card" onClick={() => onOpenDetail?.(produk)}>
      <div className="product-grid-image"><img src={foto} alt={nama} loading="lazy" />{showStock && stok <= 0 && <span className="soldout">HABIS</span>}{showStock && stok > 0 && stok <= 5 && <span className="stock-badge">🔥 {stok}</span>}</div>
      <div className="product-grid-info"><b>{nama}</b><strong>Rp {harga.toLocaleString('id-ID')}</strong><small>{showStock ? `${stok} ${satuan}` : satuan}</small></div>
      {addButton('product-grid-add')}
    </article>
  );

  return (
    <article className="modern-product-card" onClick={() => onOpenDetail?.(produk)}>
      <div className="product-stage">{showStock && stok <= 0 && <span className="soldout">HABIS</span>}{stok > 0 && stok <= 5 && <span className="stock-badge">🔥 Sisa {stok}</span>}<div className="plate" /><img src={foto} alt={nama} loading="lazy" />{addButton('modern-cart-btn')}</div>
      <div className="product-info"><b>{nama}</b><strong>Rp {harga.toLocaleString('id-ID')}</strong><small>Stok: {showStock ? `${stok} ${satuan}` : satuan}</small></div>
    </article>
  );
}
