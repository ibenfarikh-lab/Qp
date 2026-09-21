'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeStoreHome } from '../lib/services/storeService';

const STORE_CONTEXT_KEY = 'qp-store-context';
const StoreContext = createContext(null);

function cleanTokoId(value) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length > 128) return null;
  return normalized;
}

function readInitialTokoId() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  let fromQuery = null;

  // URLSearchParams bersifat case-sensitive. Untuk testing/manual gateway,
  // terima variasi penulisan umum seperti tokoId, tokoid, dan store.
  for (const [key, value] of params.entries()) {
    const normalizedKey = String(key || '').trim().toLowerCase();
    if (normalizedKey === 'tokoid' || normalizedKey === 'storeid' || normalizedKey === 'store') {
      fromQuery = cleanTokoId(value);
      if (fromQuery) break;
    }
  }
  if (fromQuery) return fromQuery;
  try {
    return cleanTokoId(window.localStorage.getItem(STORE_CONTEXT_KEY));
  } catch {
    return null;
  }
}

export function StoreContextProvider({ children }) {
  const [tokoId, setTokoIdState] = useState(readInitialTokoId);
  const [storeIdentity, setStoreIdentity] = useState({});
  const [storeSettings, setStoreSettings] = useState({});
  const [produkList, setProdukList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(Boolean(tokoId));
  const [error, setError] = useState('');

  const setTokoId = (nextTokoId, { persist = true } = {}) => {
    const next = cleanTokoId(nextTokoId);
    setTokoIdState(next);
    if (persist && typeof window !== 'undefined') {
      try {
        if (next) window.localStorage.setItem(STORE_CONTEXT_KEY, next);
        else window.localStorage.removeItem(STORE_CONTEXT_KEY);
      } catch (storageError) {
        console.warn('[QP Store Context] Konteks toko tidak dapat disimpan:', storageError);
      }
    }
  };

  useEffect(() => {
    if (!tokoId) {
      setStoreIdentity({});
      setStoreSettings({});
      setProdukList([]);
      setKategoriList([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    setLoading(true);
    setError('');

    return subscribeStoreHome(tokoId, {
      onIdentity: (data) => setStoreIdentity(data || {}),
      onSettings: (data) => setStoreSettings(data || {}),
      onProducts: (rows) => {
        setProdukList(Array.isArray(rows) ? rows : []);
        setLoading(false);
      },
      onCategories: (rows) => setKategoriList(Array.isArray(rows) ? rows : []),
      onError: (snapshotError, source) => {
        console.error(`[QP Store Context] Gagal membaca ${source}:`, snapshotError);
        setError('Data toko belum dapat dimuat.');
        setLoading(false);
      },
    });
  }, [tokoId]);

  const value = useMemo(() => ({
    tokoId,
    hasStoreContext: Boolean(tokoId),
    storeIdentity,
    storeSettings,
    produkList,
    kategoriList,
    loading,
    error,
    setTokoId,
  }), [tokoId, storeIdentity, storeSettings, produkList, kategoriList, loading, error]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStoreContext() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStoreContext harus digunakan di dalam StoreContextProvider.');
  return context;
}
