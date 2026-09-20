const crypto = require('node:crypto');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

function cleanString(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function makeOrderCode() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const random = crypto.randomInt(100, 1000);
  return `ORD-${stamp}-${random}`;
}

function makeIdempotencyDocId(uid, requestId) {
  return crypto.createHash('sha256').update(`${uid}:${requestId}`).digest('hex');
}

exports.createCustomerOrder = onCall({ region: 'us-central1', enforceAppCheck: false }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Silakan login terlebih dahulu.');
  }

  const uid = request.auth.uid;
  const data = request.data || {};
  const tokoId = cleanString(data.tokoId, 128);
  const requestId = cleanString(data.requestId, 128);
  const nama = cleanString(data.nama, 120);
  const telepon = cleanString(data.telepon, 40);
  const catatan = cleanString(data.catatan, 1000);
  const metode = cleanString(data.metodePembayaran, 30);
  const incomingItems = Array.isArray(data.items) ? data.items : [];

  if (!tokoId || !requestId || !nama || !telepon) {
    throw new HttpsError('invalid-argument', 'Data pelanggan, toko, atau request belum lengkap.');
  }
  if (!['cod', 'transfer'].includes(metode)) {
    throw new HttpsError('invalid-argument', 'Metode pembayaran tidak valid.');
  }
  if (!incomingItems.length || incomingItems.length > 50) {
    throw new HttpsError('invalid-argument', 'Isi keranjang tidak valid.');
  }

  const userSnap = await db.collection('pengguna').doc(uid).get();
  if (!userSnap.exists) {
    throw new HttpsError('permission-denied', 'Profil pengguna tidak ditemukan.');
  }
  const user = userSnap.data() || {};
  if (String(user.role || '').toLowerCase() === 'admin') {
    throw new HttpsError('permission-denied', 'Akun admin tidak dapat membuat pesanan pelanggan.');
  }
  if (String(user.status || '').toLowerCase() !== 'aktif') {
    throw new HttpsError('permission-denied', 'Akun pelanggan tidak aktif.');
  }
  if (user.tokoId !== tokoId) {
    throw new HttpsError('permission-denied', 'Toko tidak sesuai dengan akun pelanggan.');
  }

  const tokoRef = db.collection('toko').doc(tokoId);
  const tokoSnap = await tokoRef.get();
  if (!tokoSnap.exists) {
    throw new HttpsError('not-found', 'Toko tidak ditemukan.');
  }
  const identitySnap = await tokoRef.collection('identitas').doc('utama').get();

  const normalized = incomingItems.map((item) => ({
    produkId: cleanString(item?.produkId ?? item?.id, 128),
    qty: Number(item?.qty),
  }));

  if (normalized.some((item) => !item.produkId || !Number.isInteger(item.qty) || item.qty <= 0 || item.qty > 1000)) {
    throw new HttpsError('invalid-argument', 'Jumlah produk tidak valid.');
  }

  const duplicateIds = new Set();
  for (const item of normalized) {
    if (duplicateIds.has(item.produkId)) {
      throw new HttpsError('invalid-argument', 'Produk yang sama tidak boleh dikirim dua kali.');
    }
    duplicateIds.add(item.produkId);
  }

  const productRefs = normalized.map((item) => tokoRef.collection('produk').doc(item.produkId));
  const productSnaps = await db.getAll(...productRefs);
  const canonicalItems = [];

  for (let i = 0; i < normalized.length; i += 1) {
    const item = normalized[i];
    const snap = productSnaps[i];
    if (!snap.exists) {
      throw new HttpsError('failed-precondition', `Produk ${item.produkId} sudah tidak tersedia.`);
    }

    const product = snap.data() || {};
    if (product.aktif === false) {
      throw new HttpsError('failed-precondition', `Produk ${product.nama || item.produkId} sudah tidak tersedia.`);
    }

    const stok = Number(product.stok || 0);
    if (!Number.isFinite(stok) || stok < item.qty) {
      throw new HttpsError('failed-precondition', `Stok ${product.nama || item.produkId} tidak mencukupi.`);
    }

    const harga = Number(product.hargaJual ?? product.harga ?? 0);
    if (!Number.isFinite(harga) || harga < 0) {
      throw new HttpsError('failed-precondition', `Harga produk ${product.nama || item.produkId} tidak valid.`);
    }

    canonicalItems.push({
      produkId: snap.id,
      nama: cleanString(product.nama, 200),
      harga,
      qty: item.qty,
      satuan: cleanString(product.satuan, 50),
      subtotal: harga * item.qty,
    });
  }

  const canonicalTotal = canonicalItems.reduce((sum, item) => sum + item.subtotal, 0);
  const orderDocId = makeIdempotencyDocId(uid, requestId);
  const orderRef = tokoRef.collection('pesanan').doc(orderDocId);

  // Idempotency is committed atomically with order creation. This prevents a
  // double-click/retry race where two invocations use the same requestId.
  const orderCode = makeOrderCode();
  const orderData = {
    kodePesanan: orderCode,
    uidPelanggan: uid,
    pelanggan: { nama, telepon },
    tokoId,
    namaToko: cleanString(identitySnap.data()?.namaToko, 200),
    items: canonicalItems,
    total: canonicalTotal,
    jumlahItem: canonicalItems.reduce((sum, item) => sum + item.qty, 0),
    catatan,
    metodePembayaran: metode,
    statusPembayaran: metode === 'transfer' ? 'menunggu_konfirmasi' : 'bayar_saat_terima',
    pembayaran: {
      status: metode === 'transfer' ? 'menunggu_konfirmasi' : 'bayar_saat_terima',
      dikonfirmasiPelanggan: false,
    },
    status: 'menunggu',
    sumber: 'pelanggan-web',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const result = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(orderRef);
    if (existing.exists) {
      const existingData = existing.data() || {};
      return {
        orderId: existing.id,
        kodePesanan: existingData.kodePesanan || '',
        reused: true,
      };
    }

    transaction.create(orderRef, orderData);
    return { orderId: orderRef.id, kodePesanan: orderCode, reused: false };
  });

  return result;
});
