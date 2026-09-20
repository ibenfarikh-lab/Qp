'use client';
import { useEffect, useMemo, useState } from 'react';
import { signOut } from '../lib/services/authService';
import { subscribeStoreHome } from '../lib/services/storeService';
import { CustomerSessionProvider, useCustomerSession } from '../components/CustomerSessionContext';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import CategoryList from '../components/CategoryList';
import FloatingActions from '../components/FloatingActions';
import CartModal from '../components/CartModal';
import ProductDetailModal from '../components/ProductDetailModal';
import BottomNav from '../components/BottomNav';
import SettingsPanel from '../components/SettingsPanel';
import CheckoutModal from '../components/CheckoutModal';
import OrderHistory from '../components/OrderHistory';
import ChatPanel from '../components/ChatPanel';

const DEFAULT_CATEGORY = 'Home';

function CustomerHome() {
  const { authUser, tokoId, loading: sessionLoading, error: sessionError } = useCustomerSession();
  const [storeIdentity, setStoreIdentity] = useState({});
  const [storeSettings, setStoreSettings] = useState({});
  const [produkList, setProdukList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [keranjang, setKeranjang] = useState([]);
  const [kategoriAktif, setKategoriAktif] = useState(DEFAULT_CATEGORY);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStore, setLoadingStore] = useState(true);
  const [storeError, setStoreError] = useState('');
  const [activeNav, setActiveNav] = useState('home');
  const [theme, setTheme] = useState('light');
  const [chatPrefill, setChatPrefill] = useState('');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('kasirquh-theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'modern') setTheme(savedTheme);
    } catch (error) {
      console.warn('[QP] Tema lokal tidak dapat dibaca:', error);
    }
  }, []);

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
    try { localStorage.setItem('kasirquh-theme', nextTheme); } catch (error) { console.warn('[QP] Tema lokal tidak dapat disimpan:', error); }
  };

  const openNav = (nav) => {
    setActiveNav(nav);
    if (nav === 'cart') setIsCartOpen(true);
    if (nav === 'home') { setSearchOpen(false); setSearchQuery(''); }
  };

  useEffect(() => {
    if (!tokoId) {
      setStoreIdentity({});
      setStoreSettings({});
      setProdukList([]);
      setKategoriList([]);
      setLoadingStore(false);
      if (sessionError) setStoreError(sessionError);
      return undefined;
    }

    setLoadingStore(true);
    setStoreError('');

    return subscribeStoreHome(tokoId, {
      onIdentity: setStoreIdentity,
      onSettings: setStoreSettings,
      onProducts: (rows) => {
        setProdukList(rows);
        setKeranjang((prev) => prev
          .map((item) => {
            const latest = rows.find((produk) => produk.id === item.id);
            if (!latest || latest.aktif === false || Number(latest.stok || 0) <= 0) return null;
            const latestStock = Number(latest.stok || 0);
            return { ...item, ...latest, harga: latest.hargaJual || latest.harga || item.harga || 0, qty: Math.min(item.qty, latestStock) };
          })
          .filter(Boolean)
        );
        setLoadingStore(false);
      },
      onCategories: (rows) => setKategoriList(rows.filter((item) => item.aktif !== false).sort((a, b) => Number(a.urutan || 0) - Number(b.urutan || 0))),
      onError: (error, source) => {
        console.error(`[QP] Gagal membaca ${source}:`, error);
        if (source === 'identity') {
          setStoreError('Identitas toko tidak dapat dibaca.');
          setLoadingStore(false);
        } else if (source === 'products') {
          setStoreError('Data produk toko tidak dapat dibaca.');
          setLoadingStore(false);
        }
      },
    });
  }, [tokoId, sessionError]);

  const kategoriNames = useMemo(
    () => [DEFAULT_CATEGORY, ...kategoriList.map((item) => item.nama).filter(Boolean)],
    [kategoriList]
  );

  const produkTampil = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('id-ID');
    const onlyActive = produkList.filter((produk) => produk.aktif !== false);
    const jumlahProduk = Math.max(0, Number(storeSettings.jumlahProduk || 0));
    return onlyActive.filter((produk) => {
      const kategoriNama = produk.kategori || produk.namaKategori || '';
      const kategoriId = produk.kategoriId || '';
      const cocokKategori = searchOpen
        || kategoriAktif === DEFAULT_CATEGORY
        || kategoriNama === kategoriAktif
        || kategoriId === kategoriAktif;
      const teksCari = [produk.nama, produk.deskripsi, produk.satuan, kategoriNama]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('id-ID');
      return cocokKategori && (!normalizedQuery || teksCari.includes(normalizedQuery));
    }).slice(0, searchOpen || normalizedQuery ? undefined : (jumlahProduk > 0 ? jumlahProduk : undefined));
  }, [produkList, kategoriAktif, searchQuery, searchOpen, storeSettings.jumlahProduk]);

  const handleAddToCart = (produk) => {
    const stok = Number(produk.stok || 0);
    if (stok <= 0) return;

    setKeranjang((prev) => {
      const ada = prev.find((item) => item.id === produk.id);
      if (ada) {
        if (ada.qty >= stok) return prev;
        return prev.map((item) => item.id === produk.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...produk, qty: 1, harga: produk.hargaJual || produk.harga || 0 }];
    });
  };

  const handleUpdateQty = (id, arah) => {
    setKeranjang((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const stok = Number(item.stok || 0);
      const newQty = item.qty + arah;
      if (newQty <= 0) return null;
      if (arah > 0 && stok > 0 && newQty > stok) return item;
      return { ...item, qty: newQty };
    }).filter(Boolean));
  };

  const totalBarangDiKeranjang = keranjang.reduce((sum, item) => sum + item.qty, 0);
  const totalKeranjang = keranjang.reduce((sum, item) => sum + (Number(item.harga || 0) * Number(item.qty || 0)), 0);

  const handleOpenCheckout = () => {
    if (!keranjang.length || !tokoId) return;
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderCreated = () => {
    setKeranjang([]);
    setIsCheckoutOpen(false);
    setActiveNav('home');
  };

  const handleLogout = async () => {
    try {
      setKeranjang([]);
      setChatPrefill('');
      await signOut();
      window.location.replace('/login');
    } catch (error) {
      console.error('[QP Customer] Gagal keluar:', error);
      setStoreError('Gagal keluar dari akun. Silakan coba lagi.');
    }
  };

  const handleAskAdmin = (product) => {
    const namaProduk = product?.nama || 'produk ini';
    setChatPrefill(`Halo Admin, saya mau bertanya tentang ${namaProduk}.`);
    setSelectedProduct(null);
    setActiveNav('chat');
  };

  const namaToko = storeIdentity.namaToko || 'KasirQuh';
  const infoToko = storeSettings.infoToko || storeSettings.runningText || 'Selamat datang di toko kami 👋';

  if (sessionLoading) {
    return <main className="main-content" style={{ padding: '32px 18px' }}><section className="pos-container" style={{ textAlign: 'center', padding: '28px 18px' }}>Memuat sesi...</section></main>;
  }

  if (!authUser) {
    return (
      <main className="main-content" style={{ padding: '32px 18px' }}>
        <section className="pos-container" style={{ textAlign: 'center', padding: '28px 18px' }}>
          <h2>Silakan login terlebih dahulu</h2>
          <p>Halaman pelanggan membutuhkan akun yang memiliki <strong>tokoId</strong>.</p>
          {sessionError && <p className="auth-error" role="alert">{sessionError}</p>}
          <a className="auth-inline-link" href="/login">🔐 Masuk / Daftar</a>
        </section>
      </main>
    );
  }

  if (sessionError) {
    return <main className="main-content" style={{ padding: '32px 18px' }}><section className="pos-container" style={{ textAlign: 'center', padding: '28px 18px' }}><h2>Sesi toko belum siap</h2><p>{sessionError}</p><a className="auth-inline-link" href="/login">🔐 Kembali ke Login</a></section></main>;
  }

  if (loadingStore) {
    return <main className="main-content" style={{ padding: '32px 18px' }}><section className="pos-container" style={{ textAlign: 'center', padding: '28px 18px' }}>Memuat toko...</section></main>;
  }

  if (storeError) {
    return <main className="main-content" style={{ padding: '32px 18px' }}><section className="pos-container" style={{ textAlign: 'center', padding: '28px 18px' }}><h2>Toko belum siap</h2><p>{storeError}</p></section></main>;
  }

  return (
    <div className={`qp-shell theme-${theme}`} style={{ minHeight: '100vh' }}>
      <div className="main-content" style={{ paddingBottom: '90px', paddingLeft: '8px', paddingRight: '8px' }}>
        {activeNav === 'settings' ? (
          <SettingsPanel theme={theme} setTheme={changeTheme} onLogout={handleLogout} />
        ) : activeNav === 'orders' ? (
          <OrderHistory tokoId={tokoId} uid={authUser?.uid} />
        ) : activeNav === 'chat' ? (
          <ChatPanel tokoId={tokoId} authUser={authUser} storeIdentity={storeIdentity} initialMessage={chatPrefill} onInitialMessageUsed={() => setChatPrefill('')} />
        ) : (
          <>
            <Header namaToko={namaToko} infoToko={infoToko} />
            <div className="catalog-toolbar">
              <button className="search-toggle" type="button" onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setSearchQuery(''); }}>{searchOpen ? '✕' : '🔎'}</button>
              {searchOpen && <input className="catalog-search" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari produk..." aria-label="Cari produk" />}
            </div>
            {!searchOpen && <div className="promo-banner"><h2 className="promo-title">Diskon Spesial!</h2><p className="promo-desc">Belanja kebutuhan harian lebih hemat dengan potongan harga eksklusif.</p><button className="promo-btn" onClick={() => alert('Promo berhasil diklaim!')}>Klaim Promo</button><div className="promo-bg-shape"></div></div>}
            {!searchOpen && <div style={{ marginBottom: '18px' }}><h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 10px', color: 'var(--text-color)' }}>Kategori Pilihan</h3><CategoryList categories={kategoriNames} activeCategory={kategoriAktif} onSelectCategory={setKategoriAktif} /></div>}
            <div className="pos-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 10px 14px' }}><h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-color)' }}>{searchOpen ? `Hasil pencarian${searchQuery ? `: ${searchQuery}` : ''}` : 'Rekomendasi Produk'}</h3><span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>{produkTampil.length} produk</span></div>
              <div className="product-catalog-grid">{produkTampil.map((produk) => <ProductCard key={produk.id} produk={produk} onAddToCart={handleAddToCart} onOpenDetail={setSelectedProduct} />)}</div>
            </div>
          </>
        )}

        {activeNav === 'home' && <FloatingActions totalItems={totalBarangDiKeranjang} onOpenCart={() => setIsCartOpen(true)} onOpenAi={() => alert('Fitur AI segera hadir')} />}
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={handleAddToCart} onAskAdmin={handleAskAdmin} />
        <CartModal isOpen={isCartOpen} onClose={() => { setIsCartOpen(false); setActiveNav('home'); }} cart={keranjang} updateQty={handleUpdateQty} onCheckout={handleOpenCheckout} />
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} tokoId={tokoId} authUser={authUser} storeIdentity={storeIdentity} cart={keranjang} total={totalKeranjang} onOrderCreated={handleOrderCreated} />
        <BottomNav active={activeNav} onHome={() => openNav('home')} onCart={() => openNav('cart')} onOrders={() => openNav('orders')} onChat={() => openNav('chat')} onSettings={() => openNav('settings')} totalItems={totalBarangDiKeranjang} />
      </div>
    </div>
  );
}

