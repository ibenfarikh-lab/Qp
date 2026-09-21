'use client';

import { useEffect, useState } from 'react';
import { updateCustomerProfile } from '../lib/services/authService';

export default function ProfilePanel({ authUser, userProfile, onSaved, onBack }) {
  const [nama, setNama] = useState('');
  const [telepon, setTelepon] = useState('');
  const [alamat, setAlamat] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setNama(userProfile?.nama || '');
    setTelepon(userProfile?.telepon || userProfile?.nomorWA || '');
    setAlamat(userProfile?.alamat || '');
  }, [userProfile]);

  const save = async (event) => {
    event.preventDefault();
    if (!authUser?.uid || saving) return;
    if (!nama.trim()) {
      setError('Nama wajib diisi.');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const nextProfile = await updateCustomerProfile(authUser.uid, {
        nama: nama.trim(),
        telepon: telepon.trim(),
        alamat: alamat.trim(),
      });
      setMessage('Profil berhasil disimpan.');
      onSaved?.(nextProfile);
    } catch (saveError) {
      console.error('[QP Customer Profile] Gagal menyimpan profil:', saveError);
      setError(saveError?.message || 'Profil belum dapat disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-panel settings-panel">
      <div className="profile-panel-heading">
        <button type="button" className="profile-back-btn" onClick={onBack}>← Kembali</button>
        <div>
          <span className="profile-eyebrow">AKUN CUSTOMER</span>
          <h2>Profil Saya</h2>
          <p>Data ini digunakan saat kamu berinteraksi dan membuat pesanan.</p>
        </div>
      </div>

      <form className="setting-card profile-form" onSubmit={save}>
        {message && <div className="settings-message" role="status">{message}</div>}
        {error && <div className="settings-error" role="alert">{error}</div>}
        <label>Nama<input value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="name" /></label>
        <label>Email<input value={authUser?.email || ''} readOnly disabled /></label>
        <label>Nomor WhatsApp<input value={telepon} onChange={(e) => setTelepon(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" /></label>
        <label>Alamat<textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} rows="3" autoComplete="street-address" placeholder="Alamat pengiriman / keterangan alamat" /></label>
        <button type="submit" className="settings-save-btn" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Profil'}</button>
      </form>
    </section>
  );
}
