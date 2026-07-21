import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "./overrides.css";
import PortalAccess from "./PortalAccess";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Legends Ultimate Gravel Race",
  description: "Quatro dias, 370 km e 6.000 m+ pelas estradas da Serra Gaúcha.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <style>{`.global-portal-access{position:fixed;right:20px;bottom:20px;z-index:5000;background:#e86619;color:#fff;text-decoration:none;padding:13px 18px;text-transform:uppercase;font:800 12px Arial,sans-serif;letter-spacing:.08em;box-shadow:0 8px 26px rgba(0,0,0,.25)}.global-portal-access:hover{background:#ff7825}@media(min-width:641px){.global-portal-home{display:none}}@media(max-width:640px){.global-portal-access{right:12px;bottom:12px;padding:11px 14px}}`}</style>
        {children}
        <PortalAccess />
      </body>
    </html>
  );
}
