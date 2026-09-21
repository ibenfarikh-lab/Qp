'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../lib/firebase';
import { getUserProfile } from '../lib/services/authService';

const CustomerSessionContext = createContext(null);

export function CustomerSessionProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!active) return;

      setAuthUser(user || null);
      setUserProfile(null);
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
        const role = String(pengguna.role || 'customer').toLowerCase();
        if (role === 'admin') {
          window.location.replace('/admin');
          return;
        }

        if (!active) return;
        setUserProfile(pengguna);
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
    userProfile,
    loading,
    error,
  }), [authUser, userProfile, loading, error]);

  return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>;
}

export function useCustomerSession() {
  const context = useContext(CustomerSessionContext);
  if (!context) throw new Error('useCustomerSession harus digunakan di dalam CustomerSessionProvider.');
  return context;
}
