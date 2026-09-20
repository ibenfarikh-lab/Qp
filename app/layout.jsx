import './globals.css';

export const metadata = {
  title: 'KasirQuh - Warunge Mimi',
  description: 'Panel pelanggan KasirQuh',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="app-background" aria-hidden="true">
          <div className="app-orb app-orb-one" />
          <div className="app-orb app-orb-two" />
        </div>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
