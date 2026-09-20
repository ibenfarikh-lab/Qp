'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import firebase from '../../lib/firebase';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [namaToko, setNamaToko] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      try {
        const snap = await db.collection('pengguna').doc(user.uid).get();
        const data = snap.data() || {};
        window.location.replace(data.role === 'admin' ? '/admin-dashboard' : '/');
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
      if (mode === 'login') {
        const credential = await auth.signInWithEmailAndPassword(email.trim(), password);
        const profile = await db.collection('pengguna').doc(credential.user.uid).get();
        if (!profile.exists) throw new Error('Akun Firebase belum memiliki profil pengguna.');
        const data = profile.data() || {};
        window.location.replace(data.role === 'admin' ? '/admin-dashboard' : '/');
        return;
      }

      if (!nama.trim() || !namaToko.trim() || !email.trim() || password.length < 6) {
        throw new Error('Nama, nama toko, email, dan password minimal 6 karakter wajib diisi.');
      }

      const credential = await auth.createUserWithEmailAndPassword(email.trim(), password);
      const uid = credential.user.uid;
      const tokoId = uid;
      const batch = db.batch();

      batch.set(db.collection('pengguna').doc(uid), {
        nama: nama.trim(),
        email: email.trim(),
        role: 'admin',
        tokoId,
        status: 'aktif',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      batch.set(db.collection('toko').doc(tokoId), {
        tokoId,
        pemilikUid: uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      batch.set(db.collection('toko').doc(tokoId).collection('identitas').doc('utama'), {
        namaToko: namaToko.trim(),
        logo: '',
        alamat: '',
        telepon: '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      batch.set(db.collection('toko').doc(tokoId).collection('pengaturan').doc('beranda'), {
        tampilkanStok: true,
        tampilkanIdeMasak: true,
        tampilkanProdukTerlaris: true,
        jumlahProduk: 20,
        tema: 'light',
        infoToko: 'Selamat datang di toko kami 👋',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      batch.set(db.collection('toko').doc(tokoId).collection('pengaturan').doc('pembayaran'), {
        bank: '',
        nomor: '',
        atasNama: '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
      setMessage('Akun toko berhasil dibuat. Mengarahkan ke dashboard...');
      window.location.replace('/admin-dashboard');
    } catch (err) {
      console.error('[QP Auth] Gagal autentikasi:', err);
      setError(err?.message || 'Proses autentikasi gagal.');
      if (mode === 'register' && auth.currentUser) {
        // Jika bootstrap Firestore gagal setelah Auth berhasil, hapus akun Auth
        // agar pengguna dapat mencoba registrasi ulang dengan email yang sama.
        try { await auth.currentUser.delete(); } catch (cleanupError) { console.warn('[QP Auth] Cleanup akun gagal:', cleanupError); }
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
        <h1>{mode === 'login' ? 'Selamat datang kembali' : 'Buat toko baru'}</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Masuk untuk membuka panel pelanggan atau dashboard admin.' : 'Registrasi pertama membuat akun admin sekaligus struktur toko V4.'}
        </p>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <>
            <label><span>Nama admin</span><input value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="name" placeholder="Nama kamu" /></label>
            <label><span>Nama toko</span><input value={namaToko} onChange={(e) => setNamaToko(e.target.value)} placeholder="Nama toko" /></label>
          </>}
          <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nama@email.com" required /></label>
          <label><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Minimal 6 karakter" required /></label>

          {error && <div className="auth-error" role="alert">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <button className="auth-primary" disabled={loading}>{loading ? 'Memproses...' : mode === 'login' ? '🔐 Masuk' : '🏪 Buat Toko'}</button>
        </form>

        <button type="button" className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage(''); }}>
          {mode === 'login' ? 'Belum punya akun toko? Daftar sekarang' : 'Sudah punya akun? Masuk'}
        </button>

        <p className="auth-note">Registrasi publik hanya membuat akun <strong>admin toko</strong>. Akun pelanggan dapat dibuat/diatur melalui alur pelanggan yang nantinya kita kunci dengan tokoId.</p>
      </section>
    </main>
  );
}
