import firebase, { db } from '../firebase';

const promoRef = (tokoId) => db.collection('toko').doc(tokoId).collection('pengaturan').doc('beranda');

export async function savePromoSettings(tokoId, authUser, promo) {
  if (!tokoId || !authUser?.uid) throw new Error('Toko atau admin tidak tersedia.');
  return promoRef(tokoId).set({
    promoAktif: Boolean(promo.promoAktif),
    promoJudul: String(promo.promoJudul || '').trim(),
    promoDeskripsi: String(promo.promoDeskripsi || '').trim(),
    promoLabel: String(promo.promoLabel || '').trim(),
    promoUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: authUser.uid,
  }, { merge: true });
}
