'use client';

import { useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSessionProvider, useAdminSession } from '../../components/AdminSessionContext';

function AdminGate({ children }) {
  const session = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();
  const active = pathname === '/admin' ? 'dashboard' : pathname.startsWith('/admin/products') ? 'products' : pathname.startsWith('/admin/stock') ? 'stock' : pathname.startsWith('/admin/customers') ? 'customers' : pathname.startsWith('/admin/reports') ? 'reports' : pathname.startsWith('/admin/promo') ? 'promo' : pathname.startsWith('/admin/loyalty') ? 'loyalty' : pathname.startsWith('/admin/orders') ? 'orders' : pathname.startsWith('/admin/chat') ? 'chat' : pathname.startsWith('/admin/settings') ? 'settings' : 'dashboard';

  useEffect(() => {
    if (!session.loading && !session.allowed) {
      const reason = encodeURIComponent(session.error || 'Akses admin diperlukan.');
      router.replace(`/login?reason=${reason}`);
    }
  }, [session.loading, session.allowed, session.error, router]);

  if (session.loading) {
    return <main className="admin-dashboard-page"><AdminNav active="dashboard" /><div className="admin-dashboard-empty">Memuat akses admin...</div></main>;
  }

  if (!session.allowed) {
    return <main className="admin-dashboard-page"><div className="admin-dashboard-denied"><h2>Memeriksa akses admin...</h2><p>{session.error || 'Mengalihkan ke login.'}</p></div></main>;
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
