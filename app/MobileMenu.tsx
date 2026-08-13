"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const links = [
  ["Inscrições", "/inscricoes"],
  ["A prova", "/a-prova"],
  ["Percursos", "/percursos"],
  ["O que está incluído", "/#incluido"],
  ["FAQ", "/faq#perguntas"],
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <>
      <button className={`mobileMenuTrigger${open ? " isOpen" : ""}`} type="button" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} aria-controls="mobile-site-menu" onClick={() => setOpen((value) => !value)}>
        <i /><i /><i />
      </button>

      {mounted && open && createPortal(
        <div className="mobileMenuOverlay" id="mobile-site-menu">
          <div className="mobileMenuTop">
            <img src="/legends-logo-official.png" alt="Legends Bike Race" />
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu">×</button>
          </div>
          <nav className="mobileMenuLinks" aria-label="Menu mobile">
            {links.map(([label, href], index) => (
              <a href={href} key={href} onClick={() => setOpen(false)}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <span>{label}</span>
                <b>→</b>
              </a>
            ))}
          </nav>
          <div className="mobileMenuActions">
            <a href="/inscricoes" onClick={() => setOpen(false)}>Ver inscrições <span>→</span></a>
            <a href="/acesso" onClick={() => setOpen(false)}>Área do atleta</a>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
