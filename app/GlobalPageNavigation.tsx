"use client";

import { useEffect, useState } from "react";

export default function GlobalPageNavigation() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 260);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <a className="globalBackToTop" href="#topo" aria-label="Voltar ao topo da página">
      <span aria-hidden="true">↑</span>
      <strong>Topo</strong>
    </a>
  );
}
