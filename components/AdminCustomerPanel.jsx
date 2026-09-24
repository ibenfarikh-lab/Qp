'use client';

import { useEffect, useMemo, useState } from 'react';
import { subscribeOrders } from '../lib/services/orderService';
import { subscribeChats } from '../lib/services/chatService';

function dateValue(value) {
  if (!value) return 0;
  if (value?.toDate) return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value) {
  const time = dateValue(value);
  return time ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(time)) : 'Belum ada aktivitas';
}

function rupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function AdminCustomerPanel({ tokoId }) {
  const [orders, setOrders] = useState([]);
  const [chats, setChats] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tokoId) return undefined;
    setError('');
    const unsubscribeOrders = subscribeOrders(tokoId, setOrders, (err) => {
      console.error('[QP Admin Customers] Pesanan:', err);
      setError('Data pesanan pelanggan belum dapat dibaca.');
    });
    const unsubscribeChats = subscribeChats(tokoId, setChats, (err) => {
      console.error('[QP Admin Customers] Chat:', err);
      setError((current) => current || 'Data pelanggan dari chat belum dapat dibaca.');
    });
    return () => { unsubscribeOrders(); unsubscribeChats(); };
  }, [tokoId]);

  const customers = useMemo(() => {
    const map = new Map();
    const ensure = (uid, fallback = {}) => {
      const key = String(uid || fallback.telepon || fallback.email || fallback.nama || '').trim();
      if (!key) return null;
      if (!map.has(key)) map.set(key, { uid: uid || null, nama: fallback.nama || 'Pelanggan', telepon: fallback.telepon || '', email: fallback.email || '', pesanan: 0, totalBelanja: 0, terakhir: 0, chat: false, status: 'aktif' });
      return map.get(key);
    };

    orders.forEach((order) => {
      const info = order.pelanggan || {};
      const customer = ensure(order.uidPelanggan, { nama: info.nama, telepon: info.telepon });
      if (!customer) return;
      customer.nama = info.nama || customer.nama;
      customer.telepon = info.telepon || customer.telepon;
      customer.pesanan += 1;
      customer.totalBelanja += Number(order.total || 0);
      customer.terakhir = Math.max(customer.terakhir, dateValue(order.updatedAt || order.createdAt));
    });

    chats.forEach((chat) => {
      const customer = ensure(chat.uidPelanggan || chat.id, { nama: chat.namaPelanggan, email: chat.emailPelanggan });
      if (!customer) return;
      customer.nama = chat.namaPelanggan || customer.nama;
      customer.email = chat.emailPelanggan || customer.email;
      customer.chat = true;
      customer.status = chat.status || customer.status;
      customer.terakhir = Math.max(customer.terakhir, dateValue(chat.updatedAt));
    });

    return [...map.values()].sort((a, b) => b.terakhir - a.terakhir);
  }, [orders, chats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('id-ID');
    if (!q) return customers;
    return customers.filter((customer) => [customer.nama, customer.telepon, customer.email, customer.uid].filter(Boolean).join(' ').toLocaleLowerCase('id-ID').includes(q));
  }, [customers, query]);

  const stats = useMemo(() => ({
    total: customers.length,
    ordering: customers.filter((x) => x.pesanan > 0).length,
    chatting: customers.filter((x) => x.chat).length,
  }), [customers]);

  return (
    <main className="admin-customer-page">
      <section className="admin-customer-shell">
        <header className="admin-customer-header">
          <div><span>ADMIN • RELASI</span><h1>Pelanggan</h1><p>Daftar pelanggan yang pernah berbelanja atau menghubungi toko.</p></div>
        </header>

        <div className="admin-customer-stats" aria-label="Ringkasan pelanggan">
          <div><small>Total pelanggan</small><strong>{stats.total}</strong></div>
          <div><small>Pernah memesan</small><strong>{stats.ordering}</strong></div>
          <div><small>Terhubung via chat</small><strong>{stats.chatting}</strong></div>
        </div>

        {error && <div className="admin-customer-error" role="alert">{error}</div>}

        <div className="admin-customer-card">
          <div className="admin-customer-toolbar">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, telepon, email..." aria-label="Cari pelanggan" />
            <span>{filtered.length} pelanggan</span>
          </div>

          <div className="admin-customer-list">
            {!filtered.length && <div className="admin-customer-empty"><strong>Belum ada data pelanggan</strong><p>Pelanggan akan muncul otomatis setelah melakukan pesanan atau membuka percakapan dengan toko.</p></div>}
            {filtered.map((customer) => (
              <article className="admin-customer-row" key={customer.uid || `${customer.nama}-${customer.telepon}`}>
                <div className="admin-customer-avatar">{String(customer.nama || 'P').trim().slice(0, 1).toUpperCase()}</div>
                <div className="admin-customer-main">
                  <div className="admin-customer-title"><strong>{customer.nama}</strong><span className={customer.status === 'aktif' ? 'active' : ''}>{customer.status || 'aktif'}</span></div>
                  <small>{customer.telepon || 'Telepon belum tersedia'}{customer.email ? ` • ${customer.email}` : ''}</small>
                  <small>Aktivitas terakhir: {formatDate(customer.terakhir)}</small>
                </div>
                <div className="admin-customer-metrics">
                  <b>{customer.pesanan}</b><small>pesanan</small>
                  <b>{rupiah(customer.totalBelanja)}</b><small>total belanja</small>
                </div>
                <div className="admin-customer-badges">
                  {customer.chat && <span>💬 Chat</span>}
                  {customer.pesanan > 0 && <span>🛒 Belanja</span>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
