'use client';

import { useEffect, useMemo, useState } from 'react';
import { subscribeOrders } from '../../lib/services/orderService';
import { subscribeProducts } from '../../lib/services/productService';
import { subscribeChats } from '../../lib/services/chatService';
import { useAdminSession } from '../../components/AdminSessionContext';

function money(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function dateValue(value) {
  if (!value) return 0;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export default function AdminDashboardPage() {
  const { user, tokoId } = useAdminSession();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [chats, setChats] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!tokoId) return undefined;
    setLoadingData(true);
    const unsubs = [
      subscribeOrders(tokoId, (rows) => setOrders(rows), (error) => console.error('[QP Dashboard] Pesanan:', error)),
      subscribeProducts(tokoId, (rows) => setProducts(rows), (error) => console.error('[QP Dashboard] Produk:', error)),
      subscribeChats(tokoId, (rows) => setChats(rows), (error) => console.error('[QP Dashboard] Chat:', error)),
    ];
    setLoadingData(false);
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [tokoId]);

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayOrders = orders.filter((order) => dateValue(order.createdAt) >= startToday && String(order.status || '').toLowerCase() !== 'dibatalkan');
    const omzetToday = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const pending = orders.filter((order) => ['menunggu', 'diproses', 'siap', 'diantar'].includes(String(order.status || 'menunggu').toLowerCase())).length;
    const unread = chats.reduce((sum, chat) => sum + Number(chat.unreadByAdmin || 0), 0);
    const lowStock = products.filter((product) => product.aktif !== false && Number(product.stok || 0) <= 5).length;
    return { todayOrders: todayOrders.length, omzetToday, pending, unread, lowStock };
  }, [orders, products, chats]);

  const recentOrders = useMemo(() => [...orders].sort((a, b) => dateValue(b.createdAt) - dateValue(a.createdAt)).slice(0, 5), [orders]);
  const lowStockProducts = useMemo(() => products.filter((p) => p.aktif !== false && Number(p.stok || 0) <= 5).sort((a, b) => Number(a.stok || 0) - Number(b.stok || 0)).slice(0, 5), [products]);

  return (
    <main className="admin-dashboard-page">
      
      <section className="admin-dashboard-shell">
        <header className="admin-dashboard-header">
          <div><span>ADMIN • DASHBOARD</span><h1>Ringkasan Toko</h1><p>Pantau pesanan, chat, omzet hari ini, dan stok dari satu layar.</p></div>
          <a href="/admin/orders" className="admin-dashboard-link">📋 Kelola Pesanan</a>
        </header>

        <div className="admin-dashboard-stats">
          <article><span>📦 Pesanan Hari Ini</span><strong>{stats.todayOrders}</strong><small>{stats.pending} masih berjalan</small></article>
          <article><span>💰 Omzet Hari Ini</span><strong>{money(stats.omzetToday)}</strong><small>pesanan selain dibatalkan</small></article>
          <article><span>💬 Chat Belum Dibaca</span><strong>{stats.unread}</strong><small><a href="/admin/chat">Buka inbox chat</a></small></article>
          <article><span>⚠️ Stok Menipis</span><strong>{stats.lowStock}</strong><small>stok ≤ 5</small></article>
        </div>

        <div className="admin-dashboard-grid">
          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-head"><h2>Pesanan Terbaru</h2><a href="/admin/orders">Lihat semua</a></div>
            {loadingData && <div className="admin-dashboard-empty">Memuat data...</div>}
            {!loadingData && !recentOrders.length && <div className="admin-dashboard-empty">Belum ada pesanan.</div>}
            {!loadingData && recentOrders.map((order) => (
              <div className="admin-dashboard-row" key={order.id}>
                <span><b>{order.kodePesanan || `#${order.id.slice(0, 8)}`}</b><small>{order.pelanggan?.nama || 'Pelanggan'}</small></span>
                <span><strong>{money(order.total)}</strong><em className={`dashboard-status status-${String(order.status || 'menunggu').toLowerCase()}`}>{order.status || 'menunggu'}</em></span>
              </div>
            ))}
          </section>

          <section className="admin-dashboard-card">
            <div className="admin-dashboard-card-head"><h2>Stok Menipis</h2><span>{stats.lowStock} produk</span></div>
            {!lowStockProducts.length && <div className="admin-dashboard-empty">Tidak ada stok yang menipis.</div>}
            {lowStockProducts.map((product) => (
              <div className="admin-dashboard-row" key={product.id}>
                <span><b>{product.nama || 'Produk'}</b><small>{product.satuan || 'unit'}</small></span>
                <strong className="dashboard-stock">{Number(product.stok || 0)}</strong>
              </div>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