function Gateway() {
  const [entry, setEntry] = useState(null);

  if (entry === 'customer') {
    return (
      <CustomerSessionProvider>
        <CustomerHome />
      </CustomerSessionProvider>
    );
  }

  return (
    <main className="qp-gateway">
      <section className="qp-gateway-card" aria-labelledby="gateway-title">
        <div className="qp-gateway-brand" aria-hidden="true">🛒</div>
        <p className="qp-gateway-eyebrow">KASIRQUH V4</p>
        <h1 id="gateway-title">Selamat datang</h1>
        <p className="qp-gateway-subtitle">Pilih jalur untuk melanjutkan.</p>

        <div className="qp-gateway-actions">
          <button type="button" className="qp-gateway-primary" onClick={() => setEntry('customer')}>
            <span className="qp-gateway-icon" aria-hidden="true">🛒</span>
            <span><strong>Mulai Belanja</strong><small>Masuk sebagai pelanggan</small></span>
          </button>

          <a className="qp-gateway-admin" href="/login">
            <span className="qp-gateway-lock" aria-hidden="true">🔒</span>
            <span><strong>Panel Admin</strong><small>Masuk atau daftar toko</small></span>
          </a>
        </div>

        <p className="qp-gateway-note">Akses admin dan pelanggan tetap memakai akun serta tokoId masing-masing.</p>
      </section>
    </main>
  );
}

export default function Home() {
  return <Gateway />;
}
