'use client';

import AdminOrderPanel from '../../../components/AdminOrderPanel';
import { useAdminSession } from '../../../components/AdminSessionContext';

export default function AdminOrdersPage() {
  const { tokoId, user } = useAdminSession();
  return <AdminOrderPanel tokoId={tokoId} authUser={user} />;
}
