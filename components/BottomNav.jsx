'use client';

export default function BottomNav({ active, onHome, onCart, onOrders, onChat, onSettings, totalItems }) {
  const items = [
    ['home', '⌂', 'Home', onHome],
    ['orders', '📋', 'Pesanan', onOrders],
    ['cart', '🛒', 'Keranjang', onCart],
    ['chat', '💬', 'Chat', onChat],
    ['settings', '⚙️', 'Pengaturan', onSettings],
  ];

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {items.map(([key, icon, label, handler]) => (
        <button key={key} type="button" className={active === key ? 'active' : ''} onClick={handler}>
          <span aria-hidden="true">{icon}</span>
          <small>{label}</small>
          {key === 'cart' && totalItems > 0 && <b>{totalItems > 99 ? '99+' : totalItems}</b>}
        </button>
      ))}
    </nav>
  );
}
