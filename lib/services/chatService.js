import firebase, { db } from '../firebase';

const chatsRef = (tokoId) => db.collection('toko').doc(tokoId).collection('chatPelanggan');

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
    (snap) => onData?.(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
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
  await chatRef.collection('messages').doc().set({ text, senderId: authUser.uid, senderRole: 'pelanggan', senderName: customerName, createdAt: now, tokoId });
  await chatRef.set({ uidPelanggan: authUser.uid, namaPelanggan: customerName, emailPelanggan: authUser?.email || '', tokoId, status: 'aktif', lastMessage: text, lastSender: 'pelanggan', unreadByAdmin: firebase.firestore.FieldValue.increment(1), updatedAt: now }, { merge: true });
}

export async function sendAdminMessage(tokoId, chatId, authUser, text) {
  const chatRef = chatsRef(tokoId).doc(chatId);
  const now = firebase.firestore.FieldValue.serverTimestamp();
  await chatRef.collection('messages').add({ text, senderId: authUser.uid, senderRole: 'admin', senderName: authUser.displayName || authUser.email || 'Admin Toko', tokoId, createdAt: now });
  await chatRef.set({ status: 'aktif', lastMessage: text, lastSender: 'admin', updatedAt: now, unreadByAdmin: 0, unreadByCustomer: firebase.firestore.FieldValue.increment(1) }, { merge: true });
}
