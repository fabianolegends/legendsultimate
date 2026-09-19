"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { localeFromPathname } from "./i18n/config";

export default function GlobalPageNavigation() {
  const locale = localeFromPathname(usePathname());
  const labels = {
    pt: { aria: "Voltar ao topo da página", visible: "Topo" },
    es: { aria: "Volver al inicio de la página", visible: "Inicio" },
    en: { aria: "Back to the top of the page", visible: "Top" },
  }[locale];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 260);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <a className="globalBackToTop" href="#topo" aria-label={labels.aria}>
      <span aria-hidden="true">↑</span>
      <strong>{labels.visible}</strong>
    </a>
  );
}
