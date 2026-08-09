"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const includedProducts = [
  ["Camiseta casual", "/images/kit/camiseta-casual.webp"],
  ["Bag oficial 50 L", "/images/kit/bag-50-litros.webp"],
  ["Cap de ciclismo", "/images/kit/cap-ciclismo.webp"],
  ["Placa oficial", "/images/kit/placa-gravel.webp"],
];

const includedServices = [
  "SPOT em todas as etapas",
  "Transporte da bag entre cidades-base",
  "Hidratação nos checkpoints",
  "GPX oficial e checkpoints",
  "Race Engine e apuração",
  "Seguro básico conforme apólice",
  "Equipe de apoio, segurança e resgate",
  "Bike Wash",
  "Mecânica básica Danda Bike",
  "Briefings, largadas e chegadas",
];

export default function LaunchHomePreview() {
  const [kitTarget, setKitTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const home = document.querySelector<HTMLElement>(".redesign");
    if (!home) return;

    const kicker = home.querySelector<HTMLElement>(".heroCopy .kicker");
    if (kicker) kicker.textContent = "29 ABR — 02 MAI 2027 · SERRA GAÚCHA";

    const ctas = home.querySelector<HTMLElement>(".heroCtas");
    if (ctas) {
      const links = Array.from(ctas.querySelectorAll<HTMLAnchorElement>("a"));
      if (links[0]) { links[0].href = "/inscricoes"; links[0].innerHTML = "Ver inscrições <span>→</span>"; }
      if (links[1]) { links[1].href = "/regulamento"; links[1].textContent = "Consultar regulamento"; }
      if (!ctas.querySelector(".launchPrice")) {
        const price = document.createElement("div");
        price.className = "launchPrice";
        price.innerHTML = '<span>LOTE 01</span><strong>R$ 1.199</strong><small>100 vagas</small>';
        ctas.appendChild(price);
      }
    }

    const faqCopy = home.querySelector<HTMLElement>(".faqSection .sectionHead > p:last-child");
    if (faqCopy) faqCopy.textContent = "Data, modalidades, documentação, logística e regras já estão consolidadas para a edição 2027. Consulte o FAQ completo para as condições de inscrição.";
    const faqList = home.querySelector<HTMLElement>(".faqSection .faqList");
    if (faqList) faqList.classList.add("launchFaqHidden");
    const faqSection = home.querySelector<HTMLElement>(".faqSection .wide");
    if (faqSection && !faqSection.querySelector(".launchFaqLink")) {
      const a = document.createElement("a");
      a.className = "launchFaqLink button";
      a.href = "/faq";
      a.innerHTML = "Consultar FAQ 2027 <span>→</span>";
      faqSection.appendChild(a);
    }

    const priority = home.querySelector<HTMLElement>(".priorityCta");
    if (priority) {
      const pk = priority.querySelector<HTMLElement>(".kicker");
      const h2 = priority.querySelector<HTMLElement>("h2");
      const p = priority.querySelector<HTMLElement>("p:not(.kicker)");
      const a = priority.querySelector<HTMLAnchorElement>("a");
      if (pk) pk.textContent = "29 ABR — 02 MAI 2027 · 100 VAGAS";
      if (h2) h2.innerHTML = "Seu lugar na<br><em>travessia.</em>";
      if (p) p.textContent = "A página de inscrições já está preparada com lotes, modalidades, documentos e condições. Nesta prévia, a compra permanece bloqueada até a abertura oficial.";
      if (a) { a.href = "/inscricoes"; a.innerHTML = "Ver condições de inscrição <span>→</span>"; }
    }

    const oldIncluded = home.querySelector<HTMLElement>(".includedSection");
    if (oldIncluded?.parentNode) {
      oldIncluded.classList.add("launchOldIncluded");
      let root = document.getElementById("launch-included-root");
      if (!root) {
        root = document.createElement("div");
        root.id = "launch-included-root";
        oldIncluded.parentNode.insertBefore(root, oldIncluded);
      }
      setKitTarget(root);
    }
  }, []);

  return <>
    <style>{`
      .launchPrice{display:grid;grid-template-columns:auto auto;align-items:end;gap:0 14px;padding-left:6px}.launchPrice span{grid-column:1/-1;color:#c67a3b;font:600 11px 'Barlow Condensed';letter-spacing:.16em}.launchPrice strong{font:700 28px 'Barlow Condensed';line-height:1}.launchPrice small{color:#b8b0a4;font-size:11px}.launchOldIncluded{display:none!important}.launchFaqHidden{display:none!important}.launchFaqLink{display:inline-flex;margin-top:25px}.launchIncluded{background:#f4f0db;color:#0b0d0c;padding:120px 0}.launchIncluded .wrap{width:min(1440px,calc(100% - 96px));margin:auto}.launchIncludedHead{display:grid;grid-template-columns:1.3fr .8fr;gap:70px;align-items:end;margin-bottom:55px}.launchIncluded .eyebrow{color:#c67a3b;text-transform:uppercase;letter-spacing:.2em;font:600 13px 'Barlow Condensed'}.launchIncluded h2{font:700 clamp(48px,5.6vw,84px) 'Barlow Condensed';text-transform:uppercase;line-height:.9;margin:15px 0}.launchIncludedHead>p{color:#646761;line-height:1.7}.launchProducts{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid rgba(17,17,17,.16)}.launchProduct{padding:26px;border-right:1px solid rgba(17,17,17,.16)}.launchProduct:last-child{border:0}.launchProduct img{width:100%;aspect-ratio:1/1;object-fit:contain}.launchProduct h3{font:700 25px 'Barlow Condensed';text-transform:uppercase;margin:15px 0 0}.launchServices{display:grid;grid-template-columns:repeat(5,1fr);margin-top:22px;border-top:1px solid rgba(17,17,17,.18);border-left:1px solid rgba(17,17,17,.18)}.launchServices span{padding:17px;border-right:1px solid rgba(17,17,17,.18);border-bottom:1px solid rgba(17,17,17,.18);font:600 13px 'Barlow Condensed';text-transform:uppercase}.launchDocs{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.launchDocs a{padding:14px 17px;border:1px solid #c67a3b;font:700 12px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.07em}.launchDocs a:first-child{background:#c67a3b;color:#fff}@media(max-width:900px){.launchIncluded .wrap{width:calc(100% - 30px)}.launchIncludedHead{grid-template-columns:1fr}.launchProducts{grid-template-columns:1fr 1fr}.launchProduct:nth-child(2){border-right:0}.launchServices{grid-template-columns:1fr 1fr}.launchPrice{width:100%;padding-top:8px}}
    `}</style>
    {kitTarget && createPortal(
      <section className="launchIncluded">
        <div className="wrap">
          <div className="launchIncludedHead"><div><p className="eyebrow">Inscrição padrão</p><h2>O que está<br />incluído.</h2></div><p>A inscrição foi atualizada para refletir exatamente o Regulamento Oficial 1.1. Jersey e meias não fazem parte da inscrição padrão e poderão integrar produtos opcionais / Kit Premium.</p></div>
          <div className="launchProducts">{includedProducts.map(([name,img])=><article className="launchProduct" key={name}><img src={img} alt={name} /><h3>{name}</h3></article>)}</div>
          <div className="launchServices">{includedServices.map(item=><span key={item}>{item}</span>)}</div>
          <div className="launchDocs"><a href="/inscricoes">Ver inscrições →</a><a href="/regulamento">Regulamento</a><a href="/documentos-medicos">Documentação médica</a><a href="/manual-do-atleta">Manual do atleta</a></div>
        </div>
      </section>, kitTarget
    )}
  </>;
}
