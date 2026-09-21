'use client';

import { useState } from 'react';
import { askCustomerAssistant } from '../lib/services/aiService';

const QUICK = ['Ada produk yang cocok buat makan hari ini?', 'Apa yang sedang habis atau stoknya sedikit?', 'Bantu pilihkan produk yang murah.', 'Apa isi keranjang saya sekarang?'];

export default function CustomerAiPanel({ tokoId, storeIdentity, storeSettings, products, cart, onAskAdmin, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (text = input) => {
    const message = String(text || '').trim();
    if (!message || loading) return;
    const next = [...messages, { role: 'user', content: message }];
    setMessages(next); setInput(''); setLoading(true);
    try {
      const reply = await askCustomerAssistant({ tokoId, message, storeIdentity, storeSettings, products, cart, history: next });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('[QP Customer AI]', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Maaf, asisten sedang tidak tersedia. Kamu tetap bisa cari produk langsung atau tanya Admin Toko.' }]);
    } finally { setLoading(false); }
  };

  return (
    <section className="pos-container" aria-label="Asisten AI Customer" style={{ margin: '8px 0', padding: '14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:12 }}>
        <div><strong>🤖 Asisten Toko</strong><div style={{fontSize:'.78rem', opacity:.72}}>Bantu cari dan memilih produk. Tidak mengubah keranjang secara otomatis.</div></div>
        <button type="button" onClick={onClose} aria-label="Tutup asisten">✕</button>
      </div>
      {!messages.length && <div style={{display:'grid', gap:8, marginBottom:12}}>{QUICK.map((q) => <button key={q} type="button" onClick={() => send(q)} style={{textAlign:'left', padding:'10px 12px', borderRadius:12}}>{q}</button>)}</div>}
      <div style={{display:'grid', gap:8, maxHeight:320, overflowY:'auto', marginBottom:12}}>
        {messages.map((m, i) => <div key={`${m.role}-${i}`} style={{justifySelf:m.role==='user'?'end':'start', maxWidth:'88%', padding:'9px 11px', borderRadius:14, background:m.role==='user'?'var(--accent-color, #2563eb)':'var(--card-bg, rgba(127,127,127,.12))', color:m.role==='user'?'#fff':'inherit', whiteSpace:'pre-wrap'}}>{m.content}</div>)}
        {loading && <div style={{opacity:.7}}>Asisten sedang berpikir…</div>}
      </div>
      <form onSubmit={(e)=>{e.preventDefault(); send();}} style={{display:'flex', gap:8}}>
        <input value={input} onChange={(e)=>setInput(e.target.value)} disabled={loading} placeholder="Tanya soal produk…" aria-label="Pertanyaan untuk asisten" style={{flex:1, minWidth:0}} />
        <button type="submit" disabled={loading || !input.trim()}>Kirim</button>
      </form>
      <button type="button" onClick={onAskAdmin} style={{marginTop:10, width:'100%'}}>💬 Tanya Admin Toko</button>
    </section>
  );
}
