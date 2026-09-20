'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import AdminNav from '../../components/AdminNav';
import AdminChatPanel from '../../components/AdminChatPanel';

export default function AdminChatPage() {
  const [state, setState] = useState({ loading: true, user: null, tokoId: null, allowed: false, error: '' });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setState({ loading: false, user: null, tokoId: null, allowed: false, error: 'Silakan login sebagai admin.' });
        return;
      }
      try {
        const snap = await db.collection('pengguna').doc(user.uid).get();
        const data = snap.data() || {};
        const role = String(data.role || '').toLowerCase();
        if (!snap.exists || role !== 'admin' || !data.tokoId) {
          setState({ loading: false, user, tokoId: null, allowed: false, error: 'Akun ini bukan admin toko atau belum memiliki tokoId.' });
          return;
        }
        setState({ loading: false, user, tokoId: data.tokoId, allowed: true, error: '' });
      } catch (error) {
        console.error('[QP Admin Chat] Gagal memuat pengguna:', error);
        setState({ loading: false, user, tokoId: null, allowed: false, error: 'Data admin tidak dapat dibaca.' });
      }
    });
    return () => unsubscribe();
  }, []);

  if (state.loading) return <main className="admin-chat-page">
      <AdminNav active="chat" /><div className="admin-chat-empty">Memuat akses admin...</div></main>;
  if (!state.allowed) return <main className="admin-chat-page"><AdminNav active="chat" /><div className="admin-chat-denied"><h2>Chat Admin</h2><p>{state.error}</p></div></main>;

  return <main className="admin-chat-page"><AdminNav active="chat" /><AdminChatPanel tokoId={state.tokoId} authUser={state.user} /></main>;
}
