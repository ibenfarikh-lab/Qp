'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { getUserProfile } from '../lib/services/authService';

const AdminSessionContext = createContext(null);

export function AdminSessionProvider({ children }) {
  const [session, setSession] = useState({ loading: true, user: null, tokoId: null, allowed: false, error: '' });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setSession({ loading: false, user: null, tokoId: null, allowed: false, error: 'Silakan login sebagai admin.' });
        return;
      }

      try {
        const snap = await getUserProfile(user.uid);
        const data = snap.data() || {};
        const role = String(data.role || '').toLowerCase();
        const status = String(data.status || '').toLowerCase();
        if (!snap.exists || role !== 'admin' || status !== 'aktif' || !data.tokoId) {
          const error = !snap.exists
            ? 'Profil pengguna belum tersedia.'
            : role !== 'admin'
              ? 'Akun ini bukan admin toko.'
              : status !== 'aktif'
                ? 'Akun admin belum aktif.'
                : 'Akun admin belum memiliki tokoId.';
          setSession({ loading: false, user, tokoId: null, allowed: false, error });
          return;
        }
        setSession({ loading: false, user, tokoId: data.tokoId, allowed: true, error: '' });
      } catch (error) {
        console.error('[QP Admin Session] Gagal memuat pengguna:', error);
        setSession({ loading: false, user, tokoId: null, allowed: false, error: 'Data admin tidak dapat dibaca.' });
      }
    });

    return () => unsubscribe();
  }, []);

  return <AdminSessionContext.Provider value={session}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) throw new Error('useAdminSession harus digunakan di dalam AdminSessionProvider.');
  return context;
}
