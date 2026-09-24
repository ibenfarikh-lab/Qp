'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ProductDetailModal({ product, onClose, onAdd, onAskAdmin }) {
  const [qty, setQty] = useState(1);

  const harga = Number(product?.hargaJual || product?.harga || 0);
  const stok = Number(product?.stok || 0);
  const total = useMemo(() => harga * qty, [harga, qty]);
  const formatQty = (value) => Number(value).toLocaleString('id-ID', { maximumFractionDigits: 3 });
  const normalizeQty = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.min(Math.max(Math.round(numeric * 1000) / 1000, 0), Math.max(stok, 0));
  };

  useEffect(() => {
    setQty(1);
  }, [product?.id]);

  if (!product) return null;

  const tambahQty = () => setQty((value) => normalizeQty(value + 1));
  const kurangiQty = () => setQty((value) => normalizeQty(Math.max(value - 1, 0.001)));
  const handleQtyInput = (event) => {
    const raw = event.target.value;
    if (raw === '') { setQty(''); return; }
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return;
    setQty(normalizeQty(numeric));
  };

  const handleAdd = () => {
    const finalQty = normalizeQty(qty);
    if (finalQty <= 0 || finalQty > stok) return;
    onAdd(product, finalQty);
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
            <button type="button" onClick={kurangiQty} disabled={Number(qty) <= 0.001}>−</button>
            <input
              type="number"
              min="0.001"
              max={stok}
              step="0.001"
              inputMode="decimal"
              value={qty}
              onChange={handleQtyInput}
              aria-label="Jumlah produk"
            />
            <button type="button" onClick={tambahQty} disabled={Number(qty) >= stok}>+</button>
          </div>

          <div className="detail-total">
            <span>Total</span>
            <b>Rp {total.toLocaleString('id-ID')}</b>
          </div>

          <div className="detail-action-row">
            <button className="secondary-btn" type="button" onClick={() => onAskAdmin?.(product)}>
              💬 Tanya Admin
            </button>
            <button className="primary-btn" disabled={stok <= 0 || !Number(qty) || Number(qty) > stok} onClick={handleAdd}>
              {stok <= 0 ? 'Produk habis' : '🛒 Tambah'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
