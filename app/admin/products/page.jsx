'use client';

import AdminProductPanel from '../../../components/AdminProductPanel';
import { useAdminSession } from '../../../components/AdminSessionContext';

export default function AdminProductsPage() {
  const { tokoId, user } = useAdminSession();
  return <AdminProductPanel tokoId={tokoId} authUser={user} />;
}
