import './globals.css';
import { Inter } from 'next/font/google';

// Mengoptimalkan font Inter menggunakan next/font (performa lebih baik & tidak ada Cumulative Layout Shift)
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Toko Online Anda - Belanja Mudah & Terpercaya',
  description: 'Temukan berbagai produk berkualitas tinggi dengan penawaran terbaik dan transaksi yang aman.',
  keywords: 'toko online, e-commerce, belanja online, produk pilihan',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={inter.className}>
      <head>
        {/* Tambahan ikon atau meta tag tambahan jika diperlukan di sini */}
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">
        
        {/* Area Utama Konten Aplikasi */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer Global yang Rapi */}
        <footer className="bg-white border-t border-gray-200 py-8 mt-auto shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
            <p className="font-medium">Toko Online Anda</p>
            <p className="mt-1 text-gray-500">
              &copy; {new Date().getFullYear()} Seluruh hak cipta dilindungi.
            </p>
          </div>
        </footer>

      </body>
    </html>
  );
}
