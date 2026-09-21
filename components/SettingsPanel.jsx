'use client';

export default function SettingsPanel({ theme, setTheme, onLogout, onProfile }) {
  return (
    <section className="settings-panel">
      <h2>⚙️ Pengaturan</h2>
      <div className="setting-card">
        <b>Tema tampilan</b>
        <div className="theme-row">
          {['light', 'dark', 'modern'].map((t) => (
            <button
              className={theme === t ? 'selected' : ''}
              key={t}
              type="button"
              onClick={() => {
                setTheme(t);
                try { localStorage.setItem('kasirquh-theme', t); } catch (error) { console.warn('[QP] Tema lokal tidak dapat disimpan:', error); }
              }}
            >
              {t === 'light' ? '☀️ Light' : t === 'dark' ? '🌙 Dark' : '✨ Modern'}
            </button>
          ))}
        </div>
      </div>
      <div className="setting-card">
        <b>Akun</b>
        <p>Kelola nama, nomor WhatsApp, dan alamat akun Customer.</p>
        <button type="button" className="settings-secondary-btn" onClick={onProfile}>👤 Buka Profil Saya</button>
      </div>
      <div className="setting-card">
        <b>Informasi</b>
        <p>Panel Customer KasirQuh. Preferensi tampilan tersimpan di perangkat ini.</p>
      </div>
      <div className="setting-card settings-session-card">
        <b>Sesi akun</b>
        <p>Keluar akan menutup sesi Firebase dan mengosongkan keranjang di perangkat ini.</p>
        <button type="button" className="settings-logout-btn" onClick={onLogout}>↪ Keluar dari akun</button>
      </div>
    </section>
  );
}
