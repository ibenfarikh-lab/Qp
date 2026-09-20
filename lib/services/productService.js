import firebase, { db } from '../firebase';

const productsRef = (tokoId) => db.collection('toko').doc(tokoId).collection('produk');
const categoriesRef = (tokoId) => db.collection('toko').doc(tokoId).collection('kategori');

export function subscribeProducts(tokoId, onData, onError) {
  if (!tokoId) return () => {};
  return productsRef(tokoId).onSnapshot(
    (snap) => onData?.(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    onError
  );
}

export function subscribeCategories(tokoId, onData, onError) {
  if (!tokoId) return () => {};
  return categoriesRef(tokoId).onSnapshot(
    (snap) => onData?.(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    onError
  );
}

export async function saveProduct(tokoId, productId, payload, uid) {
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const ref = productsRef(tokoId);
  const data = { ...payload, updatedAt: now, updatedBy: uid };
  if (productId) return ref.doc(productId).set(data, { merge: true });
  return ref.add({ ...data, createdAt: now, createdBy: uid });
}

export function setProductActive(tokoId, productId, active, uid) {
  return productsRef(tokoId).doc(productId).set({ aktif: active, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: uid }, { merge: true });
}

export function deleteProduct(tokoId, productId) {
  return productsRef(tokoId).doc(productId).delete();
}

export function addCategory(tokoId, payload, uid) {
  const now = firebase.firestore.FieldValue.serverTimestamp();
  return categoriesRef(tokoId).add({ ...payload, createdAt: now, updatedAt: now, updatedBy: uid });
}

export function updateCategory(tokoId, categoryId, payload, uid) {
  return categoriesRef(tokoId).doc(categoryId).set({ ...payload, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: uid }, { merge: true });
}

export function deleteCategory(tokoId, categoryId) {
  return categoriesRef(tokoId).doc(categoryId).delete();
}
