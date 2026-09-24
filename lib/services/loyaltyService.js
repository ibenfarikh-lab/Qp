import firebase, { db } from '../firebase';

const homeRef = (tokoId) => db.collection('toko').doc(tokoId).collection('pengaturan').doc('beranda');

export const DEFAULT_LOYALTY = {
  koinAktif: false,
  koinNama: 'Koin Warga',
  koinPerRupiah: 1,
  koinMinimumRedeem: 0,
};

export function subscribeLoyaltySettings(tokoId, { onData, onError } = {}) {
  if (!tokoId) return () => {};
  return homeRef(tokoId).onSnapshot((snap) => onData?.({ ...DEFAULT_LOYALTY, ...(snap.data() || {}) }), onError);
}

export async function saveLoyaltySettings(tokoId, authUser, settings) {
  if (!tokoId || !authUser?.uid) throw new Error('Toko atau admin tidak tersedia.');
  const koinPerRupiah = Math.max(0, Number(settings.koinPerRupiah) || 0);
  const minimum = Math.max(0, Math.floor(Number(settings.koinMinimumRedeem) || 0));
  return homeRef(tokoId).set({
    koinAktif: Boolean(settings.koinAktif),
    koinNama: String(settings.koinNama || 'Koin Warga').trim().slice(0, 40) || 'Koin Warga',
    koinPerRupiah,
    koinMinimumRedeem: minimum,
    koinUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: authUser.uid,
  }, { merge: true });
}

export function calculateCustomerCoins(orders, settings = DEFAULT_LOYALTY) {
  if (!settings.koinAktif) return 0;
  const rate = Math.max(0, Number(settings.koinPerRupiah) || 0);
  return (Array.isArray(orders) ? orders : []).filter((order) => String(order.status || '').toLowerCase() === 'selesai')
    .reduce((sum, order) => sum + Math.max(0, Number(order.total) || 0) * rate, 0);
}
