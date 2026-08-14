import type { Metadata } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "./overrides.css";
import "./tr3-footer.css";
import "./font-aliases.css";
import "./legends-footer.css";
import BikeOfficialSection from "./BikeOfficialSection";
import LaunchHomePreview from "./LaunchHomePreview";
import CookieConsent from "./CookieConsent";
import LegendsGlobalFooter from "./LegendsGlobalFooter";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
  variable: "--font-manrope",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  preload: true,
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.legendsbikerace.com.br"),
  title: {
    default: "Legends Bike Race 2027",
    template: "%s | Legends Bike Race",
  },
  description: "29 de abril a 2 de maio de 2027. Quatro dias, 370,3 km e 6.302 m+ pela Serra Gaúcha.",
  applicationName: "Legends Bike Race",
  keywords: ["Legends Bike Race","Legends Ultimate Gravel Race","prova de gravel","stage race de gravel","gravel Serra Gaúcha","ciclismo Serra Gaúcha"],
  authors: [{ name: "Legends Bike Race" }],
  creator: "Legends Bike Race",
  publisher: "Legends Bike Race",
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Legends Bike Race",
    title: "Legends Bike Race 2027",
    description: "29 de abril a 2 de maio de 2027 · 4 dias · 370,3 km · 6.302 m+ · Serra Gaúcha.",
    images: [{ url: "/hero-production.jpg", alt: "Legends Bike Race na Serra Gaúcha" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Legends Bike Race 2027",
    description: "29 de abril a 2 de maio de 2027 · Serra Gaúcha.",
    images: ["/hero-production.jpg"],
  },
  verification: { google: "k19CAmVOUMQYOrntyfphOwhL37S_pH76H-oS83Yf8FI" },
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" },{ url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.legendsbikerace.com.br/#organization",
      name: "Legends Bike Race",
      url: "https://www.legendsbikerace.com.br",
      logo: { "@type": "ImageObject", url: "https://www.legendsbikerace.com.br/icon.png", contentUrl: "https://www.legendsbikerace.com.br/icon.png", width: 512, height: 512 },
      email: "contato@legendsbikerace.com.br",
      sameAs: ["https://www.instagram.com/legends.race/","https://www.facebook.com/1272724699251164","https://www.youtube.com/@legendsbikerace"],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.legendsbikerace.com.br/#website",
      url: "https://www.legendsbikerace.com.br",
      name: "Legends Bike Race",
      alternateName: ["Legends Ultimate Gravel Race", "Legends"],
      inLanguage: "pt-BR",
      publisher: { "@id": "https://www.legendsbikerace.com.br/#organization" },
    },
    {
      "@type": "SportsEvent",
      name: "Legends Bike Race 2027",
      startDate: "2027-04-29",
      endDate: "2027-05-02",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: "Serra Gaúcha", address: { "@type": "PostalAddress", addressRegion: "RS", addressCountry: "BR" } },
      organizer: { "@id": "https://www.legendsbikerace.com.br/#organization" },
      url: "https://www.legendsbikerace.com.br",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={barlowCondensed.variable}>
      <head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></head>
      <body id="topo" className={`${manrope.className} ${manrope.variable} antialiased`}>
        {children}
        <LaunchHomePreview />
        <BikeOfficialSection />
        <LegendsGlobalFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
