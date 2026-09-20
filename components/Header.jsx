// Lokasi file: components/Header.jsx
'use client';
import { useState, useEffect } from 'react';

export default function Header({ namaToko = "KasirQuh", infoToko = "Selamat datang di toko kami 👋" }) {
  const [ucapan, setUcapan] = useState('Selamat pagi 👋');

  useEffect(() => {
    const jam = new Date().getHours();
    if (jam >= 5 && jam < 11) setUcapan('Selamat pagi 👋');
    else if (jam >= 11 && jam < 15) setUcapan('Selamat siang ☀️');
    else if (jam >= 15 && jam < 18) setUcapan('Selamat sore 🌤️');
    else setUcapan('Selamat malam 🌙');
  }, []);

  return (
    <div className="customer-home-header no-print" id="customer-home-header">
      <div className="customer-home-logo-wrap" aria-hidden="true">
        <svg className="customer-home-logo" viewBox="0 0 260 260">
          <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M48 78h164l-18-26H66L48 78Z"/>
            <path d="M48 78c4 27 22 35 39 13 17 22 35 22 52 0 17 22 35 22 52 0 17 22 35 14 39-13"/>
            <path d="M72 92v74M188 92v74M60 166h140"/>
            <path d="M91 166v-47h39v47M91 128h39M153 166v-31h36"/>
          </g>
          <g fill="currentColor" fontFamily="Arial,Helvetica,sans-serif" textAnchor="middle">
            <text x="130" y="203" fontSize="35" fontWeight="900" letterSpacing="-1.5">KasirQuh</text>
          </g>
        </svg>
      </div>
      
      <div className="customer-home-title-row">
        <h1 className="customer-home-title"><span>{namaToko}</span></h1>
        <p className="customer-home-greeting">{ucapan}</p>
        <div className="customer-home-info-line">
          <span className="customer-info-label">📢 Info Toko:</span>
          <span className="customer-running-window">
            <span className="customer-running-text run-once">{infoToko}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
