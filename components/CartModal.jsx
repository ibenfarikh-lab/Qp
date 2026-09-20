// Lokasi file: components/CartModal.jsx
'use client';

export default function CartModal({ isOpen, onClose, cart, updateQty, onCheckout }) {
  // Kalau modal tidak sedang dibuka, jangan render apa-apa
  if (!isOpen) return null;

  // Hitung total harga otomatis
  const grandTotal = cart.reduce((total, item) => total + (item.harga * item.qty), 0);

  return (
    // Background gelap
    <div className="modal-backdrop show" onClick={onClose} style={{ display: 'flex' }}>
      
      {/* Kotak Putih Keranjang (Klik di sini tidak akan menutup modal) */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', width: '95%', maxHeight: '85vh', borderRadius: '16px', padding: '12px', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        
        <div className="modal-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Keranjang Belanja</h3>
          <button onClick={onClose} style={{ fontSize: '1.1rem', background:'none', border:'none', cursor:'pointer' }}>&times;</button>
        </div>

        <div className="cart-table-wrapper" style={{ maxHeight: '30vh', overflowY: 'auto' }}>
          <table className="cart-table" style={{ fontSize: '0.78rem', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '42%' }}>Barang</th>
                <th style={{ width: '34%', textAlign: 'center' }}>Atur Qty</th>
                <th style={{ width: '24%', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '10px' }}>Keranjang kosong</td></tr>
              ) : (
                cart.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nama}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width: '22px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px' }}>-</button>
                      <span style={{ margin: '0 8px' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width: '22px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px' }}>+</button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      Rp {(item.harga * item.qty).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="summary-box">
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>Total:</span> <span style={{ color: '#16a34a' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
          </div>
          
          <button
            className="btn-success"
            onClick={onCheckout}
            disabled={!cart.length}
            style={{ background: cart.length ? '#16a34a' : '#94a3b8', color: 'white', padding: '10px', borderRadius: '6px', width: '100%', marginTop: '10px', border: 'none', fontWeight: 'bold', cursor: cart.length ? 'pointer' : 'not-allowed' }}
          >
            🛒 Lanjut Pesanan
          </button>
        </div>

      </div>
    </div>
  );
}
