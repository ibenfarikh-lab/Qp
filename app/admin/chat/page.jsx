'use client';

import AdminChatPanel from '../../../components/AdminChatPanel';
import { useAdminSession } from '../../../components/AdminSessionContext';

export default function AdminChatPage() {
  const { tokoId, user } = useAdminSession();
  return <AdminChatPanel tokoId={tokoId} authUser={user} />;
}
