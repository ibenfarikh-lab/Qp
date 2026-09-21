import firebase, { db } from '../firebase';

export function getUserProfile(uid) {
  if (!uid) return Promise.resolve(null);
  return db.collection('pengguna').doc(uid).get();
}

export async function bootstrapStoreAccount({ uid, nama, email, namaToko }) {
  const tokoId = uid;
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();
  batch.set(db.collection('pengguna').doc(uid), { nama, email, role: 'admin', tokoId, status: 'aktif', createdAt: now, updatedAt: now });
  batch.set(db.collection('toko').doc(tokoId), { tokoId, pemilikUid: uid, createdAt: now, updatedAt: now });
  batch.set(db.collection('toko').doc(tokoId).collection('identitas').doc('utama'), { namaToko, logo: '', alamat: '', telepon: '', updatedAt: now });
  batch.set(db.collection('toko').doc(tokoId).collection('pengaturan').doc('beranda'), { tampilkanStok: true, tampilkanIdeMasak: true, tampilkanProdukTerlaris: true, jumlahProduk: 20, tema: 'light', infoToko: 'Selamat datang di toko kami 👋', updatedAt: now });
  batch.set(db.collection('toko').doc(tokoId).collection('pengaturan').doc('pembayaran'), { bank: '', nomor: '', atasNama: '', updatedAt: now });
  await batch.commit();
  return tokoId;
}


export async function updateCustomerProfile(uid, { nama, telepon = '', alamat = '' }) {
  if (!uid) throw new Error('UID customer tidak tersedia.');
  const data = {
    nama: String(nama || '').trim(),
    telepon: String(telepon || '').trim(),
    alamat: String(alamat || '').trim(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (!data.nama) throw new Error('Nama wajib diisi.');
  await db.collection('pengguna').doc(uid).update(data);
  const snapshot = await db.collection('pengguna').doc(uid).get();
  return snapshot.data() || {};
}

export function signIn(email, password) {
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

export function createAccount(email, password) {
  return firebase.auth().createUserWithEmailAndPassword(email, password);
}

export function signOut() {
  return firebase.auth().signOut();
}

export function deleteCurrentUser() {
  return firebase.auth().currentUser?.delete();
}
