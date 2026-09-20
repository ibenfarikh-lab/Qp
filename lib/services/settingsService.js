import firebase, { db } from '../firebase';

const base = (tokoId) => db.collection('toko').doc(tokoId);

export function saveStoreSettings(tokoId, authUser, { identity, payment, settings }) {
  const ref = base(tokoId);
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();
  batch.set(ref.collection('identitas').doc('utama'), { ...identity, updatedAt: now, updatedBy: authUser.uid });
  batch.set(ref.collection('pengaturan').doc('pembayaran'), { ...payment, updatedAt: now, updatedBy: authUser.uid });
  batch.set(ref.collection('pengaturan').doc('beranda'), { ...settings, tema: settings.tema || 'light', updatedAt: now, updatedBy: authUser.uid }, { merge: true });
  return batch.commit();
}

export { subscribeStoreSettings } from './storeService';
