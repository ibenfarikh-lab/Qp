'use client';

import { useEffect, useRef, useState } from 'react';
import {
  subscribeChatMessages,
  sendCustomerMessage,
  subscribeRumpiMessages,
  sendRumpiMessage,
} from '../lib/services/chatService';

function formatChatTime(value) {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ tokoId, authUser, storeIdentity, initialMessage = '', onInitialMessageUsed }) {
  const [mode, setMode] = useState('admin');
  const [messages, setMessages] = useState([]);
  const [rumpiMessages, setRumpiMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef(null);
  const chatId = authUser?.uid || null;

  useEffect(() => {
    if (!initialMessage) return;
    setMode('admin');
    setDraft((current) => current.trim() ? current : initialMessage);
    onInitialMessageUsed?.();
  }, [initialMessage, onInitialMessageUsed]);

  useEffect(() => {
    if (!tokoId || !chatId) {
      setMessages([]);
      return undefined;
    }
    setLoading(true);
    setError('');
    return subscribeChatMessages(tokoId, chatId, (data) => {
      setMessages(data);
      if (mode === 'admin') setLoading(false);
    }, (snapshotError) => {
      console.error('[QP] Gagal membaca chat admin:', snapshotError);
      if (mode === 'admin') setError('Chat Admin belum dapat dibuka. Periksa izin Firestore.');
      setLoading(false);
    });
  }, [tokoId, chatId, mode]);

  useEffect(() => {
    if (!tokoId || !authUser?.uid) {
      setRumpiMessages([]);
      return undefined;
    }
    if (mode !== 'rumpi') return undefined;
    setLoading(true);
    setError('');
    return subscribeRumpiMessages(tokoId, (data) => {
      setRumpiMessages(data);
      setLoading(false);
    }, (snapshotError) => {
      console.error('[QP] Gagal membaca Chat Rumpi:', snapshotError);
      setError('Chat Rumpi belum dapat dibuka. Periksa izin Firestore.');
      setLoading(false);
    });
  }, [tokoId, authUser?.uid, mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, rumpiMessages, mode]);

  const sendMessage = async (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || !tokoId || !authUser || sending) return;
    setSending(true);
    setSendError('');
    try {
      if (mode === 'rumpi') await sendRumpiMessage(tokoId, authUser, text);
      else await sendCustomerMessage(tokoId, authUser, text);
      setDraft('');
    } catch (sendError) {
      console.error('[QP] Gagal mengirim chat:', sendError);
      setSendError('Pesan belum terkirim. Coba lagi.');
    } finally {
      setSending(false);
    }
  };

  const visibleMessages = mode === 'rumpi' ? rumpiMessages : messages;

  return (
    <section className="chat-panel">
      <div className="chat-header-card">
        <div className="chat-avatar">{mode === 'rumpi' ? '🗣️' : '💬'}</div>
        <div>
          <span className="chat-eyebrow">{mode === 'rumpi' ? 'CHAT RUMPI' : 'CHAT TOKO'}</span>
          <h2>{mode === 'rumpi' ? 'Ruang ngobrol pelanggan' : (storeIdentity?.namaToko || 'Admin Toko')}</h2>
          <small>{mode === 'rumpi' ? 'Obrolan bersama pelanggan lain. Tetap sopan dan nyaman.' : 'Tanyakan produk, pesanan, atau informasi toko kepada admin.'}</small>
        </div>
      </div>

      <div className="chat-mode-tabs" role="tablist" aria-label="Jenis chat">
        <button type="button" className={mode === 'admin' ? 'active' : ''} onClick={() => { setMode('admin'); setDraft(''); setSendError(''); }}>💬 Admin Toko</button>
        <button type="button" className={mode === 'rumpi' ? 'active' : ''} onClick={() => { setMode('rumpi'); setDraft(''); setSendError(''); }}>🗣️ Chat Rumpi</button>
      </div>

      <div className="chat-thread" aria-live="polite">
        {loading && <div className="chat-empty">Memuat percakapan...</div>}
        {!loading && error && <div className="chat-error">{error}</div>}
        {!loading && !error && visibleMessages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">{mode === 'rumpi' ? '🗣️' : '👋'}</div>
            <strong>{mode === 'rumpi' ? 'Belum ada obrolan' : 'Belum ada percakapan'}</strong>
            <p>{mode === 'rumpi' ? 'Jadilah yang memulai obrolan.' : 'Mulai chat untuk bertanya kepada admin toko.'}</p>
          </div>
        )}
        {!loading && !error && visibleMessages.map((message) => {
          const mine = message.senderId === authUser?.uid || (mode === 'admin' && message.senderRole === 'pelanggan');
          return (
            <div key={message.id} className={`chat-message-row ${mine ? 'mine' : 'theirs'}`}>
              <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
                {mode === 'rumpi' && !mine && <small className="chat-sender-name">{message.senderName || 'Pelanggan'}</small>}
                <p>{message.text}</p>
                <small>{formatChatTime(message.createdAt)}</small>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {sendError && <div className="chat-error" role="alert">{sendError}</div>}
      <form className="chat-composer" onSubmit={sendMessage}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={mode === 'rumpi' ? 'Tulis ke Chat Rumpi...' : 'Tulis pesan ke admin...'} aria-label={mode === 'rumpi' ? 'Pesan Chat Rumpi' : 'Pesan ke admin toko'} maxLength={1000} disabled={!tokoId || sending || !!error} />
        <button type="submit" disabled={!draft.trim() || sending || !tokoId || !!error} aria-label="Kirim pesan">{sending ? '…' : '➤'}</button>
      </form>
    </section>
  );
}
