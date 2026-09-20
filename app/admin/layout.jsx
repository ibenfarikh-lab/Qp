'use client';

import AdminNav from '../../components/AdminNav';
import { usePathname } from 'next/navigation';
import { AdminSessionProvider, useAdminSession } from '../../components/AdminSessionContext';

function AdminGate({ children }) {
  const session = useAdminSession();
  const pathname = usePathname();
  const active = pathname === '/admin' ? 'dashboard' : pathname.startsWith('/admin/products') ? 'products' : pathname.startsWith('/admin/orders') ? 'orders' : pathname.startsWith('/admin/chat') ? 'chat' : pathname.startsWith('/admin/settings') ? 'settings' : 'dashboard';

  if (session.loading) {
    return <main className="admin-dashboard-page"><AdminNav active="dashboard" /><div className="admin-dashboard-empty">Memuat akses admin...</div></main>;
  }

  if (!session.allowed) {
    return <main className="admin-dashboard-page"><div className="admin-dashboard-denied"><h2>Panel Admin</h2><p>{session.error}</p><a className="admin-dashboard-link" href="/login">🔐 Kembali ke Login</a></div></main>;
  }

  return <>
    <AdminNav active={active} />
    {children}
  </>;
}

export default function AdminLayout({ children }) {
  return (
    <AdminSessionProvider>
      <AdminGate>{children}</AdminGate>
    </AdminSessionProvider>
  );
}
