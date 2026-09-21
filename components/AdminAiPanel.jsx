'use client';

import { useState } from 'react';
import { askAdminAssistant } from '../lib/services/aiService';

export default function AdminAiPanel({ tokoId, user }) {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ask = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy || !tokoId || !user?.uid) return;
    setBusy(true); setError('');
    try {
      const result = await askAdminAssistant({ tokoId, message: text });
      setReply(result);
      setMessage('');
    } catch (err) {
      console.error('[QP Admin AI]', err);
      setError('Asisten Admin belum dapat digunakan. Periksa konfigurasi AI server.');
    } finally { setBusy(false); }
  };

  return (
    <section className="admin-ai-card" aria-label="Asisten Admin">
      <div className="admin-dashboard-card-head"><div><h2>🤖 Asisten Admin</h2><span>Bantuan membaca data toko tanpa mengubah data.</span></div></div>
      {reply && <div className="admin-ai-reply">{reply}</div>}
      {error && <div className="admin-ai-error">{error}</div>}
      <form className="admin-ai-form" onSubmit={ask}>
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Contoh: produk apa yang stoknya paling menipis?" maxLength={1200} aria-label="Pertanyaan untuk Asisten Admin" />
        <button type="submit" disabled={busy || !message.trim()}>{busy ? 'Memproses...' : 'Tanya'}</button>
      </form>
    </section>
  );
}
