import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "./overrides.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.legendsbikerace.com.br"),
  title: {
    default: "Legends Ultimate Gravel Race",
    template: "%s | Legends Bike Race",
  },
  description: "Quatro dias, 370,3 km e 6.302 m+ pelas estradas da Serra Gaúcha.",
  applicationName: "Legends Bike Race",
  keywords: [
    "Legends Bike Race",
    "Legends Ultimate Gravel Race",
    "prova de gravel",
    "stage race de gravel",
    "gravel Serra Gaúcha",
    "ciclismo Serra Gaúcha",
  ],
  authors: [{ name: "Legends Bike Race" }],
  creator: "Legends Bike Race",
  publisher: "Legends Bike Race",
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Legends Bike Race",
    title: "Legends Ultimate Gravel Race",
    description: "Quatro dias, 370,3 km e 6.302 m+ pelas estradas da Serra Gaúcha.",
    images: [{ url: "/hero-production.jpg", alt: "Ciclista da Legends Ultimate Gravel Race na Serra Gaúcha" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Legends Ultimate Gravel Race",
    description: "Quatro dias, 370,3 km e 6.302 m+ pelas estradas da Serra Gaúcha.",
    images: ["/hero-production.jpg"],
  },
  verification: { google: "k19CAmVOUMQYOrntyfphOwhL37S_pH76H-oS83Yf8FI" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.legendsbikerace.com.br/#organization",
      name: "Legends Bike Race",
      url: "https://www.legendsbikerace.com.br",
      logo: "https://www.legendsbikerace.com.br/legends-logo-official.png",
      email: "contato@legendsbikerace.com.br",
    },
    {
      "@type": "WebSite",
      "@id": "https://www.legendsbikerace.com.br/#website",
      url: "https://www.legendsbikerace.com.br",
      name: "Legends Bike Race",
      inLanguage: "pt-BR",
      publisher: { "@id": "https://www.legendsbikerace.com.br/#organization" },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HD7JY3MSNR"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', 'G-HD7JY3MSNR');
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '856173094039395');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=856173094039395&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
