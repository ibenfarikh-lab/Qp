const crypto = require('node:crypto');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { defineSecret } = require('firebase-functions/params');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

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

  if (normalized.some((item) => {
    if (!item.produkId || !Number.isFinite(item.qty) || item.qty <= 0 || item.qty > 1000) return true;
    const decimals = String(item.qty).split('.')[1] || '';
    return decimals.length > 3;
  })) {
    throw new HttpsError('invalid-argument', 'Jumlah produk tidak valid. Maksimal 3 angka desimal.');
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


exports.customerAiAssistant = onCall({ region: 'us-central1', enforceAppCheck: false, secrets: [OPENROUTER_API_KEY] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Silakan login terlebih dahulu.');
  const uid = request.auth.uid;
  const data = request.data || {};
  const tokoId = cleanString(data.tokoId, 128);
  const message = cleanString(data.message, 1200);
  if (!tokoId || !message) throw new HttpsError('invalid-argument', 'Toko dan pertanyaan wajib diisi.');

  const userSnap = await db.collection('pengguna').doc(uid).get();
  const user = userSnap.data() || {};
  if (!userSnap.exists || String(user.role || '').toLowerCase() === 'admin' || String(user.status || '').toLowerCase() !== 'aktif') {
    throw new HttpsError('permission-denied', 'Akun Customer tidak aktif atau tidak valid.');
  }
  const tokoSnap = await db.collection('toko').doc(tokoId).get();
  if (!tokoSnap.exists) throw new HttpsError('not-found', 'Toko tidak ditemukan.');

  const apiKey = OPENROUTER_API_KEY.value();
  if (!apiKey) throw new HttpsError('failed-precondition', 'AI belum dikonfigurasi di server.');

  const identity = data.storeIdentity || {};
  const settings = data.storeSettings || {};
  const products = Array.isArray(data.products) ? data.products.slice(0, 60) : [];
  const cart = Array.isArray(data.cart) ? data.cart.slice(0, 30) : [];
  const history = Array.isArray(data.history) ? data.history.slice(-8) : [];

  const system = [
    'Kamu adalah Asisten Belanja untuk toko KasirQuh.',
    `Nama toko: ${cleanString(identity.namaToko, 120) || 'Toko'}.`,
    `Info toko: ${cleanString(settings.infoToko, 500)}.`,
    'Bantu Customer menemukan produk dan memahami pilihan belanja dengan bahasa Indonesia yang ramah, ringkas, dan natural.',
    'Gunakan hanya data katalog dan keranjang yang diberikan. Jangan mengarang harga, stok, produk, promo, jam buka, atau kebijakan toko.',
    'Jika data tidak tersedia, katakan bahwa data tersebut belum tersedia dan sarankan Customer bertanya kepada Admin Toko.',
    'Kamu boleh merekomendasikan produk, tetapi TIDAK boleh mengubah keranjang, membuat pesanan, membatalkan pesanan, atau mengubah data akun.',
    'Untuk tindakan transaksi, arahkan Customer memakai UI keranjang/checkout. Untuk pertanyaan khusus toko, tawarkan Tanya Admin.',
    `KATALOG AKTIF: ${JSON.stringify(products)}`,
    `KERANJANG SAAT INI: ${JSON.stringify(cart)}`
  ].join('\n');

  const messages = [{ role: 'system', content: system }, ...history.filter((m) => ['user','assistant'].includes(m?.role)).map((m) => ({ role: m.role, content: cleanString(m.content, 1200) }))];
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Title': 'KasirQuh V4 Customer AI' },
    body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages, temperature: 0.4, max_tokens: 500 })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[Customer AI] provider error', response.status, body?.error?.message || body);
    throw new HttpsError('unavailable', 'Asisten AI sedang tidak tersedia.');
  }
  const reply = cleanString(body?.choices?.[0]?.message?.content, 3000);
  if (!reply) throw new HttpsError('unavailable', 'Asisten AI tidak mengembalikan jawaban.');
  return { reply };
});

exports.adminAiAssistant = onCall({ region: 'us-central1', enforceAppCheck: false, secrets: [OPENROUTER_API_KEY] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Silakan login sebagai admin.');
  const uid = request.auth.uid;
  const data = request.data || {};
  const tokoId = cleanString(data.tokoId, 128);
  const message = cleanString(data.message, 1200);
  if (!tokoId || !message) throw new HttpsError('invalid-argument', 'Toko dan pertanyaan wajib diisi.');

  const userSnap = await db.collection('pengguna').doc(uid).get();
  const user = userSnap.data() || {};
  if (!userSnap.exists || String(user.role || '').toLowerCase() !== 'admin' || String(user.status || '').toLowerCase() !== 'aktif' || user.tokoId !== tokoId) {
    throw new HttpsError('permission-denied', 'Akun admin tidak memiliki akses ke toko ini.');
  }

  const tokoRef = db.collection('toko').doc(tokoId);
  const tokoSnap = await tokoRef.get();
  if (!tokoSnap.exists) throw new HttpsError('not-found', 'Toko tidak ditemukan.');
  const [identitySnap, productsSnap, ordersSnap] = await Promise.all([
    tokoRef.collection('identitas').doc('utama').get(),
    tokoRef.collection('produk').where('aktif', '==', true).limit(60).get(),
    tokoRef.collection('pesanan').orderBy('createdAt', 'desc').limit(30).get(),
  ]);

  const apiKey = OPENROUTER_API_KEY.value();
  if (!apiKey) throw new HttpsError('failed-precondition', 'AI belum dikonfigurasi di server.');

  const products = productsSnap.docs.map((doc) => {
    const p = doc.data() || {};
    return { id: doc.id, nama: cleanString(p.nama, 120), harga: Number(p.hargaJual ?? p.harga ?? 0), stok: Number(p.stok || 0), satuan: cleanString(p.satuan, 30) };
  });
  const orders = ordersSnap.docs.map((doc) => {
    const o = doc.data() || {};
    return { id: doc.id, status: cleanString(o.status, 40), total: Number(o.total || 0), createdAt: o.createdAt?.toDate ? o.createdAt.toDate().toISOString() : null };
  });

  const system = [
    'Kamu adalah Asisten Admin untuk toko KasirQuh V4.',
    `Nama toko: ${cleanString(identitySnap.data()?.namaToko, 120) || 'Toko'}.`,
    'Bantu admin membaca ringkasan operasional dari data yang diberikan.',
    'Jangan mengarang angka, produk, pesanan, stok, atau kebijakan. Jika data tidak cukup, katakan dengan jelas.',
    'Jangan mengubah produk, pesanan, pembayaran, chat, atau pengaturan. Semua perubahan harus dilakukan melalui UI Admin.',
    `PRODUK AKTIF: ${JSON.stringify(products)}`,
    `30 PESANAN TERBARU: ${JSON.stringify(orders)}`
  ].join('\n');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Title': 'KasirQuh V4 Admin AI' },
    body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages: [{ role: 'system', content: system }, { role: 'user', content: message }], temperature: 0.2, max_tokens: 500 })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[Admin AI] provider error', response.status, body?.error?.message || body);
    throw new HttpsError('unavailable', 'Asisten Admin sedang tidak tersedia.');
  }
  const reply = cleanString(body?.choices?.[0]?.message?.content, 3000);
  if (!reply) throw new HttpsError('unavailable', 'Asisten Admin tidak mengembalikan jawaban.');
  return { reply };
});
