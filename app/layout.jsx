import './globals.css';
import Header from '../components/Header';
import FloatingActions from '../components/FloatingActions';
import CartModal from '../components/CartModal';

export const metadata = {
  title: 'Toko Online',
  description: 'Aplikasi E-Commerce dibuat dengan Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col relative">
        
        {/* Header akan selalu muncul di paling atas pada semua halaman */}
        <Header />
        
        {/* Konten utama dari page.jsx akan masuk ke sini */}
        <main className="flex-grow pt-16"> 
          {/* Catatan: pt-16 (padding-top) berguna agar konten tidak tertutup Header jika Header Anda modelnya fixed/sticky */}
          {children}
        </main>

        {/* Elemen melayang (seperti tombol chat/scroll) diletakkan di sini */}
        <FloatingActions />

        {/* Modal keranjang diletakkan di root agar bisa dipanggil dari mana saja */}
        <CartModal />

      </body>
    </html>
  );
}
            </p>
          </div>
        </footer>

      </body>
    </html>
  );
}
