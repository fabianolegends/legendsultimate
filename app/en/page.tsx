import type { Metadata } from "next";
import { HomePage } from "../page";
import { getHomeCopy } from "../i18n/home";

const copy = getHomeCopy("en");

export const metadata: Metadata = {
  title: { absolute: copy.seo.title },
  description: copy.seo.description,
  alternates: {
    canonical: "/en",
    languages: { "pt-BR": "/", es: "/es", en: "/en", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    url: "/en",
    locale: "en_US",
    title: copy.seo.title,
    description: copy.seo.description,
    images: [{
      url: "https://www.legendsbikerace.com.br/hero-rio-bike.jpg",
      width: 1920,
      height: 1080,
      alt: "Cyclist crossing a bridge over a river in Serra Gaúcha",
      type: "image/jpeg",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: copy.seo.title,
    description: copy.seo.description,
    images: ["https://www.legendsbikerace.com.br/hero-rio-bike.jpg"],
  },
};

export default function EnglishHome() {
  return <HomePage locale="en" />;
}
