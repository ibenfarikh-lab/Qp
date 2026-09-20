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
        <Header />
        <main className="flex-grow pt-16">
          {children}
        </main>
        <FloatingActions />
        <CartModal />
      </body>
    </html>
  );
}
