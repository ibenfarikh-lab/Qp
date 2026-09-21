import firebase, { db } from '../firebase';

const chatsRef = (tokoId) => db.collection('toko').doc(tokoId).collection('chatPelanggan');
const rumpiRef = (tokoId) => db.collection('toko').doc(tokoId).collection('chatRumpi');

function sortByCreatedAt(rows) {
  return rows.sort((a, b) => {
    const at = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
    const bt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
    return at - bt;
  });
}

export function subscribeChats(tokoId, onData, onError) {
  if (!tokoId) return () => {};
  return chatsRef(tokoId).onSnapshot(
    (snap) => onData?.(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    onError
  );
}

export function subscribeChatMessages(tokoId, chatId, onData, onError) {
  if (!tokoId || !chatId) return () => {};
  return chatsRef(tokoId).doc(chatId).collection('messages').onSnapshot(
    (snap) => onData?.(sortByCreatedAt(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))),
    onError
  );
}

export function markChatRead(tokoId, chatId) {
  return chatsRef(tokoId).doc(chatId).set({ unreadByAdmin: 0 }, { merge: true });
}

export async function sendCustomerMessage(tokoId, authUser, text) {
  const chatRef = chatsRef(tokoId).doc(authUser.uid);
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const customerName = authUser?.displayName || authUser?.email || 'Pelanggan';
  const batch = db.batch();
  const messageRef = chatRef.collection('messages').doc();
  batch.set(messageRef, { text, senderId: authUser.uid, senderRole: 'pelanggan', senderName: customerName, createdAt: now, tokoId });
  batch.set(chatRef, { uidPelanggan: authUser.uid, namaPelanggan: customerName, emailPelanggan: authUser?.email || '', tokoId, status: 'aktif', lastMessage: text, lastSender: 'pelanggan', unreadByAdmin: firebase.firestore.FieldValue.increment(1), updatedAt: now }, { merge: true });
  return batch.commit();
}

export async function sendAdminMessage(tokoId, chatId, authUser, text) {
  const chatRef = chatsRef(tokoId).doc(chatId);
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();
  const messageRef = chatRef.collection('messages').doc();
  batch.set(messageRef, { text, senderId: authUser.uid, senderRole: 'admin', senderName: authUser.displayName || authUser.email || 'Admin Toko', tokoId, createdAt: now });
  batch.set(chatRef, { status: 'aktif', lastMessage: text, lastSender: 'admin', updatedAt: now, unreadByAdmin: 0, unreadByCustomer: firebase.firestore.FieldValue.increment(1) }, { merge: true });
  return batch.commit();
}

export function subscribeRumpiMessages(tokoId, onData, onError) {
  if (!tokoId) return () => {};
  return rumpiRef(tokoId).onSnapshot(
    (snap) => onData?.(sortByCreatedAt(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))),
    onError
  );
}

export async function sendRumpiMessage(tokoId, authUser, text) {
  if (!tokoId || !authUser?.uid || !text?.trim()) throw new Error('Data chat rumpi tidak lengkap.');
  return rumpiRef(tokoId).doc().set({
    text: text.trim(),
    senderId: authUser.uid,
    senderRole: 'pelanggan',
    senderName: authUser.displayName || authUser.email || 'Pelanggan',
    tokoId,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export function deleteRumpiMessage(tokoId, messageId) {
  if (!tokoId || !messageId) return Promise.reject(new Error('Pesan Chat Rumpi tidak valid.'));
  return rumpiRef(tokoId).doc(messageId).delete();
}
