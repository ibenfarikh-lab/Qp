import firebase, { db, functions } from '../firebase';

const ordersRef = (tokoId) => db.collection('toko').doc(tokoId).collection('pesanan');
const storeRef = (tokoId) => db.collection('toko').doc(tokoId);

export function subscribeOrders(tokoId, onData, onError) {
  if (!tokoId) return () => {};
  return ordersRef(tokoId).onSnapshot(
    (snapshot) => onData?.(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    onError
  );
}

export function subscribeCustomerOrders(tokoId, uid, onData, onError) {
  if (!tokoId || !uid) return () => {};
  return ordersRef(tokoId).where('uidPelanggan', '==', uid).onSnapshot(
    (snapshot) => onData?.(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    onError
  );
}

export async function createCustomerOrder(payload) {
  return functions.httpsCallable('createCustomerOrder')(payload);
}

export function confirmCustomerTransfer(tokoId, order, uid) {
  if (!tokoId || !order?.id || !uid) throw new Error('INVALID_TRANSFER_CONFIRMATION');
  if (String(order.uidPelanggan || '') !== String(uid)) throw new Error('ORDER_OWNER_MISMATCH');
  if (order.metodePembayaran !== 'transfer') throw new Error('PAYMENT_NOT_TRANSFER');
  if (order.statusPembayaran === 'lunas' || order.pembayaran?.status === 'lunas') throw new Error('PAYMENT_ALREADY_PAID');
  return ordersRef(tokoId).doc(order.id).set({
    statusPembayaran: 'menunggu_verifikasi',
    pembayaran: {
      ...(order.pembayaran || {}),
      status: 'menunggu_verifikasi',
      dikonfirmasiPelanggan: true,
      dikonfirmasiPelangganAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

const ORDER_STATUS_TRANSITIONS = {
  menunggu: new Set(['diproses', 'dibatalkan']),
  diproses: new Set(['siap', 'dibatalkan']),
  siap: new Set(['diantar', 'dibatalkan']),
  diantar: new Set(['selesai', 'dibatalkan']),
  selesai: new Set(),
  dibatalkan: new Set(),
};

export async function updateOrderStatus(tokoId, orderId, nextStatus, uid) {
  const tokoRef = storeRef(tokoId);
  const orderRef = ordersRef(tokoId).doc(orderId);
  const now = firebase.firestore.FieldValue.serverTimestamp();
  await db.runTransaction(async (transaction) => {
    const freshOrderSnap = await transaction.get(orderRef);
    if (!freshOrderSnap.exists) throw new Error('ORDER_NOT_FOUND');
    const order = freshOrderSnap.data() || {};
    const currentStatus = String(order.status || 'menunggu').toLowerCase();
    const allowedNext = ORDER_STATUS_TRANSITIONS[currentStatus];
    if (!allowedNext || !allowedNext.has(nextStatus)) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }
    const items = Array.isArray(order.items) ? order.items : [];

    if (nextStatus === 'diproses' && !order.stokDikurangi) {
      const entries = items.map((item) => ({ item, ref: tokoRef.collection('produk').doc(String(item.produkId || '')) })).filter(({ item }) => item.produkId);
      const snaps = [];
      for (const entry of entries) snaps.push({ ...entry, snap: await transaction.get(entry.ref) });
      const shortages = [];
      for (const entry of snaps) {
        if (!entry.snap.exists) { shortages.push(`${entry.item.nama || entry.item.produkId}: produk tidak ditemukan`); continue; }
        const data = entry.snap.data() || {};
        const stock = Number(data.stok || 0);
        const qty = Number(entry.item.qty || 0);
        if (!Number.isFinite(qty) || qty <= 0 || stock < qty) shortages.push(`${entry.item.nama || entry.item.produkId}: stok ${stock}, butuh ${qty}`);
      }
      if (shortages.length) throw new Error(`STOCK_SHORTAGE:${shortages.join(' | ')}`);
      for (const entry of snaps) {
        const data = entry.snap.data() || {};
        const stock = Number(data.stok || 0);
        const qty = Number(entry.item.qty || 0);
        transaction.update(entry.ref, { stok: stock - qty, updatedAt: now, updatedBy: uid, stokTerakhirBerubah: now, stokSumber: 'pesanan' });
      }
    }

    if (nextStatus === 'dibatalkan' && order.stokDikurangi && !order.stokDikembalikan) {
      const entries = items.map((item) => ({ item, ref: tokoRef.collection('produk').doc(String(item.produkId || '')) })).filter(({ item }) => item.produkId);
      for (const entry of entries) {
        const snap = await transaction.get(entry.ref);
        if (!snap.exists) continue;
        const data = snap.data() || {};
        const stock = Number(data.stok || 0);
        const qty = Number(entry.item.qty || 0);
        transaction.update(entry.ref, { stok: stock + qty, updatedAt: now, updatedBy: uid, stokTerakhirBerubah: now, stokSumber: 'pembatalan-pesanan' });
      }
    }

    const update = { status: nextStatus, updatedAt: now, statusUpdatedAt: now, statusUpdatedBy: uid };
    if (nextStatus === 'diproses' && !order.stokDikurangi) Object.assign(update, { stokDikurangi: true, stokDikurangiAt: now, stokDikurangiBy: uid });
    if (nextStatus === 'dibatalkan' && order.stokDikurangi && !order.stokDikembalikan) Object.assign(update, { stokDikembalikan: true, stokDikembalikanAt: now, stokDikembalikanBy: uid });
    transaction.set(orderRef, update, { merge: true });
  });
}

const PAYMENT_STATUS_TRANSITIONS = {
  menunggu_konfirmasi: new Set(['menunggu_verifikasi']),
  menunggu_verifikasi: new Set(['menunggu_konfirmasi', 'lunas', 'ditolak']),
  ditolak: new Set(['menunggu_verifikasi']),
  lunas: new Set(),
};

export function updatePaymentStatus(tokoId, order, nextStatus, uid) {
  if (!order?.id || order.metodePembayaran !== 'transfer') throw new Error('PAYMENT_NOT_TRANSFER');
  if (!['menunggu_konfirmasi', 'menunggu_verifikasi', 'lunas', 'ditolak'].includes(nextStatus)) throw new Error('INVALID_PAYMENT_STATUS');
  const currentStatus = String(order.statusPembayaran || order.pembayaran?.status || '').toLowerCase();
  if (currentStatus !== nextStatus && !PAYMENT_STATUS_TRANSITIONS[currentStatus]?.has(nextStatus)) {
    throw new Error('INVALID_PAYMENT_TRANSITION');
  }
  const now = firebase.firestore.FieldValue.serverTimestamp();
  return ordersRef(tokoId).doc(order.id).set({
    statusPembayaran: nextStatus,
    'pembayaran.status': nextStatus,
    'pembayaran.diverifikasiOleh': uid,
    'pembayaran.diverifikasiAt': now,
    updatedAt: now,
  }, { merge: true });
}
