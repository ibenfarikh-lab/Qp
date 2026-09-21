'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { signIn, createAccount, deleteCurrentUser } from '../lib/services/authService';
import { getUserProfile, bootstrapStoreAccount } from '../lib/services/authService';

export default function AuthPanel({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [namaToko, setNamaToko] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const getReturnTo = () => {
    if (typeof window === 'undefined') return '/customer';
    const candidate = new URLSearchParams(window.location.search).get('returnTo') || '/customer';
    return candidate.startsWith('/customer') ? candidate : '/customer';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getUserProfile(user.uid);
        const data = snap.data() || {};
        window.location.replace(data.role === 'admin' ? '/admin' : getReturnTo());
      } catch (err) {
        console.error('[QP Auth] Gagal membaca profil:', err);
      }
    });
    return () => unsubscribe();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (!isRegister) {
        const credential = await signIn(email.trim(), password);
        const profile = await getUserProfile(credential.user.uid);
        if (!profile.exists) throw new Error('Akun Firebase belum memiliki profil pengguna.');
        const data = profile.data() || {};
        window.location.replace(data.role === 'admin' ? '/admin' : getReturnTo());
        return;
      }

      if (!nama.trim() || !namaToko.trim() || !email.trim() || password.length < 6) {
        throw new Error('Nama, nama toko, email, dan password minimal 6 karakter wajib diisi.');
      }

      const credential = await createAccount(email.trim(), password);
      const uid = credential.user.uid;
      await bootstrapStoreAccount({ uid, nama: nama.trim(), email: email.trim(), namaToko: namaToko.trim() });
      setMessage('Akun toko berhasil dibuat. Mengarahkan ke dashboard...');
      window.location.replace('/admin');
    } catch (err) {
      console.error('[QP Auth] Gagal autentikasi:', err);
      setError(err?.message || 'Proses autentikasi gagal.');
      if (isRegister && auth.currentUser) {
        try { await deleteCurrentUser(); } catch (cleanupError) { console.warn('[QP Auth] Cleanup akun gagal:', cleanupError); }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">🛒 <span>KasirQuh V4</span></div>
        <p className="auth-eyebrow">AKUN TOKO</p>
        <h1>{isRegister ? 'Buat toko baru' : 'Selamat datang kembali'}</h1>
        <p className="auth-subtitle">
          {isRegister ? 'Registrasi pertama membuat akun admin sekaligus struktur toko V4.' : 'Masuk untuk membuka panel pelanggan atau dashboard admin.'}
        </p>

        <form onSubmit={submit} className="auth-form">
          {isRegister && <>
            <label><span>Nama admin</span><input value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="name" placeholder="Nama kamu" /></label>
            <label><span>Nama toko</span><input value={namaToko} onChange={(e) => setNamaToko(e.target.value)} placeholder="Nama toko" /></label>
          </>}
          <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nama@email.com" required /></label>
          <label><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="Minimal 6 karakter" required /></label>

          {error && <div className="auth-error" role="alert">{error}</div>}
          {message && <div className="auth-success">{message}</div>}
          <button className="auth-primary" disabled={loading}>{loading ? 'Memproses...' : isRegister ? '🏪 Buat Toko' : '🔐 Masuk'}</button>
        </form>

        <Link className="auth-switch" href={isRegister ? '/login' : '/register'}>
          {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun toko? Daftar sekarang'}
        </Link>
        <p className="auth-note">Registrasi publik di halaman ini hanya membuat akun <strong>admin toko</strong>. Akun Customer menggunakan alur autentikasi Customer tersendiri.</p>
      </section>
    </main>
  );
}
