'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../lib/firebase';
import { getUserProfile } from '../lib/services/authService';

const CustomerSessionContext = createContext(null);

export function CustomerSessionProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [tokoId, setTokoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!active) return;

      setAuthUser(user || null);
      setTokoId(null);
      setError('');

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const penggunaSnap = await getUserProfile(user.uid);
        if (!penggunaSnap.exists) {
          throw new Error('Data pengguna belum memiliki dokumen pengguna/{uid}.');
        }

        const pengguna = penggunaSnap.data() || {};
        if (String(pengguna.role || '').toLowerCase() === 'admin') {
          window.location.replace('/admin');
          return;
        }
        if (String(pengguna.status || '').toLowerCase() !== 'aktif') {
          throw new Error('Akun pelanggan belum aktif. Silakan hubungi toko.');
        }
        if (!pengguna.tokoId) {
          throw new Error('Akun ini belum memiliki tokoId.');
        }

        if (!active) return;
        setTokoId(pengguna.tokoId);
      } catch (sessionError) {
        console.error('[QP Customer Session] Gagal membaca profil:', sessionError);
        if (!active) return;
        setError(sessionError?.message || 'Sesi akun belum siap.');
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    authUser,
    tokoId,
    loading,
    error,
  }), [authUser, tokoId, loading, error]);

  return (
    <CustomerSessionContext.Provider value={value}>
      {children}
    </CustomerSessionContext.Provider>
  );
}

export function useCustomerSession() {
  const context = useContext(CustomerSessionContext);
  if (!context) throw new Error('useCustomerSession harus digunakan di dalam CustomerSessionProvider.');
  return context;
}
