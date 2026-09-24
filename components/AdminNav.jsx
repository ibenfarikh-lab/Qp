'use client';

import Link from 'next/link';
import { signOut } from '../lib/services/authService';

export default function AdminNav({ active = 'dashboard' }) {
  const items = [
    ['dashboard', '📊 Dashboard', '/admin'],
    ['orders', '📋 Pesanan', '/admin/orders'],
    ['chat', '💬 Chat', '/admin/chat'],
    ['products', '📦 Produk', '/admin/products'],
    ['stock', '📊 Stok', '/admin/stock'],
    ['customers', '👥 Pelanggan', '/admin/customers'],
    ['reports', '📈 Laporan', '/admin/reports'],
    ['promo', '🏷️ Promo', '/admin/promo'],
    ['loyalty', '🪙 Koin Warga', '/admin/loyalty'],
    ['settings', '⚙️ Pengaturan', '/admin/settings'],
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.replace('/login');
    } catch (error) {
      console.error('[QP Admin] Gagal keluar:', error);
    }
  };

  return (
    <nav className="admin-nav" aria-label="Navigasi admin">
      <div className="admin-nav-links">
        {items.map(([key, label, href]) => (
          <Link key={key} href={href} className={active === key ? 'active' : ''}>{label}</Link>
        ))}
      </div>
      <button type="button" className="admin-nav-logout" onClick={handleLogout}>↪ Keluar</button>
    </nav>
  );
}
