'use client';

import { useEffect, useMemo, useState } from 'react';
import { subscribeProducts, subscribeCategories, saveProduct as saveProductService, setProductActive, deleteProduct } from '../lib/services/productService';

const EMPTY_FORM = {
  nama: '', harga: '', stok: '', satuan: 'pcs', kategoriId: '', foto: '', deskripsi: '', aktif: true,
};

function rupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function AdminProductPanel({ tokoId, authUser }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('semua');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tokoId) return undefined;
    const unsubs = [
      subscribeProducts(tokoId, (rows) => {
        rows.sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id'));
        setProducts(rows);
      }, (err) => { console.error('[QP Admin Products] Produk:', err); setError('Produk belum dapat dibaca. Periksa izin Firestore.'); }),
      subscribeCategories(tokoId, (rows) => {
        rows = rows.filter((x) => x.aktif !== false);
        rows.sort((a, b) => Number(a.urutan || 0) - Number(b.urutan || 0));
        setCategories(rows);
      }, (err) => { console.error('[QP Admin Products] Kategori:', err); }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [tokoId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('id-ID');
    return products.filter((p) => {
      const cat = p.kategoriId || '';
      const text = [p.nama, p.deskripsi, p.satuan].filter(Boolean).join(' ').toLocaleLowerCase('id-ID');
      return (!q || text.includes(q)) && (categoryFilter === 'semua' || cat === categoryFilter);
    });
  }, [products, query, categoryFilter]);

  const startNew = () => {
    setSelectedId(null); setEditing(true); setForm({ ...EMPTY_FORM, kategoriId: categories[0]?.id || '' }); setError('');
  };

  const startEdit = (product) => {
    setSelectedId(product.id); setEditing(true); setError('');
    setForm({
      nama: product.nama || '', harga: product.hargaJual ?? product.harga ?? '', stok: product.stok ?? '', satuan: product.satuan || 'pcs',
      kategoriId: product.kategoriId || '', foto: product.foto || '', deskripsi: product.deskripsi || '', aktif: product.aktif !== false,
    });
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSaveProduct = async (event) => {
    event.preventDefault();
    if (!tokoId || !authUser || saving) return;
    const nama = form.nama.trim();
    const harga = Number(form.harga);
    const stok = Number(form.stok);
    if (!nama) return setError('Nama produk wajib diisi.');
    if (!Number.isFinite(harga) || harga < 0) return setError('Harga produk tidak valid.');
    if (!Number.isFinite(stok) || stok < 0) return setError('Stok produk tidak valid.');

    setSaving(true); setError('');
    try {
      const payload = {
        nama, harga, hargaJual: harga, stok, satuan: form.satuan.trim() || 'pcs', kategoriId: form.kategoriId || null,
        foto: form.foto.trim() || '', deskripsi: form.deskripsi.trim() || '', aktif: Boolean(form.aktif),
      };
      await saveProductService(tokoId, selectedId, payload, authUser.uid);
      setEditing(false); setSelectedId(null); setForm(EMPTY_FORM);
    } catch (err) {
      console.error('[QP Admin Products] Simpan:', err); setError('Produk belum tersimpan. Periksa izin Firestore.');
    } finally { setSaving(false); }
  };

  const toggleActive = async (product) => {
    try {
      await setProductActive(tokoId, product.id, product.aktif === false, authUser.uid);
    } catch (err) { console.error('[QP Admin Products] Aktif:', err); setError('Status produk belum berubah.'); }
  };

  const removeProduct = async () => {
    if (!selectedId || deleting) return;
    if (!window.confirm('Hapus produk ini? Data pesanan lama tetap menyimpan nama produk yang sudah dipesan.')) return;
    setDeleting(true); setError('');
    try {
      await deleteProduct(tokoId, selectedId);
      setEditing(false); setSelectedId(null); setForm(EMPTY_FORM);
    } catch (err) { console.error('[QP Admin Products] Hapus:', err); setError('Produk belum dapat dihapus.'); }
    finally { setDeleting(false); }
  };

  return (
    <section className="admin-product-panel">
      <header className="admin-product-heading">
        <div><span>ADMIN • KATALOG</span><h2>Kelola Produk</h2><small>{products.length} produk terdaftar</small></div>
        <button type="button" className="admin-product-primary" onClick={startNew}>＋ Produk</button>
      </header>

      {error && <div className="admin-product-error">{error}</div>}

      <div className="admin-product-toolbar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama produk..." aria-label="Cari produk" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter kategori">
          <option value="semua">Semua kategori</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nama || cat.id}</option>)}
        </select>
      </div>

      <div className="admin-product-layout">
        <div className="admin-product-list">
          {!filtered.length && <div className="admin-product-empty">Belum ada produk yang cocok.</div>}
          {filtered.map((product) => (
            <article key={product.id} className={`admin-product-item ${selectedId === product.id ? 'selected' : ''}`}>
              <button type="button" className="admin-product-item-main" onClick={() => startEdit(product)}>
                <span className="admin-product-thumb">{product.foto ? <img src={product.foto} alt="" /> : '🛍️'}</span>
                <span><b>{product.nama || 'Produk'}</b><small>{rupiah(product.hargaJual ?? product.harga)} • stok {Number(product.stok || 0)} {product.satuan || 'pcs'}{Number(product.stok || 0) <= 5 ? ' • stok menipis' : ''}</small></span>
              </button>
              <div className="admin-product-item-actions">
                <span className={`admin-product-active ${product.aktif === false ? 'off' : ''}`}>{product.aktif === false ? 'Nonaktif' : 'Aktif'}</span>
                <button type="button" onClick={() => toggleActive(product)}>{product.aktif === false ? 'Tampilkan' : 'Sembunyikan'}</button>
              </div>
            </article>
          ))}
        </div>

        {editing && (
          <form className="admin-product-form" onSubmit={handleSaveProduct}>
            <div className="admin-product-form-head"><h3>{selectedId ? 'Edit Produk' : 'Produk Baru'}</h3><button type="button" onClick={() => { setEditing(false); setSelectedId(null); }}>✕</button></div>
            <label>Nama produk<input value={form.nama} onChange={(e) => setField('nama', e.target.value)} required /></label>
            <div className="admin-product-form-grid">
              <label>Harga<input type="number" min="0" value={form.harga} onChange={(e) => setField('harga', e.target.value)} required /></label>
              <label>Stok<input type="number" min="0" value={form.stok} onChange={(e) => setField('stok', e.target.value)} required /></label>
            </div>
            <div className="admin-product-form-grid">
              <label>Satuan<input value={form.satuan} onChange={(e) => setField('satuan', e.target.value)} placeholder="pcs" /></label>
              <label>Kategori<select value={form.kategoriId} onChange={(e) => setField('kategoriId', e.target.value)}><option value="">Tanpa kategori</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nama}</option>)}</select></label>
            </div>
            <label>URL foto<input value={form.foto} onChange={(e) => setField('foto', e.target.value)} placeholder="https://..." /></label>
            <label>Deskripsi<textarea value={form.deskripsi} onChange={(e) => setField('deskripsi', e.target.value)} rows="4" /></label>
            <label className="admin-product-check"><input type="checkbox" checked={form.aktif} onChange={(e) => setField('aktif', e.target.checked)} /> Produk tampil di katalog pelanggan</label>
            <div className="admin-product-form-actions"><button type="submit" className="admin-product-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Produk'}</button>{selectedId && <button type="button" className="admin-product-danger" disabled={deleting} onClick={removeProduct}>{deleting ? 'Menghapus...' : 'Hapus'}</button>}</div>
          </form>
        )}
      </div>
    </section>
  );
}
