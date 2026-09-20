'use client';

import { useEffect, useMemo, useState } from 'react';
import { subscribeChats, subscribeChatMessages, markChatRead, sendAdminMessage } from '../lib/services/chatService';

function formatTime(value) {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminChatPanel({ tokoId, authUser }) {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedChat = useMemo(
    () => conversations.find((item) => item.id === selectedId) || null,
    [conversations, selectedId]
  );

  useEffect(() => {
    if (!tokoId) return undefined;
    setLoading(true);
    return subscribeChats(tokoId, (rows) => {
      rows.sort((a, b) => {
        const at = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt || 0).getTime();
        const bt = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt || 0).getTime();
        return bt - at;
      });
      setConversations(rows);
      setSelectedId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id || null);
      setLoading(false);
    }, (snapshotError) => {
      console.error('[QP Admin Chat] Gagal membaca inbox:', snapshotError);
      setError('Inbox chat belum dapat dibuka. Periksa izin Firestore.');
      setLoading(false);
    });
  }, [tokoId]);

  useEffect(() => {
    if (!tokoId || !selectedId) {
      setMessages([]);
      return undefined;
    }
    const unsubscribe = subscribeChatMessages(tokoId, selectedId, (rows) => {
      rows.sort((a, b) => {
        const at = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return at - bt;
      });
      setMessages(rows);
    });

    markChatRead(tokoId, selectedId).catch(() => {});
    return () => unsubscribe();
  }, [tokoId, selectedId]);

  const sendMessage = async (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || !selectedChat || !authUser || sending) return;

    setSending(true);
    setError('');
    try {
      await sendAdminMessage(tokoId, selectedChat.id, authUser, text);
      setDraft('');
    } catch (sendError) {
      console.error('[QP Admin Chat] Gagal mengirim:', sendError);
      setError('Balasan belum terkirim. Coba lagi.');
    } finally {
      setSending(false);
    }
  };

  if (!tokoId) return <section className="admin-chat-panel"><div className="admin-chat-empty">Toko belum tersedia.</div></section>;

  return (
    <section className="admin-chat-panel">
      <header className="admin-chat-heading">
        <div>
          <span>ADMIN • CHAT TOKO</span>
          <h2>Pesan Pelanggan</h2>
        </div>
        <strong>{conversations.reduce((sum, item) => sum + Number(item.unreadByAdmin || 0), 0)}</strong>
      </header>

      {error && <div className="admin-chat-error">{error}</div>}

      <div className="admin-chat-layout">
        <aside className="admin-chat-list">
          {loading && <div className="admin-chat-empty">Memuat inbox...</div>}
          {!loading && !conversations.length && <div className="admin-chat-empty">Belum ada chat pelanggan.</div>}
          {!loading && conversations.map((chat) => (
            <button
              key={chat.id}
              type="button"
              className={`admin-chat-item ${selectedId === chat.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(chat.id)}
            >
              <span className="admin-chat-avatar">👤</span>
              <span className="admin-chat-item-body">
                <b>{chat.namaPelanggan || 'Pelanggan'}</b>
                <small>{chat.lastMessage || 'Belum ada pesan'}</small>
                <em>{formatTime(chat.updatedAt)}</em>
              </span>
              {Number(chat.unreadByAdmin || 0) > 0 && <i>{chat.unreadByAdmin > 99 ? '99+' : chat.unreadByAdmin}</i>}
            </button>
          ))}
        </aside>

        <div className="admin-chat-thread-wrap">
          {!selectedChat ? (
            <div className="admin-chat-empty">Pilih percakapan pelanggan.</div>
          ) : (
            <>
              <div className="admin-chat-selected-head">
                <div><b>{selectedChat.namaPelanggan || 'Pelanggan'}</b><small>{selectedChat.emailPelanggan || selectedChat.id}</small></div>
              </div>
              <div className="admin-chat-thread">
                {messages.map((message) => {
                  const mine = message.senderRole === 'admin' || message.senderId === authUser?.uid;
                  return (
                    <div key={message.id} className={`chat-message-row ${mine ? 'mine' : 'theirs'}`}>
                      <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
                        <p>{message.text}</p>
                        <small>{formatTime(message.createdAt)}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form className="chat-composer" onSubmit={sendMessage}>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Balas pelanggan..." maxLength={1000} disabled={sending} />
                <button type="submit" disabled={!draft.trim() || sending}>{sending ? '…' : '➤'}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
