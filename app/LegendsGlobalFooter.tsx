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
  const registrationsHref = `${homeHref}#inscricoes`;
  const routesHref = `${homeHref}#percursos`;
  const faqHref = `${homeHref}#faq`;
  const regulationHref = locale === "pt" ? "/regulamento" : `/${locale}/regulamento`;
  const medicalHref = locale === "pt" ? "/documentos-medicos" : `/${locale}/documentos-medicos`;

  if (!pathname || isHiddenRoute(pathname)) return null;

  return (
    <footer id="rodape" className="legendsGlobalFooter" aria-label={`${copy.explore} · Legends Bike Race`}>
      <section className="legendsFooterStatement">
        <div className="legendsFooterShell">
          <p className="legendsFooterEyebrow">{copy.statement}</p>
          <h2>
            {copy.titleLead}
            <br />
            <em>{copy.titleAccent}</em>
          </h2>
        </div>
      </section>

      <section className="legendsFooterCommunity" aria-labelledby="legends-community-title">
        <div className="legendsFooterShell legendsFooterCommunityGrid">
          <div>
            <p className="legendsFooterEyebrow">{copy.community}</p>
            <h3 id="legends-community-title">{copy.communityTitle}</h3>
            <p className="legendsFooterDescription">
              {copy.communityDescription}
            </p>
          </div>
          <div className="legendsFooterActions">
            <a className="legendsFooterPrimary" href={getRegistrationHref()}>{copy.register}</a>
            <a className="legendsFooterSecondary" href="/lista-prioritaria">{copy.join}</a>
          </div>
        </div>
      </section>

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
            <a href={routesHref}>{copy.routes}</a>
            <a href={registrationsHref}>{copy.registrations}</a>
            <a href={faqHref}>{copy.frequentlyAsked}</a>
          </nav>

          <nav className="legendsFooterColumn" aria-label={`${copy.documents} Legends`}>
            <p className="legendsFooterEyebrow">{copy.documents}</p>
            <a href={regulationHref}>{copy.regulation}</a>
            <a href={medicalHref}>{copy.medical}</a>
            <a href="/politica-de-privacidade">{copy.privacy}</a>
          </nav>

          <div className="legendsFooterColumn legendsFooterContact">
            <p className="legendsFooterEyebrow">{copy.contact}</p>
            <a href="mailto:contato@legendsbikerace.com.br">contato@legendsbikerace.com.br</a>
            <a href="https://wa.me/5554996329164" target="_blank" rel="noreferrer">WhatsApp +55 54 99632-9164</a>
            <div className="legendsFooterSocials" aria-label="Redes sociais">
              <a href="https://www.instagram.com/legends.race/" target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" className="fillIcon"/></svg></a>
              <a href="https://www.facebook.com/1272724699251164" target="_blank" rel="noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.7.3-1 1-1Z" className="fillIcon"/></svg></a>
              <a href="https://wa.me/5554996329164" target="_blank" rel="noreferrer" aria-label="WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.8A8 8 0 0 1 8.1 18.8L4 20l1.2-4A8 8 0 1 1 20 11.8Z"/><path d="M9 8.5c.3 2.5 2 4.2 4.5 5l1.2-1.2c.3-.3.6-.3.9-.1l2 1c.3.2.4.5.3.8-.5 1.5-1.7 2.2-3.2 2-4.2-.7-7-3.5-7.7-7.7-.2-1.5.5-2.7 2-3.2.3-.1.6 0 .8.3l1 2c.2.3.2.6-.1.9L9 8.5Z" className="fillIcon"/></svg></a>
              <a href="https://www.youtube.com/@legendsbikerace" target="_blank" rel="noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3Z" className="fillIcon"/></svg></a>
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
