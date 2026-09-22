"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getRegistrationHref } from "./lib/launch";
import LanguageSwitcher from "./LanguageSwitcher";
import { getHomeCopy } from "./i18n/home";
import type { Locale } from "./i18n/config";

export default function MobileMenu({ locale = "pt" }: { locale?: Locale }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const copy = getHomeCopy(locale);
  const links = [
    [copy.navigation.registration, "/inscricoes"],
    [copy.navigation.race, "/a-prova"],
    [copy.navigation.routes, "/percursos"],
    [copy.navigation.included, "#incluido"],
    [copy.navigation.faq, "/faq#perguntas"],
  ];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <>
      <button className={`mobileMenuTrigger${open ? " isOpen" : ""}`} type="button" aria-label={open ? copy.navigation.closeMenu : copy.navigation.openMenu} aria-expanded={open} aria-controls="mobile-site-menu" onClick={() => setOpen((value) => !value)}>
        <i /><i /><i />
      </button>

      {mounted && open && createPortal(
        <div className="mobileMenuOverlay" id="mobile-site-menu">
          <div className="mobileMenuTop">
            <img src="/legends-logo-official.png" alt="Legends Bike Race" />
            <button type="button" onClick={() => setOpen(false)} aria-label={copy.navigation.closeMenu}>×</button>
          </div>
          <nav className="mobileMenuLinks" aria-label={copy.navigation.mobileMenu}>
            {links.map(([label, href], index) => (
              <a href={href} key={href} onClick={() => setOpen(false)}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <span>{label}</span>
                <b>→</b>
              </a>
            ))}
          </nav>
          <div className="mobileMenuActions">
            <LanguageSwitcher locale={locale} mobile />
            <a href="/passport/acesso" onClick={() => setOpen(false)}>{copy.navigation.athleteArea} <span>→</span></a>
            <a href={getRegistrationHref()} onClick={() => setOpen(false)}>{copy.navigation.register}</a>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
