"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { getRegistrationHref } from "./lib/launch";
import { localeFromPathname } from "./i18n/config";
import { getHomeCopy } from "./i18n/home";

const includedProductImages = [
  "/images/kit/camiseta-casual.webp",
  "/images/kit/bag-50-litros.webp",
  "/images/kit/cap-ciclismo.webp",
  "/images/kit/placa-gravel.webp",
];

export default function LaunchHomePreview() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const copy = getHomeCopy(locale);
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
        registration.href = "/inscricoes";
        registration.textContent = copy.navigation.registration;
        registration.dataset.launchLink = "inscricoes";
        desktopNav.insertBefore(registration, desktopNav.firstChild);
      }
      if (!desktopNav.querySelector('[data-launch-link="incluido"]')) {
        const faqLink = Array.from(desktopNav.querySelectorAll<HTMLAnchorElement>("a")).find((link) => link.getAttribute("href")?.startsWith("/faq"));
        const included = document.createElement("a");
        included.href = "#incluido";
        included.textContent = copy.navigation.included;
        included.dataset.launchLink = "incluido";
        desktopNav.insertBefore(included, faqLink || null);
      }
    }

    const navCta = home.querySelector<HTMLAnchorElement>(".desktopNavCluster .navCta");
    if (navCta) { navCta.textContent = copy.navigation.athleteArea; navCta.href = "/passport/acesso"; }

    const kicker = home.querySelector<HTMLElement>(".heroCopy .kicker");
    if (kicker) kicker.textContent = copy.hero.date;

    const ctas = home.querySelector<HTMLElement>(".heroCtas");
    if (ctas) {
      const links = Array.from(ctas.querySelectorAll<HTMLAnchorElement>("a"));
      if (links[0]) { links[0].href = getRegistrationHref(); links[0].innerHTML = `${copy.navigation.register} <span>→</span>`; }
      if (links[1]) links[1].style.display = "none";

      let spots = ctas.querySelector<HTMLAnchorElement>(".remainingSpotsCard");
      if (!spots) {
        spots = document.createElement("a");
        spots.className = "remainingSpotsCard";
        spots.href = getRegistrationHref("ultimate");
        if (links[1]) links[1].insertAdjacentElement("afterend", spots);
        else ctas.appendChild(spots);
      }
      spots.setAttribute("aria-label", copy.hero.ultimateAria);
      spots.innerHTML = `<span><i class="journeyScript">Ultimate</i><b> — ${copy.hero.ultimateDays}</b></span><strong>R$ 999</strong>`;

      let price = ctas.querySelector<HTMLAnchorElement>(".launchPrice");
      if (!price) {
        price = document.createElement("a");
        price.className = "launchPrice";
        price.href = getRegistrationHref("short");
        ctas.appendChild(price);
      }
      price.setAttribute("aria-label", copy.hero.shortAria);
      price.innerHTML = `<span><i class="journeyScript">Short</i><b> — ${copy.hero.shortDays}</b></span><strong>R$ 699</strong>`;

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
    if (faqCopy) faqCopy.textContent = copy.faq.description;
    const faqList = home.querySelector<HTMLElement>(".faqSection .faqList");
    if (faqList) faqList.classList.add("launchFaqEssential");
    const faqSection = home.querySelector<HTMLElement>(".faqSection .wide");
    if (faqSection) {
      let a = faqSection.querySelector<HTMLAnchorElement>(".launchFaqLink");
      if (!a) {
        a = document.createElement("a");
        a.className = "launchFaqLink button";
        a.href = "/faq#perguntas";
        faqSection.appendChild(a);
      }
      a.innerHTML = `${copy.faq.all} <span>→</span>`;
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
  }, [copy, locale]);

  return <>
    <style>{`
      .redesign .heroCopy .kicker{font-size:clamp(15px,1.15vw,18px);letter-spacing:.25em}.remainingSpotsCard,.launchPrice{color:inherit;text-decoration:none;cursor:pointer;transition:transform .2s ease,background .2s ease,box-shadow .2s ease,border-color .2s ease}.remainingSpotsCard:hover,.launchPrice:hover{transform:translateY(-2px);background:rgba(40,25,15,.72);box-shadow:inset 0 0 0 1px #c67a3b}.remainingSpotsCard:focus-visible,.launchPrice:focus-visible{outline:2px solid #f1ece3;outline-offset:4px}.remainingSpotsCard{height:68px;min-width:210px;display:grid;grid-template-rows:auto auto;align-content:center;justify-content:center;padding:10px 18px;border:1px solid rgba(241,236,227,.45);background:rgba(8,10,9,.52);text-transform:uppercase}.remainingSpotsCard span{color:#c67a3b;font:600 10px 'Barlow Condensed';letter-spacing:.16em;align-self:end}.remainingSpotsCard span .journeyScript,.launchPrice span .journeyScript{display:inline-block;font-size:1.18em;color:#f1ece3;vertical-align:baseline}.remainingSpotsCard span b,.launchPrice span b{font:inherit}.remainingSpotsCard strong{font:700 28px 'Barlow Condensed';line-height:.9;color:#f1ece3}.launchPrice{min-width:150px;display:grid;grid-template-rows:auto auto;align-content:center;justify-content:start;padding-left:6px}.launchPrice span{color:#c67a3b;font:600 11px 'Barlow Condensed';letter-spacing:.16em}.launchPrice strong{font:700 28px 'Barlow Condensed';line-height:1}.launchProfileHidden,.launchTechnicalReduced{display:none!important}.launchOldIncluded{display:none!important}.launchFaqEssential details:nth-of-type(n+6){display:none!important}.launchFaqLink{display:inline-flex;margin-top:25px}
      .launchJourney .wrap,.launchIncluded .wrap{width:min(1440px,calc(100% - 96px));margin:auto}
      .launchJourney{background:#111411;color:#f1ece3;padding:96px 0;border-top:1px solid rgba(255,255,255,.07)}.launchJourneyHead{display:grid;grid-template-columns:1fr .8fr;gap:70px;align-items:end;margin-bottom:45px}.launchJourney .eyebrow,.launchIncluded .eyebrow{color:#c67a3b;text-transform:uppercase;letter-spacing:.2em;font:600 13px 'Barlow Condensed'}.launchJourney h2,.launchIncluded h2{font:700 clamp(48px,5.6vw,84px) 'Barlow Condensed';text-transform:uppercase;line-height:.9;margin:15px 0}.launchJourneyHead>p{color:#a8aca5;line-height:1.7}.journeySteps{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid rgba(198,122,59,.3)}.journeySteps article{padding:26px;border-right:1px solid rgba(198,122,59,.25)}.journeySteps article:last-child{border:0}.journeySteps b{color:#c67a3b;font:700 12px 'Barlow Condensed';letter-spacing:.14em}.journeySteps h3{font:700 26px 'Barlow Condensed';text-transform:uppercase;margin:12px 0}.journeySteps p{color:#a7aba4;font-size:13px;line-height:1.55;margin:0}.beforeBox{margin-top:28px;padding:22px;border:1px solid rgba(255,255,255,.12);display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start}.beforeBox strong{font:700 22px 'Barlow Condensed';text-transform:uppercase;color:#c67a3b}.beforeBox p{margin:0;color:#c7c9c4;line-height:1.65}
      .launchIncluded{background:#f4f0db;color:#0b0d0c;padding:100px 0}.launchIncludedHead{display:grid;grid-template-columns:1.3fr .8fr;gap:70px;align-items:end;margin-bottom:45px}.launchIncludedHead>p{color:#646761;line-height:1.7}.launchProducts{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid rgba(17,17,17,.16)}.launchProduct{padding:22px;border-right:1px solid rgba(17,17,17,.16)}.launchProduct:last-child{border:0}.launchProduct img{width:100%;aspect-ratio:1/1;object-fit:contain}.launchProduct h3{font:700 23px 'Barlow Condensed';text-transform:uppercase;margin:12px 0 0}.launchServices{display:grid;grid-template-columns:repeat(4,1fr);margin-top:18px;border-top:1px solid rgba(17,17,17,.18);border-left:1px solid rgba(17,17,17,.18)}.launchServices span{padding:15px;border-right:1px solid rgba(17,17,17,.18);border-bottom:1px solid rgba(17,17,17,.18);font:600 12px 'Barlow Condensed';text-transform:uppercase}.launchDocs{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}.launchDocs a{padding:13px 16px;border:1px solid #c67a3b;font:700 12px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.07em}.launchDocs a:first-child{background:#c67a3b;color:#fff}
      @media(max-width:1050px){.journeySteps{grid-template-columns:1fr 1fr}.journeySteps article{border-bottom:1px solid rgba(198,122,59,.25)}.journeySteps article:nth-child(even){border-right:0}}
      @media(max-width:900px){.launchJourney .wrap,.launchIncluded .wrap{width:calc(100% - 30px)}.launchJourneyHead,.launchIncludedHead{grid-template-columns:1fr}.launchProducts{grid-template-columns:1fr 1fr}.launchProduct:nth-child(2){border-right:0}.launchServices{grid-template-columns:1fr 1fr}.launchPrice{width:100%;padding-top:8px}.remainingSpotsCard{min-width:210px}.beforeBox{grid-template-columns:1fr}}
      @media(min-width:901px){.redesign .heroCtas{flex-wrap:nowrap}.remainingSpotsCard strong,.launchPrice strong{white-space:nowrap}}
      @media(max-width:620px){.redesign .heroCtas{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px!important;align-items:stretch}.redesign .heroCtas .button{display:none!important}.remainingSpotsCard{width:100%;min-width:0;height:72px;padding:10px 12px}.launchPrice{width:100%;min-width:0;min-height:72px;padding:10px 12px;border:1px solid rgba(241,236,227,.45);background:rgba(8,10,9,.52);align-content:center;justify-content:center;gap:2px}.launchPrice span{font-size:10px}.launchPrice strong{font-size:26px}.journeySteps{grid-template-columns:1fr}.journeySteps article{min-height:0;display:grid;grid-template-columns:30px minmax(0,1fr);column-gap:10px;row-gap:3px;align-items:center;padding:14px 16px;border-right:0}.journeySteps b{grid-row:1/3;align-self:start;padding-top:3px;font-size:10px}.journeySteps h3{margin:0;font-size:20px;line-height:1}.journeySteps p{font-size:11px;line-height:1.35}.launchIncludedHead{margin-bottom:26px}.launchIncludedHead>p{display:none}.launchProducts{grid-template-columns:1fr 1fr}}
      .redesign .heroCopy .kicker{font-size:clamp(30px,2.3vw,36px);line-height:1.05;letter-spacing:.18em}
      @media(max-width:620px){.redesign .heroCopy .kicker{font-size:28px;line-height:1.08;letter-spacing:.12em}}
    `}</style>

    {journeyTarget && createPortal(
      <section className="launchJourney"><div className="wrap">
        <div className="launchJourneyHead"><div><p className="eyebrow">{copy.launch.journeyEyebrow}</p><h2>{copy.launch.journeyTitleLead}<br />{copy.launch.journeyTitleAccent}</h2></div><p>{copy.launch.journeyDescription}</p></div>
        <div className="journeySteps">
          {copy.launch.steps.map(([number, title, description]) => <article key={number}><b>{number}</b><h3>{title}</h3><p>{description}</p></article>)}
        </div>
        <div className="beforeBox"><strong>{copy.launch.beforeTitle}</strong><p>{copy.launch.beforeText}</p></div>
      </div></section>, journeyTarget
    )}

    {kitTarget && createPortal(
      <section className="launchIncluded" id="incluido"><div className="wrap">
        <div className="launchIncludedHead"><div><p className="eyebrow">{copy.launch.includedEyebrow}</p><h2>{copy.launch.includedTitleLead}<br />{copy.launch.includedTitleAccent}</h2></div><p>{copy.launch.includedDescription}</p></div>
        <div className="launchProducts">{copy.launch.products.map((name, index)=><article className="launchProduct" key={name}><img src={includedProductImages[index]} alt={name} /><h3>{name}</h3></article>)}</div>
        <div className="launchServices">{copy.launch.services.map(item=><span key={item}>{item}</span>)}</div>
        <div className="launchDocs"><a href="/inscricoes">{copy.launch.includedCta} →</a><a href="/regulamento">{copy.launch.regulation}</a><a href="/documentos-medicos">{copy.launch.medical}</a></div>
      </div></section>, kitTarget
    )}
  </>;
}
