import { db } from '../firebase';

const storeRef = (tokoId) => db.collection('toko').doc(tokoId);

export function subscribeStoreHome(tokoId, { onIdentity, onSettings, onProducts, onCategories, onError } = {}) {
  if (!tokoId) return () => {};
  const ref = storeRef(tokoId);
  const unsubs = [
    ref.collection('identitas').doc('utama').onSnapshot(
      (snap) => onIdentity?.(snap.exists ? (snap.data() || {}) : {}),
      (error) => onError?.(error, 'identity')
    ),
    ref.collection('pengaturan').doc('beranda').onSnapshot(
      (snap) => onSettings?.(snap.exists ? (snap.data() || {}) : {}),
      (error) => onError?.(error, 'settings')
    ),
    ref.collection('produk').where('aktif', '==', true).onSnapshot(
      (snapshot) => onProducts?.(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
      (error) => onError?.(error, 'products')
    ),
    ref.collection('kategori').where('aktif', '==', true).onSnapshot(
      (snapshot) => onCategories?.(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
      (error) => onError?.(error, 'categories')
    ),
  ];
  return () => unsubs.forEach((unsubscribe) => unsubscribe());
}

export function subscribePaymentSettings(tokoId, onData, onError) {
  if (!tokoId) return () => {};
  return storeRef(tokoId).collection('pengaturan').doc('pembayaran').onSnapshot(
    (snap) => onData?.(snap.exists ? (snap.data() || {}) : {}),
    onError
  );
}

export function subscribeStoreSettings(tokoId, { onIdentity, onHomeSettings, onPayment, onCategories, onError } = {}) {
  if (!tokoId) return () => {};
  const ref = storeRef(tokoId);
  const unsubs = [
    ref.collection('identitas').doc('utama').onSnapshot((snap) => onIdentity?.(snap.exists ? (snap.data() || {}) : {}), (e) => onError?.(e, 'identity')),
    ref.collection('pengaturan').doc('beranda').onSnapshot((snap) => onHomeSettings?.(snap.exists ? (snap.data() || {}) : {}), (e) => onError?.(e, 'homeSettings')),
    ref.collection('pengaturan').doc('pembayaran').onSnapshot((snap) => onPayment?.(snap.exists ? (snap.data() || {}) : {}), (e) => onError?.(e, 'payment')),
    ref.collection('kategori').onSnapshot((snap) => onCategories?.(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))), (e) => onError?.(e, 'categories')),
  ];
  return () => unsubs.forEach((unsubscribe) => unsubscribe());
}
