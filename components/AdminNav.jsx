'use client';

import { auth } from '../lib/firebase';

export default function AdminNav({ active = 'dashboard' }) {
  const items = [
    ['dashboard', '📊 Dashboard', '/admin-dashboard'],
    ['orders', '📋 Pesanan', '/admin-orders'],
    ['chat', '💬 Chat', '/admin-chat'],
    ['products', '📦 Produk', '/admin-products'],
    ['settings', '⚙️ Pengaturan', '/admin-settings'],
  ];

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.replace('/auth');
    } catch (error) {
      console.error('[QP Admin] Gagal keluar:', error);
    }
  };

  return (
    <nav className="admin-nav" aria-label="Navigasi admin">
      <div className="admin-nav-links">
        {items.map(([key, label, href]) => (
          <a key={key} href={href} className={active === key ? 'active' : ''}>
            {label}
          </a>
        ))}
      </div>
      <button type="button" className="admin-nav-logout" onClick={handleLogout}>↪ Keluar</button>
    </nav>
  );
}
