import { functions } from '../firebase';

export async function askCustomerAssistant({ tokoId, message, storeIdentity, storeSettings, products, cart, history = [] }) {
  const callable = functions.httpsCallable('customerAiAssistant');
  const safeProducts = (products || []).filter((p) => p?.aktif !== false).slice(0, 60).map((p) => ({
    id: p.id, nama: p.nama, harga: Number(p.hargaJual ?? p.harga ?? 0), stok: Number(p.stok ?? 0), satuan: p.satuan || '', kategori: p.kategori || p.namaKategori || ''
  }));
  const safeCart = (cart || []).slice(0, 30).map((p) => ({ id: p.id, nama: p.nama, qty: Number(p.qty || 0), harga: Number(p.harga || 0), satuan: p.satuan || '' }));
  const safeHistory = (history || []).slice(-8).map((item) => ({ role: item.role, content: String(item.content || '').slice(0, 1200) }));
  const result = await callable({ tokoId, message: String(message || '').slice(0, 1200), storeIdentity: { namaToko: storeIdentity?.namaToko || 'Toko' }, storeSettings: { infoToko: storeSettings?.infoToko || storeSettings?.runningText || '' }, products: safeProducts, cart: safeCart, history: safeHistory });
  return result?.data?.reply || 'Maaf, saya belum bisa menjawab sekarang.';
}

export async function askAdminAssistant({ tokoId, message }) {
  const callable = functions.httpsCallable('adminAiAssistant');
  const result = await callable({ tokoId, message: String(message || '').slice(0, 1200) });
  return result?.data?.reply || 'Maaf, saya belum bisa menjawab sekarang.';
}
