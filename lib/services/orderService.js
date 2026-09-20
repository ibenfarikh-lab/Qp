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

export async function updateOrderStatus(tokoId, orderId, nextStatus, uid) {
  const tokoRef = storeRef(tokoId);
  const orderRef = ordersRef(tokoId).doc(orderId);
  const now = firebase.firestore.FieldValue.serverTimestamp();
  await db.runTransaction(async (transaction) => {
    const freshOrderSnap = await transaction.get(orderRef);
    if (!freshOrderSnap.exists) throw new Error('ORDER_NOT_FOUND');
    const order = freshOrderSnap.data() || {};
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

export function updatePaymentStatus(tokoId, order, nextStatus, uid) {
  const now = firebase.firestore.FieldValue.serverTimestamp();
  return ordersRef(tokoId).doc(order.id).set({
    statusPembayaran: nextStatus,
    pembayaran: { ...(order.pembayaran || {}), status: nextStatus, diverifikasiOleh: uid, diverifikasiAt: now },
    updatedAt: now,
  }, { merge: true });
}
