"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getRegistrationHref } from "./lib/launch";

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
  "Seguro básico conforme apólice",
  "Equipe de apoio, segurança e resgate",
  "Bike Wash",
  "Mecânica básica Danda Bike",
  "GPX oficial e Race Engine",
];

export default function LaunchHomePreview() {
  const [journeyTarget, setJourneyTarget] = useState<HTMLElement | null>(null);
  const [kitTarget, setKitTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const home = document.querySelector<HTMLElement>(".redesign");
    if (!home) return;

    const desktopNav = home.querySelector<HTMLElement>(".desktopNavCluster .navLinks");
    if (desktopNav) {
      desktopNav.querySelectorAll("a").forEach((link) => {
        const href = link.getAttribute("href");
        if (["#modalidades", "/race-engine", "/regulamento", "https://wa.me/5554996329164"].includes(href || "")) link.remove();
      });
      if (!desktopNav.querySelector('[data-launch-link="inscricoes"]')) {
        const registration = document.createElement("a");
        registration.href = getRegistrationHref();
        registration.textContent = "Inscrições";
        registration.dataset.launchLink = "inscricoes";
        desktopNav.insertBefore(registration, desktopNav.firstChild);
      }
      if (!desktopNav.querySelector('[data-launch-link="incluido"]')) {
        const faqLink = Array.from(desktopNav.querySelectorAll<HTMLAnchorElement>("a")).find((link) => link.getAttribute("href")?.startsWith("/faq"));
        const included = document.createElement("a");
        included.href = "#incluido";
        included.textContent = "O que está incluído";
        included.dataset.launchLink = "incluido";
        desktopNav.insertBefore(included, faqLink || null);
      }
    }

    const navCta = home.querySelector<HTMLAnchorElement>(".desktopNavCluster .navCta");
    if (navCta) { navCta.textContent = "Área do atleta"; navCta.href = "/acesso"; }

    const kicker = home.querySelector<HTMLElement>(".heroCopy .kicker");
    if (kicker) kicker.textContent = "29 ABR — 02 MAI 2027 · SERRA GAÚCHA";

    const ctas = home.querySelector<HTMLElement>(".heroCtas");
    if (ctas) {
      const links = Array.from(ctas.querySelectorAll<HTMLAnchorElement>("a"));
      if (links[0]) { links[0].href = getRegistrationHref(); links[0].innerHTML = "Me inscrever <span>→</span>"; }
      if (links[1]) links[1].style.display = "none";

      let spots = ctas.querySelector<HTMLElement>(".remainingSpotsCard");
      if (!spots) {
        spots = document.createElement("div");
        spots.className = "remainingSpotsCard";
        spots.innerHTML = '<span><i class="journeyScript">Ultimate</i><b> — 4 DIAS</b></span><strong>R$ 999</strong><small>100 / 100 VAGAS</small>';
        if (links[1]) links[1].insertAdjacentElement("afterend", spots);
        else ctas.appendChild(spots);
      }

      let price = ctas.querySelector<HTMLElement>(".launchPrice");
      if (!price) {
        price = document.createElement("div");
        price.className = "launchPrice";
        price.innerHTML = '<span><i class="journeyScript">Short</i><b> — 2 DIAS</b></span><strong>R$ 699</strong><small>50 / 50 VAGAS</small>';
        ctas.appendChild(price);
      }

      const ultimateCounter = spots.querySelector<HTMLElement>("small");
      const shortCounter = price.querySelector<HTMLElement>("small");
      void fetch("/api/public/remaining-spots", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((payload) => {
          if (!payload) return;
          const ultimateRemaining = Number(payload.ultimate?.remaining ?? 100);
          const ultimateTotal = Number(payload.ultimate?.total ?? 100);
          const shortRemaining = Number(payload.short?.remaining ?? 50);
          const shortTotal = Number(payload.short?.total ?? 50);
          if (ultimateCounter && Number.isFinite(ultimateRemaining)) ultimateCounter.textContent = `${ultimateRemaining} / ${ultimateTotal} VAGAS`;
          if (shortCounter && Number.isFinite(shortRemaining)) shortCounter.textContent = `${shortRemaining} / ${shortTotal} VAGAS`;
        })
        .catch(() => undefined);
    }

    const technicalLink = home.querySelector<HTMLAnchorElement>('a[href="/race-engine"]');
    const technicalSection = technicalLink?.closest("section");
    if (technicalSection) technicalSection.classList.add("launchTechnicalReduced");
    home.querySelector<HTMLElement>(".profileSection")?.classList.add("launchProfileHidden");

    const safety = home.querySelector<HTMLElement>(".safetySection");
    if (safety?.parentNode) {
      let root = document.getElementById("launch-journey-root");
      if (!root) { root = document.createElement("div"); root.id = "launch-journey-root"; safety.parentNode.insertBefore(root, safety); }
      setJourneyTarget(root);
    }

    const faqCopy = home.querySelector<HTMLElement>(".faqSection .sectionHead > p:last-child");
    if (faqCopy) faqCopy.textContent = "As cinco respostas essenciais antes de decidir. As regras completas ficam no FAQ e no Regulamento.";
    const faqList = home.querySelector<HTMLElement>(".faqSection .faqList");
    if (faqList) faqList.classList.add("launchFaqEssential");
    const faqSection = home.querySelector<HTMLElement>(".faqSection .wide");
    if (faqSection && !faqSection.querySelector(".launchFaqLink")) {
      const a = document.createElement("a");
      a.className = "launchFaqLink button";
      a.href = "/faq#perguntas";
      a.innerHTML = "Ver todas as perguntas <span>→</span>";
      faqSection.appendChild(a);
    }

    const priority = home.querySelector<HTMLElement>(".priorityCta");
    if (priority) {
      const pk = priority.querySelector<HTMLElement>(".kicker");
      const h2 = priority.querySelector<HTMLElement>("h2");
      const p = priority.querySelector<HTMLElement>("p:not(.kicker)");
      const a = priority.querySelector<HTMLAnchorElement>("a");
      if (pk) pk.textContent = "ULTIMATE R$ 999 · SHORT R$ 699";
      if (h2) h2.innerHTML = "Quero escolher<br><em>minha jornada.</em>";
      if (p) p.textContent = "Confira modalidade, documentos e condições. Nesta prévia, a compra continua bloqueada até a abertura oficial.";
      if (a) { a.href = getRegistrationHref(); a.innerHTML = "Me inscrever <span>→</span>"; }
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
      .redesign .heroCopy .kicker{font-size:clamp(15px,1.15vw,18px);letter-spacing:.25em}.remainingSpotsCard{height:68px;min-width:248px;display:grid;grid-template-columns:auto auto;grid-template-rows:auto auto;align-content:center;justify-content:center;column-gap:18px;padding:10px 18px;border:1px solid rgba(241,236,227,.45);background:rgba(8,10,9,.52);text-transform:uppercase}.remainingSpotsCard span{grid-column:1/-1;grid-row:1;color:#c67a3b;font:600 10px 'Barlow Condensed';letter-spacing:.16em;align-self:end}.remainingSpotsCard span .journeyScript,.launchPrice span .journeyScript{display:inline-block;font-size:1.18em;color:#f1ece3;vertical-align:baseline}.remainingSpotsCard span b,.launchPrice span b{font:inherit}.remainingSpotsCard strong{grid-column:1;grid-row:2;font:700 28px 'Barlow Condensed';line-height:.9;color:#f1ece3}.remainingSpotsCard small{grid-column:2;grid-row:2;align-self:center;text-align:center;color:#d4cec4;font:600 11px 'Barlow Condensed';letter-spacing:.07em;white-space:nowrap}.launchPrice{display:grid;grid-template-columns:auto auto;grid-template-rows:auto auto;align-content:center;justify-content:center;column-gap:18px;padding-left:6px}.launchPrice span{grid-column:1/-1;grid-row:1;color:#c67a3b;font:600 11px 'Barlow Condensed';letter-spacing:.16em}.launchPrice strong{grid-column:1;grid-row:2;font:700 28px 'Barlow Condensed';line-height:1}.launchPrice small{grid-column:2;grid-row:2;align-self:center;text-align:center;color:#b8b0a4;font:600 11px 'Barlow Condensed';letter-spacing:.05em;white-space:nowrap}.launchProfileHidden,.launchTechnicalReduced{display:none!important}.launchOldIncluded{display:none!important}.launchFaqEssential details:nth-of-type(n+6){display:none!important}.launchFaqLink{display:inline-flex;margin-top:25px}
      .launchJourney .wrap,.launchIncluded .wrap{width:min(1440px,calc(100% - 96px));margin:auto}
      .launchJourney{background:#111411;color:#f1ece3;padding:96px 0;border-top:1px solid rgba(255,255,255,.07)}.launchJourneyHead{display:grid;grid-template-columns:1fr .8fr;gap:70px;align-items:end;margin-bottom:45px}.launchJourney .eyebrow,.launchIncluded .eyebrow{color:#c67a3b;text-transform:uppercase;letter-spacing:.2em;font:600 13px 'Barlow Condensed'}.launchJourney h2,.launchIncluded h2{font:700 clamp(48px,5.6vw,84px) 'Barlow Condensed';text-transform:uppercase;line-height:.9;margin:15px 0}.launchJourneyHead>p{color:#a8aca5;line-height:1.7}.journeySteps{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid rgba(198,122,59,.3)}.journeySteps article{padding:26px;border-right:1px solid rgba(198,122,59,.25)}.journeySteps article:last-child{border:0}.journeySteps b{color:#c67a3b;font:700 12px 'Barlow Condensed';letter-spacing:.14em}.journeySteps h3{font:700 26px 'Barlow Condensed';text-transform:uppercase;margin:12px 0}.journeySteps p{color:#a7aba4;font-size:13px;line-height:1.55;margin:0}.beforeBox{margin-top:28px;padding:22px;border:1px solid rgba(255,255,255,.12);display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start}.beforeBox strong{font:700 22px 'Barlow Condensed';text-transform:uppercase;color:#c67a3b}.beforeBox p{margin:0;color:#c7c9c4;line-height:1.65}
      .launchIncluded{background:#f4f0db;color:#0b0d0c;padding:100px 0}.launchIncludedHead{display:grid;grid-template-columns:1.3fr .8fr;gap:70px;align-items:end;margin-bottom:45px}.launchIncludedHead>p{color:#646761;line-height:1.7}.launchProducts{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid rgba(17,17,17,.16)}.launchProduct{padding:22px;border-right:1px solid rgba(17,17,17,.16)}.launchProduct:last-child{border:0}.launchProduct img{width:100%;aspect-ratio:1/1;object-fit:contain}.launchProduct h3{font:700 23px 'Barlow Condensed';text-transform:uppercase;margin:12px 0 0}.launchServices{display:grid;grid-template-columns:repeat(4,1fr);margin-top:18px;border-top:1px solid rgba(17,17,17,.18);border-left:1px solid rgba(17,17,17,.18)}.launchServices span{padding:15px;border-right:1px solid rgba(17,17,17,.18);border-bottom:1px solid rgba(17,17,17,.18);font:600 12px 'Barlow Condensed';text-transform:uppercase}.launchDocs{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}.launchDocs a{padding:13px 16px;border:1px solid #c67a3b;font:700 12px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.07em}.launchDocs a:first-child{background:#c67a3b;color:#fff}
      @media(max-width:1050px){.journeySteps{grid-template-columns:1fr 1fr}.journeySteps article{border-bottom:1px solid rgba(198,122,59,.25)}.journeySteps article:nth-child(even){border-right:0}}
      @media(max-width:900px){.launchJourney .wrap,.launchIncluded .wrap{width:calc(100% - 30px)}.launchJourneyHead,.launchIncludedHead{grid-template-columns:1fr}.launchProducts{grid-template-columns:1fr 1fr}.launchProduct:nth-child(2){border-right:0}.launchServices{grid-template-columns:1fr 1fr}.launchPrice{width:100%;padding-top:8px}.remainingSpotsCard{min-width:210px}.beforeBox{grid-template-columns:1fr}}
      @media(max-width:620px){.redesign .heroCtas{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px!important;align-items:stretch}.redesign .heroCtas .button{grid-column:1/-1}.remainingSpotsCard{width:100%;min-width:0;height:72px;padding:10px 12px;column-gap:9px}.remainingSpotsCard small{font-size:10px;letter-spacing:.05em}.launchPrice{width:100%;min-width:0;min-height:72px;padding:10px 12px;border:1px solid rgba(241,236,227,.45);background:rgba(8,10,9,.52);grid-template-columns:auto 1fr;align-content:center;gap:2px 8px}.launchPrice span{font-size:10px}.launchPrice strong{font-size:26px}.launchPrice small{font-size:9px;line-height:1.25}.journeySteps{grid-template-columns:1fr}.journeySteps article{min-height:0;display:grid;grid-template-columns:30px minmax(0,1fr);column-gap:10px;row-gap:3px;align-items:center;padding:14px 16px;border-right:0}.journeySteps b{grid-row:1/3;align-self:start;padding-top:3px;font-size:10px}.journeySteps h3{margin:0;font-size:20px;line-height:1}.journeySteps p{font-size:11px;line-height:1.35}.launchIncludedHead{margin-bottom:26px}.launchIncludedHead>p{display:none}.launchProducts{grid-template-columns:1fr 1fr}}
    `}</style>

    {journeyTarget && createPortal(
      <section className="launchJourney"><div className="wrap">
        <div className="launchJourneyHead"><div><p className="eyebrow">Como funciona a jornada</p><h2>Você pedala.<br />A jornada segue.</h2></div><p>Sem complicar a decisão com tecnologia e regulamento. O essencial é entender como a jornada escolhida funciona na prática.</p></div>
        <div className="journeySteps">
          <article><b>01</b><h3>Largue</h3><p>Com o GPX oficial, sua estratégia de hidratação, alimentação e equipamento.</p></article>
          <article><b>02</b><h3>Pedale</h3><p>Siga a rota por GPS e complete os checkpoints previstos para a etapa.</p></article>
          <article><b>03</b><h3>Chegue</h3><p>Ao final da etapa, sua atividade é validada e você entra na nova cidade-base.</p></article>
          <article><b>04</b><h3>Recupere</h3><p>Sua bag oficial é transportada pela organização. Bike Wash e mecânica básica ajudam na preparação.</p></article>
          <article><b>05</b><h3>Repita</h3><p>No dia seguinte, uma nova etapa, uma nova cidade e mais um capítulo da travessia.</p></article>
        </div>
        <div className="beforeBox"><strong>Antes de se inscrever</strong><p>Hospedagem e refeições não estão incluídas. O transporte da bag oficial entre as cidades-base está incluído. O deslocamento pessoal do atleta permanece por conta do participante enquanto não houver serviço oficial de transfer divulgado.</p></div>
      </div></section>, journeyTarget
    )}

    {kitTarget && createPortal(
      <section className="launchIncluded" id="incluido"><div className="wrap">
        <div className="launchIncludedHead"><div><p className="eyebrow">Inscrição padrão</p><h2>O que sua<br />inscrição entrega.</h2></div><p>Mostramos aqui apenas o que mais pesa na decisão. A relação completa está na página de inscrições e no Regulamento Oficial.</p></div>
        <div className="launchProducts">{includedProducts.map(([name,img])=><article className="launchProduct" key={name}><img src={img} alt={name} /><h3>{name}</h3></article>)}</div>
        <div className="launchServices">{includedServices.map(item=><span key={item}>{item}</span>)}</div>
        <div className="launchDocs"><a href="/inscricoes">Ver tudo que está incluído →</a><a href="/regulamento">Regulamento</a><a href="/documentos-medicos">Documentação médica</a></div>
      </div></section>, kitTarget
    )}
  </>;
}
