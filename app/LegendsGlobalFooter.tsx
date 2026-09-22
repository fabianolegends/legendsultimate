"use client";

import { usePathname } from "next/navigation";
import PrivacyPreferencesButton from "./PrivacyPreferencesButton";
import { getRegistrationHref } from "./lib/launch";
import { localeDetails, localeFromPathname, stripLocalePrefix } from "./i18n/config";
import { getHomeCopy } from "./i18n/home";

const hiddenRoutes = [
  "/passport",
  "/organizacao",
  "/eventos",
  "/resultados",
  "/documentos-medicos/atestado",
  "/documentos-medicos/declaracao-saude",
  "/fontes",
];

function isHiddenRoute(pathname: string) {
  const publicPathname = stripLocalePrefix(pathname);
  return hiddenRoutes.some((route) => publicPathname === route || publicPathname.startsWith(`${route}/`));
}

export default function LegendsGlobalFooter() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const copy = getHomeCopy(locale).footer;
  const homeHref = localeDetails[locale].href;

  if (!pathname || isHiddenRoute(pathname)) return null;

  const compact = locale === "pt" && (pathname === "/" || pathname === "/inscricoes");

  return (
    <footer id="rodape" className="legendsGlobalFooter" aria-label={`${copy.explore} · Legends Bike Race`}>
      {!compact && <section className="legendsFooterStatement">
        <div className="legendsFooterShell">
          <p className="legendsFooterEyebrow">{copy.statement}</p>
          <h2>
            {copy.titleLead}
            <br />
            <em>{copy.titleAccent}</em>
          </h2>
        </div>
      </section>}

      {!compact && <section className="legendsFooterCommunity" aria-labelledby="legends-community-title">
        <div className="legendsFooterShell legendsFooterCommunityGrid">
          <div>
            <p className="legendsFooterEyebrow">{copy.community}</p>
            <h3 id="legends-community-title">{copy.communityTitle}</h3>
            <p className="legendsFooterDescription">
              {copy.communityDescription}
            </p>
          </div>
          <div className="legendsFooterActions">
            <a className="legendsFooterPrimary" href={locale === "pt" ? "/inscricoes" : getRegistrationHref()}>{copy.register}</a>
            <a className="legendsFooterSecondary" href="/lista-prioritaria">{copy.join}</a>
          </div>
        </div>
      </section>}

      <section className="legendsFooterBase">
        <div className="legendsFooterShell legendsFooterGrid">
          <div className="legendsFooterBrand">
            <div className="legendsFooterBrandMarks">
              <a href={homeHref} aria-label={`${copy.home} · Legends Bike Race`}>
                <img className="legendsFooterLegendsLogo" src="/legends-logo-official.png" alt="Legends Bike Race" />
              </a>
              <div className="legendsFooterProducer">
                <img src="/tr3-logo-footer-exact.svg" alt="Threerace Sports" />
                <p><span>{copy.product}</span><strong>Threerace Sports</strong></p>
              </div>
            </div>
            <p>{copy.brandDescription}</p>
          </div>

          <nav className="legendsFooterColumn" aria-label={`${copy.explore} Legends`}>
            <p className="legendsFooterEyebrow">{copy.explore}</p>
            <a href={homeHref}>{copy.home}</a>
            <a href="/a-prova">{copy.race}</a>
            <a href="/percursos">{copy.routes}</a>
            <a href="/inscricoes">{copy.registrations}</a>
            <a href="/faq#perguntas">{copy.frequentlyAsked}</a>
          </nav>

          <nav className="legendsFooterColumn" aria-label={`${copy.documents} Legends`}>
            <p className="legendsFooterEyebrow">{copy.documents}</p>
            <a href="/regulamento">{copy.regulation}</a>
            <a href="/manual-do-atleta">{copy.manual}</a>
            <a href="/documentos-medicos">{copy.medical}</a>
            <a href="/politica-de-privacidade">{copy.privacy}</a>
          </nav>

          <div className="legendsFooterColumn legendsFooterContact">
            <p className="legendsFooterEyebrow">{copy.contact}</p>
            <a href="mailto:contato@legendsbikerace.com.br">contato@legendsbikerace.com.br</a>
            <a href="https://wa.me/5554996329164" target="_blank" rel="noreferrer">WhatsApp +55 54 99632-9164</a>
            <div className="legendsFooterSocials" aria-label="Redes sociais">
              <a href="https://www.instagram.com/legends.race/" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://www.facebook.com/1272724699251164" target="_blank" rel="noreferrer">Facebook</a>
              <a href="https://www.youtube.com/@legendsbikerace" target="_blank" rel="noreferrer">YouTube</a>
            </div>
          </div>
        </div>

        <div className="legendsFooterShell legendsFooterBottom">
          <p>Legends Bike Race © {new Date().getFullYear()} · {copy.experience}</p>
          <div>
            <span>{copy.location}</span>
            <PrivacyPreferencesButton label={copy.privacy} />
          </div>
        </div>
      </section>
    </footer>
  );
}
