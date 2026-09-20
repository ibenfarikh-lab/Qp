// Lokasi file: components/ProductCard.jsx
'use client';

export default function ProductCard({ produk, onAddToCart }) {
  const isHabis = produk.stok <= 0;
  const satuan = produk.satuan ? produk.satuan.toLowerCase() === 'rtg' ? 'pcs' : produk.satuan : 'Pcs';
  const harga = produk.hargaJual || produk.harga || 0;
  const hargaFinal = (satuan === 'kg' || satuan === 'kilogram') ? harga * 10 : harga;

  return (
    <div className="inv-card modern-product-card" onClick={() => console.log("Buka Modal Detail", produk.id)}>
      {isHabis && (
        <div className="modern-product-soldout"><span>HABIS</span></div>
      )}
      
      <div className="modern-product-stage">
        {!isHabis && produk.stok <= 5 && (
          <div className="modern-stock-badge">🔥 Sisa {produk.stok}</div>
        )}
        <img className="modern-product" src={produk.foto || '/placeholder.png'} alt={produk.nama} loading="lazy" />
        
        {/* Desain Tatakan Modern */}
        <div className="modern-platform" aria-hidden="true">
          <div className="modern-base"></div>
          <div className="modern-rim"></div>
          <div className="modern-surface"></div>
          <div className="modern-highlight"></div>
        </div>

        {/* Tombol Keranjang */}
        <button 
          className="btn-quick-cart-icon modern-cart-btn" 
          onClick={(e) => { e.stopPropagation(); onAddToCart(produk); }}
          title="Beli"
        >
          🛒
        </button>
      </div>

      <div className="modern-product-info">
        <div className="modern-product-name">{produk.nama}</div>
        <div className="modern-product-price">Rp {hargaFinal.toLocaleString('id-ID')}</div>
        <div className="modern-product-stock">Stok: {produk.stok} {satuan}</div>
      </div>
    </div>
  );
}
