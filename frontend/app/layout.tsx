import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { NavLinks } from "./NavLinks";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Nanonauta · Pico satélite",
  description:
    "Sitio de misión del pico satélite: objetivo, especificaciones, modelo 3D interactivo de la cápsula, telemetría con gráficas, exportación a Excel y mapa de recuperación.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230B1220'/%3E%3Ccircle cx='16' cy='16' r='7' fill='none' stroke='%23FFB020' stroke-width='2'/%3E%3Ccircle cx='16' cy='16' r='2.5' fill='%2335D07F'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          Saltar al contenido principal
        </a>

        {/* HEADER */}
        <header className="site-header">
          <div className="container site-header__inner">
            <Link className="brand" href="/">
              <BrandMark />
              <span>
                <span className="brand__id">Picosatélite-01 / CANSAT</span>
                <span className="brand__name">Nanonauta</span>
              </span>
            </Link>

            <NavLinks />

            <span className="status-pill">
              <span className="status-pill__dot" aria-hidden="true" />
              <span>Sin datos</span>
            </span>
          </div>
        </header>

        {/* MAIN */}
        <main id="main" tabIndex={-1}>
          {children}
        </main>

        {/* FOOTER */}
        <footer className="site-footer">
          <div className="container site-footer__inner">
            <p>
              Sitio de misión del pico satélite · construido con Next.js,
              Three.js, Plotly y Leaflet. Datos de demostración generados en el
              cliente hasta que la estación de tierra quede conectada.
            </p>
            <p className="mono">
              three · plotly · sheetjs · leaflet · OSM/OSRM
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

function BrandMark() {
  return (
    <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" fill="#121B2E" stroke="#2A3B57" />
      <circle cx="16" cy="16" r="8" fill="none" stroke="#FFB020" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="3" fill="#35D07F" />
      <path d="M16 2v4M16 26v4M2 16h4M26 16h4" stroke="#2A3B57" strokeWidth="1.5" />
    </svg>
  );
}
