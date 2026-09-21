import { auth, db } from '../firebase'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  deleteUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  writeBatch, 
  serverTimestamp 
} from 'firebase/firestore';

export async function getUserProfile(uid) {
  if (!uid) return null;
  return await getDoc(doc(db, 'pengguna', uid));
}

export async function bootstrapStoreAccount({ uid, nama, email, namaToko }) {
  const tokoId = uid;
  const now = serverTimestamp();
  
  // Menggunakan writeBatch di v9 Modular
  const batch = writeBatch(db);
  
  batch.set(doc(db, 'pengguna', uid), { nama, email, role: 'admin', tokoId, status: 'aktif', createdAt: now, updatedAt: now });
  batch.set(doc(db, 'toko', tokoId), { tokoId, pemilikUid: uid, createdAt: now, updatedAt: now });
  
  // Format sub-collection di v9 (menggabungkan path/urutan argumen)
  batch.set(doc(db, 'toko', tokoId, 'identitas', 'utama'), { namaToko, logo: '', alamat: '', telepon: '', updatedAt: now });
  batch.set(doc(db, 'toko', tokoId, 'pengaturan', 'beranda'), { tampilkanStok: true, tampilkanIdeMasak: true, tampilkanProdukTerlaris: true, jumlahProduk: 20, tema: 'light', infoToko: 'Selamat datang di toko kami 👋', updatedAt: now });
  batch.set(doc(db, 'toko', tokoId, 'pengaturan', 'pembayaran'), { bank: '', nomor: '', atasNama: '', updatedAt: now });
  
  await batch.commit();
  return tokoId;
}

export async function updateCustomerProfile(uid, { nama, telepon = '', alamat = '' }) {
  if (!uid) throw new Error('UID customer tidak tersedia.');
  
  const data = {
    nama: String(nama || '').trim(),
    telepon: String(telepon || '').trim(),
    alamat: String(alamat || '').trim(),
    updatedAt: serverTimestamp(),
  };
  
  if (!data.nama) throw new Error('Nama wajib diisi.');
  
  const userRef = doc(db, 'pengguna', uid);
  await updateDoc(userRef, data);
  
  const snapshot = await getDoc(userRef);
  return snapshot.data() || {};
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function createAccount(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signOut() {
  return firebaseSignOut(auth);
}

export function deleteCurrentUser() {
  if (auth.currentUser) {
    return deleteUser(auth.currentUser);
  }
  return Promise.resolve();
}
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
