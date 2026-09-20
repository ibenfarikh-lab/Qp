'use client';

import { useEffect, useState } from 'react';
import { createCustomerOrder } from '../lib/services/orderService';
import { subscribePaymentSettings } from '../lib/services/storeService';

function makeOrderCode() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const random = Math.floor(100 + Math.random() * 900);
  return `ORD-${stamp}-${random}`;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  tokoId,
  authUser,
  storeIdentity,
  cart,
  total,
  onOrderCreated,
}) {
  const [nama, setNama] = useState('');
  const [telepon, setTelepon] = useState('');
  const [catatan, setCatatan] = useState('');
  const [metode, setMetode] = useState('cod');
  const [transferConfig, setTransferConfig] = useState({ bank: '', nomor: '', atasNama: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successCode, setSuccessCode] = useState('');

  useEffect(() => {
    if (!isOpen || !tokoId) return undefined;
    return subscribePaymentSettings(tokoId, (data) => {
      setTransferConfig({ bank: '', nomor: '', atasNama: '', ...data });
    }, (err) => console.error('[QP Checkout] Gagal membaca pengaturan pembayaran:', err));
  }, [isOpen, tokoId]);

  if (!isOpen) return null;

  const submitOrder = async (event) => {
    event.preventDefault();
    setError('');

    if (!tokoId) {
      setError('Toko belum teridentifikasi. Silakan muat ulang halaman.');
      return;
    }
    if (!cart.length) {
      setError('Keranjang masih kosong.');
      return;
    }
    if (!nama.trim() || !telepon.trim()) {
      setError('Nama dan nomor WhatsApp wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const requestId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const result = await createCustomerOrder({
        tokoId,
        requestId,
        nama: nama.trim(),
        telepon: telepon.trim(),
        catatan: catatan.trim(),
        metodePembayaran: metode,
        items: cart.map((item) => ({
          produkId: item.id,
          qty: Number(item.qty),
        })),
      });

      const orderCode = result?.data?.kodePesanan || '';
      if (!orderCode) throw new Error('Server tidak mengembalikan nomor pesanan.');
      setSuccessCode(orderCode);
    } catch (submitError) {
      console.error('[QP] Gagal membuat pesanan:', submitError);
      setError(submitError?.message || 'Pesanan gagal disimpan. Periksa koneksi lalu coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const finish = () => {
    setNama('');
    setTelepon('');
    setCatatan('');
    setMetode('cod');
    setError('');
    setSuccessCode('');
    onOrderCreated?.();
  };

  return (
    <div className="modal-backdrop show" onClick={onClose} style={{ display: 'flex' }}>
      <div className="checkout-modal" onClick={(event) => event.stopPropagation()}>
        {successCode ? (
          <div className="checkout-success">
            <div className="checkout-success-icon">✓</div>
            <h2>Pesanan berhasil dibuat</h2>
            <p>Nomor pesanan kamu:</p>
            <strong className="checkout-order-code">{successCode}</strong>
            <p className="checkout-muted">Simpan nomor ini untuk memudahkan pengecekan pesanan.</p>
            <button type="button" className="checkout-primary" onClick={finish}>Selesai</button>
          </div>
        ) : (
          <form onSubmit={submitOrder}>
            <div className="checkout-header">
              <div>
                <span className="checkout-eyebrow">CHECKOUT</span>
                <h2>Konfirmasi Pesanan</h2>
              </div>
              <button type="button" className="checkout-close" onClick={onClose} aria-label="Tutup">×</button>
            </div>

            <div className="checkout-summary">
              {cart.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <span>{item.nama} × {item.qty}</span>
                  <strong>Rp {(Number(item.harga || 0) * Number(item.qty || 0)).toLocaleString('id-ID')}</strong>
                </div>
              ))}
              <div className="checkout-total">
                <span>Total</span>
                <strong>Rp {Number(total || 0).toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <label className="checkout-field">
              <span>Nama pelanggan</span>
              <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama kamu" autoComplete="name" />
            </label>

            <label className="checkout-field">
              <span>Nomor WhatsApp</span>
              <input value={telepon} onChange={(e) => setTelepon(e.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel" autoComplete="tel" />
            </label>

            <label className="checkout-field">
              <span>Metode pembayaran</span>
              <select value={metode} onChange={(e) => setMetode(e.target.value)}>
                <option value="cod">Bayar saat menerima</option>
                <option value="transfer">Transfer</option>
              </select>
            </label>

            {metode === 'transfer' && (transferConfig.bank || transferConfig.nomor || transferConfig.atasNama) && (
              <div className="checkout-transfer-box">
                <strong>💳 Detail transfer</strong>
                {transferConfig.bank && <span>Bank: <b>{transferConfig.bank}</b></span>}
                {transferConfig.nomor && <span>No. rekening: <b>{transferConfig.nomor}</b></span>}
                {transferConfig.atasNama && <span>Atas nama: <b>{transferConfig.atasNama}</b></span>}
                <small>Setelah transfer, konfirmasi pembayaran dari menu Pesanan.</small>
              </div>
            )}

            <label className="checkout-field">
              <span>Catatan (opsional)</span>
              <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Contoh: jangan pedas, antar sore..." rows="3" />
            </label>

            {error && <div className="checkout-error" role="alert">{error}</div>}

            <button type="submit" className="checkout-primary" disabled={saving}>
              {saving ? 'Menyimpan pesanan...' : '✓ Kirim Pesanan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
