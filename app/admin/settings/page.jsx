'use client';

import AdminStoreSettingsPanel from '../../../components/AdminStoreSettingsPanel';
import { useAdminSession } from '../../../components/AdminSessionContext';

export default function AdminSettingsPage() {
  const { tokoId, user } = useAdminSession();
  return <AdminStoreSettingsPanel tokoId={tokoId} authUser={user} />;
}
