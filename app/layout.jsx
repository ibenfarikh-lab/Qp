import './globals.css';
import PwaRegister from '../components/PwaRegister';
export const metadata={title:'KasirQuh',description:'KasirQuh Customer Store',manifest:'/manifest.webmanifest',themeColor:'#111827'};
export default function RootLayout({children}){return <html lang="id"><body><PwaRegister />{children}</body></html>}
