'use client';

import { useEffect, useState } from 'react';
import { subscribeStoreSettings } from '../lib/services/storeService';
import { saveStoreSettings } from '../lib/services/settingsService';
import { addCategory as addCategoryService, updateCategory, deleteCategory as deleteCategoryService } from '../lib/services/productService';

const DEFAULT_SETTINGS = {
  tampilkanStok: true,
  tampilkanIdeMasak: true,
  tampilkanProdukTerlaris: true,
  jumlahProduk: 20,
  tema: 'light',
};

const DEFAULT_PAYMENT = { bank: '', nomor: '', atasNama: '' };

const EMPTY_IDENTITY = { namaToko: '', logo: '', alamat: '', telepon: '' };

export default function AdminStoreSettingsPanel({ tokoId, authUser }) {
  const [identity, setIdentity] = useState(EMPTY_IDENTITY);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState([]);
  const [payment, setPayment] = useState(DEFAULT_PAYMENT);
  const [newCategory, setNewCategory] = useState({ nama: '', ikon: '🏷️' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ nama: '', ikon: '🏷️', urutan: 0, aktif: true });
  const [saving, setSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryDeleting, setCategoryDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tokoId) return undefined;
    return subscribeStoreSettings(tokoId, {
      onIdentity: (data) => setIdentity({ ...EMPTY_IDENTITY, ...data }),
      onHomeSettings: (data) => setSettings({ ...DEFAULT_SETTINGS, ...data }),
      onPayment: (data) => setPayment({ ...DEFAULT_PAYMENT, ...data }),
      onCategories: (rows) => { rows.sort((a, b) => Number(a.urutan || 0) - Number(b.urutan || 0)); setCategories(rows); },
      onError: (err, source) => {
        console.error(`[QP Settings] ${source}:`, err);
        setError(`${source === 'identity' ? 'Identitas toko' : source === 'payment' ? 'Pengaturan pembayaran' : source === 'categories' ? 'Kategori' : 'Pengaturan beranda'} belum dapat dibaca.`);
      },
    });
  }, [tokoId]);

  const saveStore = async (event) => {
    event.preventDefault();
    if (!tokoId || !authUser || saving) return;
    if (!identity.namaToko.trim()) return setError('Nama toko wajib diisi.');
    setSaving(true); setError(''); setMessage('');
    try {
      await saveStoreSettings(tokoId, authUser, {
        identity: { namaToko: identity.namaToko.trim(), logo: identity.logo.trim(), alamat: identity.alamat.trim(), telepon: identity.telepon.trim() },
        payment: { bank: payment.bank.trim(), nomor: payment.nomor.trim(), atasNama: payment.atasNama.trim() },
        settings: { tampilkanStok: Boolean(settings.tampilkanStok), tampilkanIdeMasak: Boolean(settings.tampilkanIdeMasak), tampilkanProdukTerlaris: Boolean(settings.tampilkanProdukTerlaris), jumlahProduk: Math.max(0, Number(settings.jumlahProduk || 0)), tema: settings.tema || 'light' },
      });
      setMessage('Pengaturan toko berhasil disimpan.');
    } catch (err) {
      console.error('[QP Settings] Simpan:', err); setError('Pengaturan belum tersimpan. Periksa izin Firestore.');
    } finally { setSaving(false); }
  };

  const handleAddCategory = async (event) => {
    event.preventDefault();
    const nama = newCategory.nama.trim();
    if (!nama || categorySaving) return;
    setCategorySaving(true); setError(''); setMessage('');
    try {
      const maxOrder = categories.reduce((max, item) => Math.max(max, Number(item.urutan || 0)), 0);
      await addCategoryService(tokoId, { nama, ikon: newCategory.ikon.trim() || '🏷️', urutan: maxOrder + 1, aktif: true }, authUser.uid);
      setNewCategory({ nama: '', ikon: '🏷️' }); setMessage('Kategori ditambahkan.');
    } catch (err) { console.error('[QP Settings] Tambah kategori:', err); setError('Kategori belum dapat ditambahkan.'); }
    finally { setCategorySaving(false); }
  };

  const startEditCategory = (item) => {
    setEditingCategory(item.id); setCategoryForm({ nama: item.nama || '', ikon: item.ikon || '🏷️', urutan: item.urutan || 0, aktif: item.aktif !== false }); setError('');
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    if (!editingCategory || !categoryForm.nama.trim() || categorySaving) return;
    setCategorySaving(true); setError('');
    try {
      await updateCategory(tokoId, editingCategory, { nama: categoryForm.nama.trim(), ikon: categoryForm.ikon.trim() || '🏷️', urutan: Number(categoryForm.urutan || 0), aktif: Boolean(categoryForm.aktif) }, authUser.uid);
      setEditingCategory(null); setMessage('Kategori diperbarui.');
    } catch (err) { console.error('[QP Settings] Edit kategori:', err); setError('Kategori belum dapat diperbarui.'); }
    finally { setCategorySaving(false); }
  };

  const handleDeleteCategory = async (id) => {
    if (categoryDeleting || !window.confirm('Hapus kategori ini? Produk yang memakai kategori ini tidak ikut terhapus.')) return;
    setCategoryDeleting(true);
    setError(''); setMessage('');
    try {
      await deleteCategoryService(tokoId, id);
      setMessage('Kategori dihapus.');
    } catch (err) { console.error('[QP Settings] Hapus kategori:', err); setError('Kategori belum dapat dihapus.'); }
    finally { setCategoryDeleting(false); }
  };

  return (
    <section className="admin-settings-panel">
      <header className="admin-settings-heading"><div><span>ADMIN • TOKO</span><h1>Pengaturan Toko</h1><p>Atur identitas, tampilan beranda pelanggan, dan kategori dari toko ini.</p></div><a href="/admin" className="admin-settings-link">← Dashboard</a></header>
      {message && <div className="admin-settings-message">✓ {message}</div>}
      {error && <div className="admin-settings-error">{error}</div>}

      <form className="admin-settings-card" onSubmit={saveStore}>
        <div className="admin-settings-card-head"><h2>🏪 Identitas Toko</h2><span>Dipakai di halaman pelanggan</span></div>
        <div className="admin-settings-grid">
          <label>Nama toko<input value={identity.namaToko} onChange={(e) => setIdentity({ ...identity, namaToko: e.target.value })} /></label>
          <label>Nomor WhatsApp<input value={identity.telepon} onChange={(e) => setIdentity({ ...identity, telepon: e.target.value })} placeholder="08..." /></label>
          <label className="full">URL logo<input value={identity.logo} onChange={(e) => setIdentity({ ...identity, logo: e.target.value })} placeholder="https://..." /></label>
          <label className="full">Alamat<textarea value={identity.alamat} onChange={(e) => setIdentity({ ...identity, alamat: e.target.value })} rows="2" /></label>
        </div>

        <div className="admin-settings-card-head sub"><h2>🏠 Beranda Pelanggan</h2><span>Perubahan tersinkron realtime</span></div>
        <div className="admin-settings-options">
          <label><input type="checkbox" checked={Boolean(settings.tampilkanStok)} onChange={(e) => setSettings({ ...settings, tampilkanStok: e.target.checked })} /> Tampilkan stok</label>
          <label><input type="checkbox" checked={Boolean(settings.tampilkanIdeMasak)} onChange={(e) => setSettings({ ...settings, tampilkanIdeMasak: e.target.checked })} /> Tampilkan ide masak</label>
          <label><input type="checkbox" checked={Boolean(settings.tampilkanProdukTerlaris)} onChange={(e) => setSettings({ ...settings, tampilkanProdukTerlaris: e.target.checked })} /> Tampilkan produk terlaris</label>
        </div>
        <div className="admin-settings-grid compact">
          <label>Jumlah produk awal<input type="number" min="0" max="200" value={settings.jumlahProduk} onChange={(e) => setSettings({ ...settings, jumlahProduk: e.target.value })} /></label>
          <label>Tema default<select value={settings.tema} onChange={(e) => setSettings({ ...settings, tema: e.target.value })}><option value="light">Light</option><option value="dark">Dark</option><option value="modern">Modern</option></select></label>
        </div>
        <div className="admin-settings-card-head sub"><h2>💳 Pembayaran Transfer</h2><span>Ditampilkan saat pelanggan memilih transfer</span></div>
        <div className="admin-settings-grid compact">
          <label>Bank<input value={payment.bank} onChange={(e) => setPayment({ ...payment, bank: e.target.value })} placeholder="BCA / BRI / Mandiri..." /></label>
          <label>Nomor rekening<input value={payment.nomor} onChange={(e) => setPayment({ ...payment, nomor: e.target.value })} placeholder="Nomor rekening" inputMode="numeric" /></label>
          <label className="full">Atas nama<input value={payment.atasNama} onChange={(e) => setPayment({ ...payment, atasNama: e.target.value })} placeholder="Nama pemilik rekening" /></label>
        </div>
        <button className="admin-settings-primary" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Toko'}</button>
      </form>

      <section className="admin-settings-card">
        <div className="admin-settings-card-head"><div><h2>🏷️ Kategori Produk</h2><span>{categories.length} kategori</span></div></div>
        <form className="admin-category-add" onSubmit={handleAddCategory}><input value={newCategory.nama} onChange={(e) => setNewCategory({ ...newCategory, nama: e.target.value })} placeholder="Nama kategori baru" required /><input value={newCategory.ikon} onChange={(e) => setNewCategory({ ...newCategory, ikon: e.target.value })} aria-label="Ikon kategori" maxLength="4" /><button type="submit" disabled={categorySaving}>＋ Tambah</button></form>
        <div className="admin-category-list">
          {!categories.length && <div className="admin-settings-empty">Belum ada kategori.</div>}
          {categories.map((item) => editingCategory === item.id ? (
            <form key={item.id} className="admin-category-row editing" onSubmit={saveCategory}><input value={categoryForm.ikon} onChange={(e) => setCategoryForm({ ...categoryForm, ikon: e.target.value })} maxLength="4" /><input value={categoryForm.nama} onChange={(e) => setCategoryForm({ ...categoryForm, nama: e.target.value })} required /><input type="number" value={categoryForm.urutan} onChange={(e) => setCategoryForm({ ...categoryForm, urutan: e.target.value })} min="0" aria-label="Urutan" /><label><input type="checkbox" checked={categoryForm.aktif} onChange={(e) => setCategoryForm({ ...categoryForm, aktif: e.target.checked })} /> aktif</label><button type="submit" disabled={categorySaving}>Simpan</button><button type="button" onClick={() => setEditingCategory(null)}>Batal</button></form>
          ) : (
            <article key={item.id} className={`admin-category-row ${item.aktif === false ? 'off' : ''}`}><span className="admin-category-icon">{item.ikon || '🏷️'}</span><span><b>{item.nama || item.id}</b><small>urutan {Number(item.urutan || 0)} • {item.aktif === false ? 'nonaktif' : 'aktif'}</small></span><div><button type="button" onClick={() => startEditCategory(item)}>Edit</button><button type="button" className="danger" onClick={() => handleDeleteCategory(item.id)}>Hapus</button></div></article>
          ))}
        </div>
      </section>
    </section>
  );
}
