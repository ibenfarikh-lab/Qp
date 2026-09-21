'use client';
import { useEffect, useMemo, useState } from 'react';
import { signOut } from '../../lib/services/authService';
import { subscribeStoreHome } from '../../lib/services/storeService';
import { CustomerSessionProvider, useCustomerSession } from '../../components/CustomerSessionContext';
import { StoreContextProvider, useStoreContext } from '../../components/StoreContext';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import CategoryList from '../../components/CategoryList';
import FloatingActions from '../../components/FloatingActions';
import CartModal from '../../components/CartModal';
import ProductDetailModal from '../../components/ProductDetailModal';
import BottomNav from '../../components/BottomNav';
import SettingsPanel from '../../components/SettingsPanel';
import ProfilePanel from '../../components/ProfilePanel';
import CheckoutModal from '../../components/CheckoutModal';
import OrderHistory from '../../components/OrderHistory';
import ChatPanel from '../../components/ChatPanel';
import CustomerAiPanel from '../../components/CustomerAiPanel';

const DEFAULT_CATEGORY = 'Home';

function CustomerHomeContent() {
  const { authUser, userProfile, loading: sessionLoading, error: sessionError } = useCustomerSession();
  const { tokoId, storeIdentity, storeSettings, produkList, kategoriList, loading: storeContextLoading, error: storeContextError } = useStoreContext();
  const [keranjang, setKeranjang] = useState([]);
  const [kategoriAktif, setKategoriAktif] = useState(DEFAULT_CATEGORY);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogMode, setCatalogMode] = useState('card');

  const [activeNav, setActiveNav] = useState('home');
  const [theme, setTheme] = useState('light');
  const [chatPrefill, setChatPrefill] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    try {
      const savedCatalogMode = localStorage.getItem('kasirquh-catalog-mode');
      if (['list', 'grid', 'card'].includes(savedCatalogMode)) setCatalogMode(savedCatalogMode);
      const savedTheme = localStorage.getItem('kasirquh-theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'modern') setTheme(savedTheme);
    } catch (error) {
      console.warn('[QP] Tema lokal tidak dapat dibaca:', error);
    }
  }, []);

  const changeCatalogMode = (nextMode) => {
    if (!['list', 'grid', 'card'].includes(nextMode)) return;
    setCatalogMode(nextMode);
    try { localStorage.setItem('kasirquh-catalog-mode', nextMode); } catch (error) { console.warn('[QP] Mode katalog lokal tidak dapat disimpan:', error); }
  };

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
    try { localStorage.setItem('kasirquh-theme', nextTheme); } catch (error) { console.warn('[QP] Tema lokal tidak dapat disimpan:', error); }
  };

  const openNav = (nav) => {
    setActiveNav(nav);
    if (nav === 'cart') setIsCartOpen(true);
    if (nav !== 'settings') setShowProfile(false);
    if (nav === 'home') { setSearchOpen(false); setSearchQuery(''); setShowProfile(false); setShowAi(false); }
  };


  const kategoriItems = useMemo(
    () => [{ nama: DEFAULT_CATEGORY, ikon: '⌂' }, ...kategoriList.filter((item) => item?.nama).map((item) => ({ nama: item.nama, ikon: item.ikon || '•' }))],
    [kategoriList]
  );

  const produkTampil = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('id-ID');
    const onlyActive = produkList.filter((produk) => produk.aktif !== false);
    const jumlahProduk = Math.max(0, Number(storeSettings.jumlahProduk || 0));
    return onlyActive.filter((produk) => {
      const kategoriNama = produk.kategori || produk.namaKategori || '';
      const kategoriId = produk.kategoriId || '';
      const cocokKategori = kategoriAktif === DEFAULT_CATEGORY
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
      
    }
  };

  const handleAskAdmin = (product) => {
    const namaProduk = product?.nama || 'produk ini';
    setChatPrefill(`Halo Admin, saya mau bertanya tentang ${namaProduk}.`);
    setSelectedProduct(null);
    setActiveNav('chat');
    setShowAi(false);
  };

  const namaToko = storeIdentity.namaToko || 'KasirQuh';
  const loginReturnTo = `/customer${tokoId ? `?tokoId=${encodeURIComponent(tokoId)}` : ''}`;
  const infoToko = storeSettings.infoToko || storeSettings.runningText || 'Selamat datang di toko kami 👋';

  if (sessionLoading) {
    return <main className="main-content" style={{ padding: '32px 18px' }}><section className="pos-container" style={{ textAlign: 'center', padding: '28px 18px' }}>Memuat sesi...</section></main>;
  }

  if (!authUser) {
    return (
      <main className="main-content" style={{ padding: '32px 18px' }}>
        <section className="pos-container" style={{ textAlign: 'center', padding: '28px 18px' }}>
          <h2>Silakan login terlebih dahulu</h2>
          <p>Login diperlukan untuk menjelajahi toko lebih dalam dan menggunakan fitur Customer.</p>
          {sessionError && <p className="auth-error" role="alert">{sessionError}</p>}
          <a className="auth-inline-link" href={`/login?returnTo=${encodeURIComponent(loginReturnTo)}`}>🔐 Masuk / Daftar</a>
        </section>
      </main>
    );
  }

  if (sessionError) {
    return <main className="main-content" style={{ padding: '32px 18px' }}><section className="pos-container" style={{ textAlign: 'center', padding: '28px 18px' }}><h2>Sesi toko belum siap</h2><p>{sessionError}</p><a className="auth-inline-link" href={`/login?returnTo=${encodeURIComponent(loginReturnTo)}`}>🔐 Kembali ke Login</a></section></main>;
  }

  if (storeContextLoading) {
    return <main className="main-content" style={{ padding: '32px 18px' }}><section className="pos-container" style={{ textAlign: 'center', padding: '28px 18px' }}>Memuat toko...</section></main>;
  }

  if (storeContextError) {
    return <main className="main-content" style={{ padding: '32px 18px' }}><section className="pos-container" style={{ textAlign: 'center', padding: '28px 18px' }}><h2>Toko belum siap</h2><p>{storeContextError}</p></section></main>;
  }

  return (
    <div className={`qp-shell theme-${theme}`} style={{ minHeight: '100vh' }}>
      <div className="main-content" style={{ paddingBottom: '90px', paddingLeft: '8px', paddingRight: '8px' }}>
        {activeNav === 'settings' && showProfile ? (
          <ProfilePanel authUser={authUser} userProfile={userProfile} onSaved={() => {}} onBack={() => setShowProfile(false)} />
        ) : activeNav === 'settings' ? (
          <SettingsPanel theme={theme} setTheme={changeTheme} onLogout={handleLogout} onProfile={() => setShowProfile(true)} />
        ) : activeNav === 'orders' ? (
          <OrderHistory uid={authUser?.uid} />
        ) : showAi ? (
          <CustomerAiPanel tokoId={tokoId} storeIdentity={storeIdentity} storeSettings={storeSettings} products={produkList} cart={keranjang} onAskAdmin={() => { setShowAi(false); setActiveNav('chat'); }} onClose={() => setShowAi(false)} />
        ) : activeNav === 'chat' ? (
          <ChatPanel tokoId={tokoId} authUser={authUser} storeIdentity={storeIdentity} initialMessage={chatPrefill} onInitialMessageUsed={() => setChatPrefill('')} />
        ) : (
          <>
            <Header namaToko={namaToko} infoToko={infoToko} />
            <div className="catalog-toolbar">
              <button className="search-toggle" type="button" onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setSearchQuery(''); }}>{searchOpen ? '✕' : '🔎'}</button>
              {searchOpen && <input className="catalog-search" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari produk..." aria-label="Cari produk" />}
            </div>
            {!searchOpen && <section className="home-welcome-strip" aria-label="Info toko"><div><span>🛍️</span><div><strong>{namaToko}</strong><small>{infoToko}</small></div></div><span className="home-welcome-dot" aria-hidden="true">●</span></section>}
            <div className="home-category-section"><div className="home-section-head"><h3>{searchOpen ? 'Filter kategori' : 'Kategori'}</h3><span>Geser</span></div><CategoryList categories={kategoriItems} activeCategory={kategoriAktif} onSelectCategory={setKategoriAktif} /></div>
            <div className="pos-container">
              <div className="catalog-heading-row">
                <h3>{searchOpen ? `Hasil pencarian${searchQuery ? `: ${searchQuery}` : ''}` : 'Rekomendasi Produk'}</h3>
                <span>{produkTampil.length} produk</span>
              </div>
              <div className="catalog-mode-switch" role="group" aria-label="Mode tampilan produk">
                {['list', 'grid', 'card'].map((mode) => (
                  <button key={mode} type="button" className={catalogMode === mode ? 'active' : ''} onClick={() => changeCatalogMode(mode)} aria-pressed={catalogMode === mode}>
                    {mode === 'list' ? '☷ List' : mode === 'grid' ? '▦ Grid' : '▣ Card'}
                  </button>
                ))}
              </div>
              <div className={`product-catalog product-catalog-${catalogMode}`}>
                {produkTampil.length > 0 ? produkTampil.map((produk) => <ProductCard key={produk.id} produk={produk} mode={catalogMode} showStock={storeSettings.tampilkanStok !== false} onAddToCart={handleAddToCart} onOpenDetail={setSelectedProduct} />) : (
                  <section className="catalog-empty-state" role="status" aria-live="polite">
                    <strong>{searchQuery.trim() ? 'Produk tidak ditemukan' : 'Belum ada produk di kategori ini'}</strong>
                    <p>{searchQuery.trim() ? 'Coba kata kunci lain atau pilih kategori berbeda.' : 'Pilih kategori lain untuk melihat produk yang tersedia.'}</p>
                    {(searchQuery.trim() || kategoriAktif !== DEFAULT_CATEGORY) && <button type="button" onClick={() => { setSearchQuery(''); setKategoriAktif(DEFAULT_CATEGORY); }}>Reset pencarian & kategori</button>}
                  </section>
                )}
              </div>
            </div>
          </>
        )}

        {activeNav === 'home' && <FloatingActions totalItems={totalBarangDiKeranjang} onOpenCart={() => setIsCartOpen(true)} onOpenAi={() => { setShowAi(true); setActiveNav('home'); }} />}
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={handleAddToCart} onAskAdmin={handleAskAdmin} />
        <CartModal isOpen={isCartOpen} onClose={() => { setIsCartOpen(false); setActiveNav('home'); }} cart={keranjang} updateQty={handleUpdateQty} onCheckout={handleOpenCheckout} />
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} tokoId={tokoId} authUser={authUser} storeIdentity={storeIdentity} cart={keranjang} total={totalKeranjang} onOrderCreated={handleOrderCreated} />
        <BottomNav active={activeNav} onHome={() => openNav('home')} onCart={() => openNav('cart')} onOrders={() => openNav('orders')} onChat={() => openNav('chat')} onSettings={() => openNav('settings')} totalItems={totalBarangDiKeranjang} />
      </div>
    </div>
  );
}


export default function CustomerHome() {
  return (
    <StoreContextProvider>
      <CustomerSessionProvider>
        <CustomerHomeContent />
      </CustomerSessionProvider>
    </StoreContextProvider>
  );
}
