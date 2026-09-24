'use client';

import { useMemo, useState } from 'react';
import { StoreContextProvider, useStoreContext } from '../components/StoreContext';

const DEFAULT_CATEGORY = 'Semua';
const PREVIEW_LIMIT = 8;

function money(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
}

function GatewayContent() {
  const { tokoId, hasStoreContext, storeIdentity, storeSettings, produkList, kategoriList, loading, error } = useStoreContext();
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [query, setQuery] = useState('');

  const namaToko = storeIdentity?.namaToko || 'KasirQuh';
  const infoToko = storeSettings?.infoToko || storeSettings?.runningText || 'Selamat datang di toko kami 👋';
  const customerHref = hasStoreContext ? `/customer?tokoId=${encodeURIComponent(tokoId)}` : null;
  const loginHref = `/login${customerHref ? `?returnTo=${encodeURIComponent(customerHref)}` : ''}`;

  const categories = useMemo(() => [
    { id: DEFAULT_CATEGORY, nama: DEFAULT_CATEGORY, ikon: '⌂' },
    ...kategoriList.filter((item) => item?.nama).map((item) => ({ id: item.id, nama: item.nama, ikon: item.ikon || '•' })),
  ], [kategoriList]);

  const products = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('id-ID');
    return produkList
      .filter((p) => p?.aktif !== false)
      .filter((p) => {
        const categoryName = p.kategori || p.namaKategori || '';
        const categoryId = p.kategoriId || '';
        const categoryMatch = category === DEFAULT_CATEGORY || categoryName === category || categoryId === category;
        const haystack = [p.nama, p.deskripsi, p.satuan, categoryName].filter(Boolean).join(' ').toLocaleLowerCase('id-ID');
        return categoryMatch && (!q || haystack.includes(q));
      })
      .slice(0, PREVIEW_LIMIT);
  }, [produkList, category, query]);

  const totalActive = produkList.filter((p) => p?.aktif !== false).length;

  return (
    <main className="qp-gateway-page">
      <header className="qp-gateway-topbar">
        <a className="qp-gateway-logo" href="/" aria-label="KasirQuh Gateway">
          <span className="qp-gateway-logo-mark">K</span>
          <span>KasirQuh</span>
        </a>
        <div className="qp-gateway-top-actions">
          <a className="qp-gateway-login-link" href={loginHref}>Masuk</a>
          <a className="qp-gateway-admin-cta" href={loginHref}>Panel Admin</a>
        </div>
      </header>

      <section className="qp-gateway-hero" aria-labelledby="gateway-title">
        <div className="qp-gateway-hero-copy">
          <span className="qp-gateway-kicker">TOKO ONLINE</span>
          <h1 id="gateway-title">{namaToko}</h1>
          <p>{infoToko}</p>
          <div className="qp-gateway-hero-actions">
            {customerHref ? <a className="qp-gateway-primary" href={customerHref}>Mulai Belanja <span>→</span></a> : <a className="qp-gateway-primary" href="/login">Masuk untuk Belanja <span>→</span></a>}
            <a className="qp-gateway-secondary" href={loginHref}>🔐 Login</a>
          </div>
          <div className="qp-gateway-meta">
            <span>● Toko aktif</span>
            <span>{totalActive} produk tersedia</span>
          </div>
        </div>
        <div className="qp-gateway-hero-card" aria-label="Ringkasan toko">
          <div className="qp-gateway-store-symbol">{storeIdentity?.logo ? <img src={storeIdentity.logo} alt="" /> : '🛍️'}</div>
          <strong>{namaToko}</strong>
          <span>Preview toko publik</span>
          {storeIdentity?.alamat && <small>📍 {storeIdentity.alamat}</small>}
          {storeIdentity?.telepon && <small>☎ {storeIdentity.telepon}</small>}
        </div>
      </section>

      {!hasStoreContext && (
        <section className="qp-gateway-context" role="status">
          <strong>Toko belum dipilih</strong>
          <p>Gateway membutuhkan <code>?tokoId=ID_TOKO</code> untuk menampilkan storefront.</p>
        </section>
      )}

      {hasStoreContext && (
        <section className="qp-gateway-storefront" aria-labelledby="catalog-title">
          <div className="qp-gateway-section-head">
            <div><span className="qp-gateway-kicker">PREVIEW</span><h2 id="catalog-title">Lihat isi toko</h2></div>
            <span className="qp-gateway-readonly">Preview publik</span>
          </div>

          <div className="qp-gateway-toolbar">
            <label className="qp-gateway-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari produk..." aria-label="Cari produk" /></label>
            <div className="qp-gateway-categories" aria-label="Kategori produk">
              {categories.map((item) => <button key={item.id} type="button" className={category === item.id || (category === item.nama && item.id === item.nama) ? 'active' : ''} onClick={() => setCategory(item.id)}>{item.ikon} {item.nama}</button>)}
            </div>
          </div>

          {loading ? <div className="qp-gateway-state">Memuat produk toko...</div> : error ? <div className="qp-gateway-state">Data toko belum dapat dimuat.</div> : products.length ? (
            <div className="qp-gateway-products">
              {products.map((product) => (
                <article className="qp-gateway-product" key={product.id}>
                  <div className="qp-gateway-product-image">{product.foto ? <img src={product.foto} alt={product.nama || 'Produk'} loading="lazy" /> : <span>🛍️</span>}</div>
                  <div className="qp-gateway-product-body">
                    <small>{product.kategori || product.namaKategori || 'Produk'}</small>
                    <h3>{product.nama || 'Produk'}</h3>
                    {product.deskripsi && <p>{product.deskripsi}</p>}
                    <div className="qp-gateway-product-foot"><strong>{money(product.hargaJual ?? product.harga)}</strong>{storeSettings?.tampilkanStok !== false && <span>{Number(product.stok || 0) > 0 ? `Stok ${product.stok}` : 'Habis'}</span>}</div>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="qp-gateway-state"><strong>Produk belum tersedia</strong><span>Coba kategori atau kata kunci lain.</span></div>}

          <div className="qp-gateway-more"><span>Gateway hanya menampilkan preview.</span>{customerHref && <a href={customerHref}>Buka toko lengkap →</a>}</div>
        </section>
      )}

      <section className="qp-gateway-login-banner">
        <div><span className="qp-gateway-kicker">AKSES LANJUTAN</span><h2>Siap masuk ke toko?</h2><p>Checkout, riwayat pesanan, chat, profil, dan fitur pelanggan tersedia setelah login.</p></div>
        <a className="qp-gateway-primary" href={loginHref}>Masuk / Daftar <span>→</span></a>
      </section>

      <footer className="qp-gateway-footer"><span>© KasirQuh</span><span>Public Gateway · Customer App · Admin Panel</span></footer>
    </main>
  );
}

export default function Gateway() {
  return <StoreContextProvider><GatewayContent /></StoreContextProvider>;
}
