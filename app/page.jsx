'use client';

import { useEffect, useMemo, useState } from 'react';
import { StoreContextProvider, useStoreContext } from '../components/StoreContext';

function GatewayContent() {
  const { tokoId, hasStoreContext, storeIdentity, storeSettings, produkList, loading, error } = useStoreContext();
  const [previewProducts, setPreviewProducts] = useState([]);

  useEffect(() => {
    setPreviewProducts(
      produkList
        .filter((produk) => produk.aktif !== false)
        .slice(0, 4)
    );
  }, [produkList]);

  const namaToko = useMemo(() => storeIdentity?.namaToko || '', [storeIdentity]);
  const infoToko = storeSettings?.infoToko || storeSettings?.runningText || '';
  const customerHref = hasStoreContext ? `/customer?tokoId=${encodeURIComponent(tokoId)}` : null;

  return (
    <main className="qp-gateway">
      <section className="qp-gateway-card" aria-labelledby="gateway-title">
        <div className="qp-gateway-brand" aria-hidden="true">🛒</div>
        <p className="qp-gateway-eyebrow">KASIRQUH V4</p>
        <h1 id="gateway-title">{namaToko || 'Selamat datang'}</h1>
        <p className="qp-gateway-subtitle">
          {namaToko ? 'Pilih toko dan mulai belanja tanpa harus login dulu.' : 'Selamat datang di KasirQuh.'}
        </p>

        {hasStoreContext && (
          <div className="qp-gateway-preview" aria-live="polite">
            {infoToko && <p className="qp-gateway-preview-info">📢 {infoToko}</p>}
            {loading ? (
              <p className="qp-gateway-preview-muted">Memuat preview toko...</p>
            ) : error ? (
              <p className="qp-gateway-preview-muted">Preview toko belum dapat dimuat.</p>
            ) : previewProducts.length ? (
              <div className="qp-gateway-preview-products">
                {previewProducts.map((produk) => (
                  <div className="qp-gateway-preview-product" key={produk.id}>
                    <div className="qp-gateway-preview-product-image">
                      {produk.foto ? <img src={produk.foto} alt="" loading="lazy" /> : <span aria-hidden="true">🛍️</span>}
                    </div>
                    <div>
                      <strong>{produk.nama || 'Produk'}</strong>
                      <small>{produk.hargaJual || produk.harga || 0}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="qp-gateway-preview-muted">Preview produk belum tersedia.</p>
            )}
          </div>
        )}

        <div className="qp-gateway-actions">
          {customerHref ? (
            <a className="qp-gateway-primary" href={customerHref}>
              <span className="qp-gateway-icon" aria-hidden="true">🛒</span>
              <span><strong>Mulai Belanja</strong><small>Masuk ke toko</small></span>
            </a>
          ) : (
            <div className="qp-gateway-primary qp-gateway-primary-disabled" role="status" aria-live="polite">
              <span className="qp-gateway-icon" aria-hidden="true">🛒</span>
              <span><strong>Mulai Belanja</strong><small>Tambahkan tokoId pada URL</small></span>
            </div>
          )}

          <a className="qp-gateway-admin" href="/login">
            <span className="qp-gateway-lock" aria-hidden="true">🔒</span>
            <span><strong>Panel Admin</strong><small>Masuk atau daftar toko</small></span>
          </a>
        </div>

        <p className="qp-gateway-note">
          Untuk testing manual, buka Gateway dengan <code>?tokoId=ID_TOKO</code>.
        </p>
      </section>
    </main>
  );
}

export default function Gateway() {
  return (
    <StoreContextProvider>
      <GatewayContent />
    </StoreContextProvider>
  );
}
