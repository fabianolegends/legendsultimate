"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import styles from "./experience.module.css";

export default function ExperienceHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = [["A experiência", "/a-prova"], ["Percursos", "/percursos"], ["Inscrições", "/inscricoes?formato=ultimate#jornadas"], ["Dúvidas", "/faq#perguntas"]];
  return <header className={styles.header}>
    <a className={styles.skip} href="#conteudo">Pular para o conteúdo</a>
    <div className={styles.headerInner}>
      <a href="/" aria-label="Legends Bike Race — início" className={styles.brand}><Image src="/legends-logo-official.png" alt="" width={54} height={78} /><span>LEGENDS<small>BIKE RACE · 2027</small></span></a>
      <button className={styles.menuButton} type="button" aria-expanded={open} aria-controls="experience-navigation" onClick={() => setOpen(!open)}>{open ? "Fechar" : "Menu"}</button>
      <nav id="experience-navigation" className={`${styles.navigation} ${open ? styles.navigationOpen : ""}`} aria-label="Navegação principal" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
        {links.map(([label, href]) => <a key={href} href={href} aria-current={pathname === href.split(/[?#]/)[0] ? "page" : undefined} onClick={() => setOpen(false)}>{label}</a>)}
        <span className={styles.languages} aria-label="Idiomas"><a href="/" lang="pt" aria-label="Português" aria-current={pathname === "/" ? "page" : undefined}>PT</a><a href="/es" lang="es" aria-label="Español">ES</a><a href="/en" lang="en" aria-label="English">EN</a></span>
        <a className={styles.navCta} href="/inscricoes?formato=ultimate#jornadas" aria-current={pathname === "/inscricoes" ? "page" : undefined} onClick={() => setOpen(false)}>Inscreva-se <span aria-hidden="true">↗</span></a>
      </nav>
    </div>
  </header>;
}

