// Lokasi file: app/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import CategoryList from '../components/CategoryList';
import FloatingActions from '../components/FloatingActions';
import CartModal from '../components/CartModal';

export default function Home() {
  const [produkList, setProdukList] = useState([]);
  const [keranjang, setKeranjang] = useState([]);
  const [kategoriAktif, setKategoriAktif] = useState('Home');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 1. Ambil data dari Firebase
  useEffect(() => {
    const unsubscribe = db.collection('toko').doc('toko_v13').collection('produk')
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProdukList(data);
      });
    return () => unsubscribe();
  }, []);

  // 2. Fungsi Tambah Barang
  const handleAddToCart = (produk) => {
    setKeranjang(prev => {
      const ada = prev.find(item => item.id === produk.id);
      if (ada) {
        return prev.map(item => item.id === produk.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...produk, qty: 1, harga: produk.hargaJual || produk.harga || 0 }];
    });
  };

  // 3. Fungsi Ubah Qty di Keranjang (+ / -)
  const handleUpdateQty = (id, arah) => {
    setKeranjang(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + arah;
        return newQty > 0 ? { ...item, qty: newQty } : null; // Kalau 0, kita hapus di step berikutnya
      }
      return item;
    }).filter(Boolean)); // filter(Boolean) untuk menghapus item yang null
  };

  // Hitung total qty untuk badge di tombol keranjang
  const totalBarangDiKeranjang = keranjang.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="main-content" style={{ paddingBottom: '70px', paddingLeft: '8px', paddingRight: '8px' }}>
      
      <Header namaToko="KasirQuh Warunge Mimi" infoToko="Ada promo minyak goreng hari ini!" />

      {/* Komponen Kategori */}
      <CategoryList activeCategory={kategoriAktif} onSelectCategory={setKategoriAktif} />

      <div className="pos-container">
        <div className="product-catalog-grid">
          {produkList.map((produk) => (
            <ProductCard key={produk.id} produk={produk} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </div>

      {/* Komponen Tombol Melayang */}
      <FloatingActions 
        totalItems={totalBarangDiKeranjang} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenAi={() => alert("Buka Chat AI")} 
      />

      {/* Komponen Modal Keranjang */}
      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={keranjang} 
        updateQty={handleUpdateQty} 
      />

    </div>
  );
}
