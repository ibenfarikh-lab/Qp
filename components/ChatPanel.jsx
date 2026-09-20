'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { db, firebase } from '../lib/firebase';

function formatChatTime(value) {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ tokoId, authUser, storeIdentity, initialMessage = '', onInitialMessageUsed }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const chatId = authUser?.uid || null;
  const chatRef = useMemo(() => {
    if (!tokoId || !chatId) return null;
    return db.collection('toko').doc(tokoId).collection('chatPelanggan').doc(chatId);
  }, [tokoId, chatId]);

  useEffect(() => {
    if (!initialMessage) return;
    setDraft((current) => current.trim() ? current : initialMessage);
    onInitialMessageUsed?.();
  }, [initialMessage, onInitialMessageUsed]);

  useEffect(() => {
    if (!chatRef) {
      setMessages([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError('');
    const unsubscribe = chatRef.collection('messages').onSnapshot(
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
            return aTime - bTime;
          });
        setMessages(data);
        setLoading(false);
      },
      (snapshotError) => {
        console.error('[QP] Gagal membaca chat pelanggan:', snapshotError);
        setError('Chat belum dapat dibuka. Periksa izin Firestore untuk chatPelanggan.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatRef]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || !chatRef || sending) return;

    setSending(true);
    setError('');
    try {
      const now = firebase.firestore.FieldValue.serverTimestamp();
      const customerName = authUser?.displayName || authUser?.email || 'Pelanggan';
      const messageRef = chatRef.collection('messages').doc();

      await messageRef.set({
        text,
        senderId: authUser.uid,
        senderRole: 'pelanggan',
        senderName: customerName,
        createdAt: now,
        tokoId,
      });

      await chatRef.set({
        uidPelanggan: authUser.uid,
        namaPelanggan: customerName,
        emailPelanggan: authUser?.email || '',
        tokoId,
        status: 'aktif',
        lastMessage: text,
        lastSender: 'pelanggan',
        unreadByAdmin: firebase.firestore.FieldValue.increment(1),
        updatedAt: now,
      }, { merge: true });

      setDraft('');
    } catch (sendError) {
      console.error('[QP] Gagal mengirim chat:', sendError);
      setError('Pesan belum terkirim. Coba lagi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="chat-panel">
      <div className="chat-header-card">
        <div className="chat-avatar">💬</div>
        <div>
          <span className="chat-eyebrow">CHAT TOKO</span>
          <h2>{storeIdentity?.namaToko || 'Admin Toko'}</h2>
          <small>Silakan tanyakan produk, pesanan, atau informasi toko.</small>
        </div>
      </div>

      <div className="chat-thread" aria-live="polite">
        {loading && <div className="chat-empty">Memuat percakapan...</div>}
        {!loading && error && <div className="chat-error">{error}</div>}
        {!loading && !error && messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">👋</div>
            <strong>Belum ada percakapan</strong>
            <p>Mulai chat untuk bertanya kepada admin toko.</p>
          </div>
        )}

        {!loading && !error && messages.map((message) => {
          const mine = message.senderRole === 'pelanggan' || message.senderId === authUser?.uid;
          return (
            <div key={message.id} className={`chat-message-row ${mine ? 'mine' : 'theirs'}`}>
              <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
                <p>{message.text}</p>
                <small>{formatChatTime(message.createdAt)}</small>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-composer" onSubmit={sendMessage}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Tulis pesan ke admin..."
          aria-label="Pesan ke admin toko"
          maxLength={1000}
          disabled={!chatRef || sending}
        />
        <button type="submit" disabled={!draft.trim() || sending || !chatRef} aria-label="Kirim pesan">
          {sending ? '…' : '➤'}
        </button>
      </form>
    </section>
  );
}
