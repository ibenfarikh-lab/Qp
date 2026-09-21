'use client';

import { useEffect, useState } from 'react';
import { subscribeCustomerOrders, confirmCustomerTransfer } from '../lib/services/orderService';

const PAYMENT_STATUS = {
  menunggu_konfirmasi: { label: 'Menunggu konfirmasi', icon: '⏳' },
  menunggu_verifikasi: { label: 'Menunggu verifikasi', icon: '🔎' },
  lunas: { label: 'Lunas', icon: '✅' },
  ditolak: { label: 'Ditolak', icon: '❌' },
};

const STATUS = {
  menunggu: { label: 'Menunggu', icon: '⏳' },
  diproses: { label: 'Diproses', icon: '👨‍🍳' },
  siap: { label: 'Siap', icon: '📦' },
  diantar: { label: 'Diantar', icon: '🛵' },
  selesai: { label: 'Selesai', icon: '✅' },
  dibatalkan: { label: 'Dibatalkan', icon: '❌' },
};

function formatDate(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrderHistory({ uid }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);

  const confirmTransfer = async (order) => {
    if (!order?.id || order.metodePembayaran !== 'transfer' || confirmingId) return;
    if (order.statusPembayaran === 'lunas' || order.pembayaran?.status === 'lunas') return;
    setConfirmingId(order.id);
    setError('');
    try {
      await confirmCustomerTransfer(order.tokoId, order, uid);
    } catch (err) {
      console.error('[QP] Konfirmasi transfer gagal:', err);
      setError('Konfirmasi transfer belum terkirim. Coba lagi.');
    } finally {
      setConfirmingId(null);
    }
  };

  useEffect(() => {
    if (!uid) {
      setOrders([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError('');
    return subscribeCustomerOrders(uid, (data) => {
      data.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setOrders(data);
      setLoading(false);
    }, (snapshotError) => {
      console.error('[QP] Gagal membaca riwayat pesanan:', snapshotError);
      setError('Riwayat pesanan belum dapat dibaca.');
      setLoading(false);
    });
  }, [uid]);

  return (
    <section className="order-history-panel">
      <div className="order-history-heading">
        <div>
          <span className="order-history-eyebrow">PESANAN SAYA</span>
          <h2>Riwayat Pesanan</h2>
        </div>
        <span className="order-history-count">{orders.length}</span>
      </div>

      {loading && <div className="order-empty">Memuat riwayat pesanan...</div>}
      {!loading && error && <div className="order-error">{error}</div>}
      {!loading && !error && orders.length === 0 && (
        <div className="order-empty">
          <div className="order-empty-icon">🛍️</div>
          <strong>Belum ada pesanan</strong>
          <p>Pesanan yang kamu buat akan muncul di sini.</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="order-history-list">
          {orders.map((order) => {
            const status = STATUS[order.status] || { label: order.status || 'Tidak diketahui', icon: '📋' };
            return (
              <article className="order-history-card" key={order.id}>
                <div className="order-card-top">
                  <div>
                    <strong>{order.kodePesanan || order.id}</strong>
                    <small>{formatDate(order.createdAt)}</small>
                  </div>
                  <span className={`order-status status-${order.status || 'unknown'}`}>
                    {status.icon} {status.label}
                  </span>
                </div>

                <div className="order-card-items">
                  {(order.items || []).slice(0, 3).map((item, index) => (
                    <div key={`${order.id}-${item.produkId || index}`}>
                      <span>{item.nama || 'Produk'} × {item.qty}</span>
                      <b>Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}</b>
                    </div>
                  ))}
                  {(order.items || []).length > 3 && (
                    <small>+ {(order.items || []).length - 3} produk lainnya</small>
                  )}
                </div>

                <div className="order-card-bottom">
                  <div>
                    <span>{order.jumlahItem || 0} item • {order.metodePembayaran === 'transfer' ? 'Transfer' : 'Bayar saat menerima'}</span>
                    {order.metodePembayaran === 'transfer' && (() => {
                      const payment = PAYMENT_STATUS[order.statusPembayaran || order.pembayaran?.status] || { label: 'Menunggu pembayaran', icon: '⏳' };
                      return <small>{payment.icon} {payment.label}</small>;
                    })()}
                  </div>
                  <strong>Rp {Number(order.total || 0).toLocaleString('id-ID')}</strong>
                </div>
                {order.metodePembayaran === 'transfer'
                  && (order.statusPembayaran || order.pembayaran?.status) === 'menunggu_konfirmasi'
                  && (
                  <button
                    type="button"
                    className="order-confirm-transfer"
                    onClick={() => confirmTransfer(order)}
                    disabled={confirmingId === order.id}
                  >
                    {confirmingId === order.id ? 'Mengirim konfirmasi...' : 'Saya sudah transfer'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
