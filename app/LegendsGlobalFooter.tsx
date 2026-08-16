"use client";

import { usePathname } from "next/navigation";
import PrivacyPreferencesButton from "./PrivacyPreferencesButton";
import { getRegistrationHref } from "./lib/launch";

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
  return hiddenRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function LegendsGlobalFooter() {
  const pathname = usePathname();

  if (!pathname || isHiddenRoute(pathname)) return null;

  return (
    <footer id="rodape" className="legendsGlobalFooter" aria-label="Rodapé da Legends Bike Race">
      <section className="legendsFooterStatement">
        <div className="legendsFooterShell">
          <p className="legendsFooterEyebrow">Da Serra Gaúcha para o mundo.</p>
          <h2>
            Quando a jornada termina,
            <br />
            <em>a lenda permanece.</em>
          </h2>
        </div>
      </section>

      <section className="legendsFooterCommunity" aria-labelledby="legends-community-title">
        <div className="legendsFooterShell legendsFooterCommunityGrid">
          <div>
            <p className="legendsFooterEyebrow">Comunidade Legends</p>
            <h3 id="legends-community-title">Receba as próximas largadas.</h3>
            <p className="legendsFooterDescription">
              Datas, abertura de inscrições, hotéis conveniados e histórias dos territórios onde pedalamos.
            </p>
          </div>
          <div className="legendsFooterActions">
            <a className="legendsFooterPrimary" href={getRegistrationHref()}>Me inscrever</a>
            <a className="legendsFooterSecondary" href="/lista-prioritaria">Entrar na comunidade</a>
          </div>
        </div>
      </section>

      <section className="legendsFooterBase">
        <div className="legendsFooterShell legendsFooterGrid">
          <div className="legendsFooterBrand">
            <div className="legendsFooterBrandMarks">
              <a href="/" aria-label="Ir para a página inicial da Legends Bike Race">
                <img className="legendsFooterLegendsLogo" src="/legends-logo-official.png" alt="Legends Bike Race" />
              </a>
              <div className="legendsFooterProducer">
                <img src="/tr3-logo-footer-exact.svg" alt="Threerace Sports" />
                <p><span>Um produto</span><strong>Threerace Sports</strong></p>
              </div>
            </div>
            <p>Gravel, territórios e histórias que continuam depois da linha de chegada.</p>
          </div>

          <nav className="legendsFooterColumn" aria-label="Explorar a Legends">
            <p className="legendsFooterEyebrow">Explore</p>
            <a href="/">Início</a>
            <a href="/a-prova">A prova</a>
            <a href="/percursos">Percursos</a>
            <a href="/inscricoes">Inscrições</a>
            <a href="/faq#perguntas">Perguntas frequentes</a>
          </nav>

          <nav className="legendsFooterColumn" aria-label="Documentos da Legends">
            <p className="legendsFooterEyebrow">Documentos</p>
            <a href="/regulamento">Regulamento</a>
            <a href="/manual-do-atleta">Manual do atleta</a>
            <a href="/documentos-medicos">Documentação médica</a>
            <a href="/politica-de-privacidade">Política de privacidade</a>
          </nav>

          <div className="legendsFooterColumn legendsFooterContact">
            <p className="legendsFooterEyebrow">Fale com a Legends</p>
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
          <p>Legends Bike Race © {new Date().getFullYear()} · Uma experiência Threerace Sports</p>
          <div>
            <span>Serra Gaúcha · Brasil</span>
            <PrivacyPreferencesButton />
          </div>
        </div>
      </section>
    </footer>
  );
}
