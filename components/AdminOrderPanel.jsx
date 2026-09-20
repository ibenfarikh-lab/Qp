'use client';

import { useEffect, useMemo, useState } from 'react';
import { db, firebase } from '../lib/firebase';

const STATUS = [
  { key: 'menunggu', label: 'Menunggu', icon: '⏳' },
  { key: 'diproses', label: 'Diproses', icon: '👨‍🍳' },
  { key: 'siap', label: 'Siap', icon: '📦' },
  { key: 'diantar', label: 'Diantar', icon: '🛵' },
  { key: 'selesai', label: 'Selesai', icon: '✅' },
  { key: 'dibatalkan', label: 'Dibatalkan', icon: '❌' },
];

function formatTime(value) {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function rupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function AdminOrderPanel({ tokoId, authUser }) {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('semua');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    if (!tokoId) return undefined;
    setLoading(true);
    const ref = db.collection('toko').doc(tokoId).collection('pesanan');
    const unsubscribe = ref.onSnapshot((snapshot) => {
      const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      rows.sort((a, b) => {
        const at = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bt - at;
      });
      setOrders(rows);
      setSelectedId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id || null);
      setLoading(false);
    }, (snapshotError) => {
      console.error('[QP Admin Orders] Gagal membaca pesanan:', snapshotError);
      setError('Daftar pesanan belum dapat dibuka. Periksa izin Firestore.');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tokoId]);

  const filteredOrders = useMemo(() => {
    if (filter === 'semua') return orders;
    return orders.filter((order) => String(order.status || 'menunggu').toLowerCase() === filter);
  }, [orders, filter]);

  const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedId) || null, [orders, selectedId]);

  const updateStatus = async (nextStatus) => {
    if (!selectedOrder || !tokoId || !authUser || saving) return;
    const currentStatus = String(selectedOrder.status || 'menunggu').toLowerCase();
    if (currentStatus === nextStatus) return;

    setSaving(true);
    setError('');
    try {
      const tokoRef = db.collection('toko').doc(tokoId);
      const orderRef = tokoRef.collection('pesanan').doc(selectedOrder.id);
      const now = firebase.firestore.FieldValue.serverTimestamp();

      await db.runTransaction(async (transaction) => {
        const freshOrderSnap = await transaction.get(orderRef);
        if (!freshOrderSnap.exists) throw new Error('ORDER_NOT_FOUND');
        const order = freshOrderSnap.data() || {};
        const status = String(order.status || 'menunggu').toLowerCase();
        const items = Array.isArray(order.items) ? order.items : [];

        // Stok dikurangi tepat satu kali ketika pesanan mulai diproses.
        // Menunggu tidak mengunci/mengurangi stok agar pesanan yang belum
        // dikonfirmasi tidak menghabiskan stok toko.
        if (nextStatus === 'diproses' && !order.stokDikurangi) {
          const productRefs = items.map((item) => ({
            item,
            ref: tokoRef.collection('produk').doc(String(item.produkId || '')),
          })).filter(({ item }) => item.produkId);

          const productSnaps = [];
          for (const entry of productRefs) productSnaps.push({ ...entry, snap: await transaction.get(entry.ref) });

          const shortages = [];
          for (const entry of productSnaps) {
            if (!entry.snap.exists) {
              shortages.push(`${entry.item.nama || entry.item.produkId}: produk tidak ditemukan`);
              continue;
            }
            const data = entry.snap.data() || {};
            const stock = Number(data.stok || 0);
            const qty = Number(entry.item.qty || 0);
            if (!Number.isFinite(qty) || qty <= 0 || stock < qty) {
              shortages.push(`${entry.item.nama || entry.item.produkId}: stok ${stock}, butuh ${qty}`);
            }
          }
          if (shortages.length) throw new Error(`STOCK_SHORTAGE:${shortages.join(' | ')}`);

          for (const entry of productSnaps) {
            const data = entry.snap.data() || {};
            const stock = Number(data.stok || 0);
            const qty = Number(entry.item.qty || 0);
            transaction.update(entry.ref, {
              stok: stock - qty,
              updatedAt: now,
              updatedBy: authUser.uid,
              stokTerakhirBerubah: now,
              stokSumber: 'pesanan',
            });
          }
        }

        // Jika pesanan yang stoknya sudah dipotong dibatalkan, kembalikan stok
        // satu kali. Pesanan yang belum diproses tidak melakukan pengembalian.
        if (nextStatus === 'dibatalkan' && order.stokDikurangi && !order.stokDikembalikan) {
          const productRefs = items.map((item) => ({
            item,
            ref: tokoRef.collection('produk').doc(String(item.produkId || '')),
          })).filter(({ item }) => item.produkId);
          const productSnaps = [];
          for (const entry of productRefs) productSnaps.push({ ...entry, snap: await transaction.get(entry.ref) });

          for (const entry of productSnaps) {
            if (!entry.snap.exists) continue;
            const data = entry.snap.data() || {};
            const stock = Number(data.stok || 0);
            const qty = Number(entry.item.qty || 0);
            transaction.update(entry.ref, {
              stok: stock + qty,
              updatedAt: now,
              updatedBy: authUser.uid,
              stokTerakhirBerubah: now,
              stokSumber: 'pembatalan-pesanan',
            });
          }
        }

        const orderUpdate = {
          status: nextStatus,
          updatedAt: now,
          statusUpdatedAt: now,
          statusUpdatedBy: authUser.uid,
        };
        if (nextStatus === 'diproses' && !order.stokDikurangi) {
          orderUpdate.stokDikurangi = true;
          orderUpdate.stokDikurangiAt = now;
          orderUpdate.stokDikurangiBy = authUser.uid;
        }
        if (nextStatus === 'dibatalkan' && order.stokDikurangi && !order.stokDikembalikan) {
          orderUpdate.stokDikembalikan = true;
          orderUpdate.stokDikembalikanAt = now;
          orderUpdate.stokDikembalikanBy = authUser.uid;
        }
        transaction.set(orderRef, orderUpdate, { merge: true });
      });
    } catch (updateError) {
      console.error('[QP Admin Orders] Gagal mengubah status/stok:', updateError);
      if (String(updateError?.message || '').startsWith('STOCK_SHORTAGE:')) {
        setError(`Status belum diubah karena stok tidak cukup. ${String(updateError.message).replace('STOCK_SHORTAGE:', '')}`);
      } else if (updateError?.message === 'ORDER_NOT_FOUND') {
        setError('Pesanan sudah tidak tersedia. Muat ulang daftar pesanan.');
      } else {
        setError('Status pesanan belum berubah. Stok juga tidak diubah. Coba lagi.');
      }
    } finally {
      setSaving(false);
    }
  };


  const updatePaymentStatus = async (nextStatus) => {
    if (!selectedOrder || !tokoId || !authUser || paymentSaving) return;
    if (selectedOrder.metodePembayaran !== 'transfer') {
      setError('Status pembayaran hanya dapat diverifikasi untuk pesanan transfer.');
      return;
    }
    if (!['lunas', 'ditolak', 'menunggu_verifikasi'].includes(nextStatus)) return;
    setPaymentSaving(true);
    setError('');
    try {
      const now = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('toko').doc(tokoId).collection('pesanan').doc(selectedOrder.id).set({
        statusPembayaran: nextStatus,
        pembayaran: {
          ...(selectedOrder.pembayaran || {}),
          status: nextStatus,
          diverifikasiOleh: authUser.uid,
          diverifikasiAt: now,
        },
        updatedAt: now,
      }, { merge: true });
    } catch (err) {
      console.error('[QP Admin Orders] Gagal mengubah pembayaran:', err);
      setError('Status pembayaran belum berubah. Periksa izin Firestore.');
    } finally {
      setPaymentSaving(false);
    }
  };

  const statusCount = (key) => orders.filter((order) => String(order.status || 'menunggu').toLowerCase() === key).length;

  if (!tokoId) return <section className="admin-order-panel"><div className="admin-order-empty">Toko belum tersedia.</div></section>;

  return (
    <section className="admin-order-panel">
      <header className="admin-order-heading">
        <div><span>ADMIN • PESANAN</span><h2>Kelola Pesanan</h2></div>
        <strong>{orders.length}</strong>
      </header>

      <div className="admin-order-filters" role="tablist" aria-label="Filter status pesanan">
        <button type="button" className={filter === 'semua' ? 'active' : ''} onClick={() => setFilter('semua')}>Semua <b>{orders.length}</b></button>
        {STATUS.slice(0, 5).map((item) => (
          <button key={item.key} type="button" className={filter === item.key ? 'active' : ''} onClick={() => setFilter(item.key)}>{item.icon} {item.label} <b>{statusCount(item.key)}</b></button>
        ))}
      </div>

      {error && <div className="admin-order-error">{error}</div>}

      <div className="admin-order-layout">
        <aside className="admin-order-list">
          {loading && <div className="admin-order-empty">Memuat pesanan...</div>}
          {!loading && !filteredOrders.length && <div className="admin-order-empty">Belum ada pesanan pada filter ini.</div>}
          {!loading && filteredOrders.map((order) => (
            <button key={order.id} type="button" className={`admin-order-item ${selectedId === order.id ? 'selected' : ''}`} onClick={() => setSelectedId(order.id)}>
              <span className="admin-order-item-main">
                <b>{order.kodePesanan || `#${order.id.slice(0, 8)}`}</b>
                <small>{order.pelanggan?.nama || 'Pelanggan'} • {order.jumlahItem || (order.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0)} item</small>
                <em>{formatTime(order.createdAt)}</em>
              </span>
              <span className={`admin-order-status status-${String(order.status || 'menunggu').toLowerCase()}`}>{STATUS.find((s) => s.key === String(order.status || 'menunggu').toLowerCase())?.label || order.status || 'Menunggu'}</span>
            </button>
          ))}
        </aside>

        <div className="admin-order-detail">
          {!selectedOrder ? <div className="admin-order-empty">Pilih pesanan untuk melihat detail.</div> : (
            <>
              <header className="admin-order-detail-head">
                <div><span>{selectedOrder.kodePesanan || `#${selectedOrder.id}`}</span><h3>{selectedOrder.pelanggan?.nama || 'Pelanggan'}</h3><small>{selectedOrder.pelanggan?.telepon || 'Nomor WhatsApp tidak tersedia'} • {formatTime(selectedOrder.createdAt)}</small></div>
                <strong>{rupiah(selectedOrder.total)}</strong>
              </header>
              <div className="admin-order-items">
                {(selectedOrder.items || []).map((item, index) => (
                  <div key={`${item.produkId || item.id || item.nama}-${index}`}><span><b>{item.nama}</b><small>{item.qty} × {rupiah(item.harga)}{item.satuan ? ` / ${item.satuan}` : ''}</small></span><strong>{rupiah(item.subtotal ?? Number(item.harga || 0) * Number(item.qty || 0))}</strong></div>
                ))}
              </div>
              <div className="admin-order-meta">
                <span>💳 {selectedOrder.metodePembayaran === 'transfer' ? 'Transfer' : 'COD'}</span>
                {selectedOrder.catatan && <span>📝 {selectedOrder.catatan}</span>}
                <span>💳 Pembayaran: {selectedOrder.metodePembayaran === 'transfer' ? (selectedOrder.statusPembayaran === 'lunas' || selectedOrder.pembayaran?.status === 'lunas' ? 'Lunas' : selectedOrder.statusPembayaran === 'menunggu_verifikasi' || selectedOrder.pembayaran?.status === 'menunggu_verifikasi' ? 'Menunggu verifikasi' : 'Belum dikonfirmasi') : 'Bayar saat menerima'}</span>
              </div>
              {selectedOrder.metodePembayaran === 'transfer' && (
                <div className="admin-order-payment-box">
                  <small>Konfirmasi pembayaran transfer</small>
                  <div className="admin-order-payment-actions">
                    <button type="button" disabled={paymentSaving} className={(selectedOrder.statusPembayaran === 'lunas' || selectedOrder.pembayaran?.status === 'lunas') ? 'active' : ''} onClick={() => updatePaymentStatus('lunas')}>✓ Tandai Lunas</button>
                    <button type="button" disabled={paymentSaving} className={(selectedOrder.statusPembayaran === 'ditolak' || selectedOrder.pembayaran?.status === 'ditolak') ? 'active danger' : ''} onClick={() => updatePaymentStatus('ditolak')}>✕ Tolak</button>
                    <button type="button" disabled={paymentSaving} onClick={() => updatePaymentStatus('menunggu_verifikasi')}>↻ Menunggu Verifikasi</button>
                  </div>
                </div>
              )}

              <div className="admin-order-status-box">
                <small>Ubah status pesanan</small>
                <div className="admin-order-status-actions">
                  {STATUS.map((item) => (
                    <button key={item.key} type="button" disabled={saving} className={String(selectedOrder.status || 'menunggu').toLowerCase() === item.key ? 'active' : ''} onClick={() => updateStatus(item.key)}>{item.icon} {item.label}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
