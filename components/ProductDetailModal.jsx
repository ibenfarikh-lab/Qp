'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ProductDetailModal({ product, onClose, onAdd, onAskAdmin }) {
  const [qty, setQty] = useState(1);

  const harga = Number(product?.hargaJual || product?.harga || 0);
  const stok = Number(product?.stok || 0);
  const total = useMemo(() => harga * qty, [harga, qty]);

  useEffect(() => {
    setQty(1);
  }, [product?.id]);

  if (!product) return null;

  const tambahQty = () => setQty((value) => Math.min(value + 1, stok));
  const kurangiQty = () => setQty((value) => Math.max(value - 1, 1));

  const handleAdd = () => {
    for (let i = 0; i < qty; i += 1) onAdd(product);
    onClose();
    setQty(1);
  };

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <section className="detail-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Detail ${product.nama || 'produk'}`}>
        <button className="close-btn" onClick={onClose} aria-label="Tutup">×</button>
        <div className="detail-visual">
          <img src={product.foto || '/placeholder.svg'} alt={product.nama || 'Produk'} />
        </div>
        <div className="detail-body">
          <h2>{product.nama || 'Tanpa nama'}</h2>
          <strong>Rp {harga.toLocaleString('id-ID')}</strong>
          <p>Stok: {stok} {product.satuan || 'pcs'}</p>
          {product.deskripsi ? <p className="detail-description">{product.deskripsi}</p> : null}

          <div className="detail-qty" aria-label="Jumlah produk">
            <button type="button" onClick={kurangiQty} disabled={qty <= 1}>−</button>
            <b>{qty}</b>
            <button type="button" onClick={tambahQty} disabled={qty >= stok}>+</button>
          </div>

          <div className="detail-total">
            <span>Total</span>
            <b>Rp {total.toLocaleString('id-ID')}</b>
          </div>

          <div className="detail-action-row">
            <button className="secondary-btn" type="button" onClick={() => onAskAdmin?.(product)}>
              💬 Tanya Admin
            </button>
            <button className="primary-btn" disabled={stok <= 0} onClick={handleAdd}>
              {stok <= 0 ? 'Produk habis' : '🛒 Tambah'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
