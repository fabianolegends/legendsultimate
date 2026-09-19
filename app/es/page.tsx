import type { Metadata } from "next";
import { HomePage } from "../page";
import { getHomeCopy } from "../i18n/home";

const copy = getHomeCopy("es");

export const metadata: Metadata = {
  title: { absolute: copy.seo.title },
  description: copy.seo.description,
  alternates: {
    canonical: "/es",
    languages: { "pt-BR": "/", es: "/es", en: "/en", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    url: "/es",
    locale: "es_ES",
    title: copy.seo.title,
    description: copy.seo.description,
    images: [{
      url: "https://www.legendsbikerace.com.br/hero-bike-detail.jpg",
      width: 1920,
      height: 1080,
      alt: "Detalle de la zapatilla y la bicicleta sobre un camino de gravel",
      type: "image/jpeg",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: copy.seo.title,
    description: copy.seo.description,
    images: ["https://www.legendsbikerace.com.br/hero-bike-detail.jpg"],
  },
};

export default function SpanishHome() {
  return <HomePage locale="es" />;
}
