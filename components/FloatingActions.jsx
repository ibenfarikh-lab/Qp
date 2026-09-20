// Lokasi file: components/FloatingActions.jsx
'use client';

export default function FloatingActions({ totalItems, onOpenCart, onOpenAi }) {
  return (
    <div className="fab-container no-print" style={{ position: 'fixed', bottom: '65px', right: '10px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 99 }}>
      
      {/* Tombol AI */}
      <button className="fab-main fab-ai-bounce" onClick={onOpenAi} title="Asisten Ai Toko" style={{ background: '#2563eb', width: '44px', height: '44px', borderRadius: '50%', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.3)', cursor: 'pointer', fontSize: '18px' }}>
        😀
      </button>

      {/* Tombol Keranjang */}
      <button className="fab-main" onClick={onOpenCart} title="Buka Keranjang" style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '50%', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.3)', cursor: 'pointer', background: '#2563eb' }}>
        🛒
        {/* Badge jumlah barang di keranjang */}
        <span className="cart-badge" style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#dc2626', color: 'white', fontSize: '0.65rem', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', border: '2px solid #fff' }}>
          {totalItems}
        </span>
      </button>

    </div>
  );
}
