import type { Metadata } from "next";
import { getRegistrationHref, getRegistrationLabel, launchConfig } from "../lib/launch";
import { AccordionLeadIcon, AccordionToggleIcons } from "./AccordionIcons";

export const metadata: Metadata = {
  title: "Inscrições | Legends Bike Race 2027",
  description: "Inscrições da Legends Bike Race 2027: 4 dias, 4 etapas, 370,3 km e 6.302 m+ pela Serra Gaúcha.",
  alternates: { canonical: "/inscricoes" },
};

const included = [
  "Participação nas quatro etapas da modalidade escolhida",
  "Camiseta casual oficial Legends Bike Race",
  "Bag oficial de 50 litros",
  "Cap de ciclismo oficial",
  "Rastreador satelital SPOT durante todas as etapas",
  "Placa oficial de identificação da bicicleta",
  "Medalha de conclusão conforme critérios do evento",
  "Transporte da bag oficial entre as cidades-base",
  "Hidratação nos checkpoints oficiais",
  "Arquivos GPX oficiais das etapas",
  "Checkpoints de controle",
  "Legends Race Engine, quando aplicável",
  "Apuração e monitoramento satelital da Gravel Race",
  "Seguro básico conforme condições da apólice",
  "Equipe oficial de apoio, segurança e resgate",
  "Bike Wash ao final das etapas",
  "Mecânica básica disponibilizada pela Danda Bike",
  "Briefings e estrutura operacional de largada e chegada",
];

const notIncluded = [
  "Kit Premium Legends Bike Race",
  "Hospedagem e refeições",
  "Transporte do participante até a Serra Gaúcha",
  "Passagens aéreas ou rodoviárias",
  "Transporte da bicicleta até a região do evento",
  "Combustível, estacionamento e pedágios",
  "GPS, telefone celular, bicicleta e equipamentos obrigatórios",
  "Manutenção Premium, revisão completa, peças e componentes",
  "Fisioterapia, massagem, recovery e serviços particulares",
  "Despesas médicas não abrangidas pelo seguro, medicamentos, exames e emissão do atestado médico",
  "Serviços turísticos, atividades opcionais, upgrades e produtos adicionais",
];

const categories = {
  masculine: [
    ["Open", "18–29 anos"],
    ["Master A", "30–39 anos"],
    ["Master B", "40–49 anos"],
    ["Senior", "50 anos ou mais"],
  ],
  feminine: [
    ["Feminino A", "18–40 anos"],
    ["Feminino B", "41 anos ou mais"],
  ],
} as const;

const stages = [
  { number: "Stage 01", route: "Canela → São Francisco de Paula", stats: "111,9 km · 1.684 m+ · limite 10 h", href: "/percursos/stage-1" },
  { number: "Stage 02", route: "São Francisco de Paula → Gramado", stats: "89,1 km · 1.520 m+ · limite 9 h", href: "/percursos/stage-2" },
  { number: "Stage 03", route: "Gramado → Nova Petrópolis", stats: "99,3 km · 1.522 m+ · limite 10 h", href: "/percursos/stage-3" },
  { number: "Stage 04", route: "Nova Petrópolis → Canela", stats: "70,0 km · 1.576 m+ · limite 6 h", href: "/percursos/stage-4" },
] as const;

const schedule = [
  ["29 ABR", "Stage 01", "Canela → São Francisco de Paula"],
  ["30 ABR", "Stage 02", "São Francisco de Paula → Gramado"],
  ["01 MAI", "Stage 03", "Gramado → Nova Petrópolis"],
  ["02 MAI", "Stage 04", "Nova Petrópolis → Canela · encerramento"],
] as const;

export default function InscricoesPage() {
  const registrationHref = getRegistrationHref();
  const registrationLabel = getRegistrationLabel();

  return (
    <main className="registrationPage">
      <style>{`
        .registrationPage{--paper:#f4f0db;--ink:#0b0d0c;--copper:#b96f48;--line:rgba(185,111,72,.32);background:#080a09;color:#f1ece3;min-height:100vh}
        .registrationPage *{box-sizing:border-box}.registrationPage .shell{width:min(1180px,calc(100% - 48px));margin:auto}
        .regNav{height:94px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.1)}
        .regNav img{display:block;width:auto;height:74px;object-fit:contain}.back{font:600 13px 'Barlow Condensed';letter-spacing:.11em;text-transform:uppercase;color:#d8d1c8}
        .regHero{min-height:640px;padding:92px 0 78px;display:flex;align-items:center;background:linear-gradient(90deg,rgba(5,7,6,.96) 0%,rgba(5,7,6,.87) 43%,rgba(5,7,6,.58) 100%),linear-gradient(180deg,rgba(8,10,9,.08),rgba(8,10,9,.82)),url('/inscricoes-gravel-forest.webp') center 58%/cover no-repeat}
        .eyebrow{margin:0 0 18px;color:var(--copper);font:600 13px 'Barlow Condensed';letter-spacing:.2em;text-transform:uppercase}
        .regHero h1{margin:0;max-width:850px;font:700 clamp(58px,8vw,112px) 'Barlow Condensed';line-height:.86;text-transform:uppercase}.regHero h1 em{font-style:normal;color:var(--copper)}
        .heroGrid{display:grid;grid-template-columns:1.3fr .7fr;gap:64px;align-items:end}.heroLead{font-size:18px;line-height:1.7;color:#acaea8;margin:25px 0 0;max-width:720px}
        .launchCard{border:1px solid var(--line);background:rgba(12,15,13,.84);backdrop-filter:blur(10px);padding:28px}.launchCard strong{display:block;font:700 43px 'Barlow Condensed';text-transform:uppercase}.launchCard small{display:block;color:#c0bdb6;margin-top:4px}.mainCta{display:flex;justify-content:space-between;align-items:center;margin-top:22px;background:var(--copper);color:white;padding:17px 20px;font:700 15px 'Barlow Condensed';letter-spacing:.09em;text-transform:uppercase}.mainCta[aria-disabled="true"]{opacity:.72;pointer-events:none}
        .section{padding:90px 0;border-top:1px solid rgba(255,255,255,.08)}.section.light{background:var(--paper);color:var(--ink)}
        .section h2{font:700 clamp(44px,5vw,72px) 'Barlow Condensed';line-height:.9;text-transform:uppercase;margin:0 0 34px}.section h2 em{font-style:normal;color:var(--copper)}
        .detailsSection{padding:78px 0 96px;background:var(--paper);color:var(--ink)}.detailsHead{display:grid;grid-template-columns:1.15fr .85fr;gap:60px;align-items:end;margin-bottom:42px}.detailsHead h2{font:700 clamp(48px,5.5vw,78px) 'Barlow Condensed';line-height:.9;text-transform:uppercase;margin:0}.detailsHead h2 em{font-style:normal;color:var(--copper)}.detailsHead>p{margin:0;color:#686b65;line-height:1.7;font-size:16px}
        .regAccordions{display:grid;gap:10px}.regAccordion{border:1px solid rgba(17,17,17,.15);background:#fffaf0;box-shadow:0 8px 24px rgba(16,18,15,.06);overflow:hidden}.regAccordion summary{list-style:none;display:grid;grid-template-columns:74px minmax(0,1fr) 58px;min-height:76px;align-items:center;cursor:pointer}.regAccordion summary::-webkit-details-marker{display:none}.accordionIcon{align-self:stretch;display:grid;place-items:center;background:var(--copper);color:#fff}.accordionIcon svg{width:27px;height:27px}.accordionTitle{display:grid;gap:3px;padding:13px 24px}.accordionTitle strong{font:700 19px 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase}.accordionTitle small{color:#71746e;font-size:12px;line-height:1.35}.accordionToggle{display:grid;place-items:center;color:var(--copper)}.accordionToggle svg{grid-area:1/1;width:22px;height:22px}.accordionToggle .minusIcon{display:none}.regAccordion[open] .accordionToggle .plusIcon{display:none}.regAccordion[open] .accordionToggle .minusIcon{display:block}.regAccordion[open] summary{border-bottom:1px solid rgba(17,17,17,.14)}.accordionBody{padding:32px;background:#eee6d8}.accordionBody .eyebrow{color:var(--copper)}.accordionBody .lotGrid{border-color:rgba(17,17,17,.16)}.accordionBody .lot{border-color:rgba(17,17,17,.16)}.accordionBody .lot p{color:#666a63}.accordionBody .columns{gap:38px}.accordionBody .checkList li{border-color:rgba(17,17,17,.13);color:#3e403d}.accordionBody .docs{gap:14px}.accordionBody .docCard{border-color:rgba(17,17,17,.18);background:#f7f1e6}.accordionBody .docCard p{color:#5f625c}.accordionBody .mode{background:#f6efe4}.accordionBody .mode.dark{background:#111411}.accordionBody .premiumOption{background:#f7f1e6}
        .lotGrid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);overflow:visible}.lot{position:relative;padding:28px;border-right:1px solid var(--line);transition:border-color .2s ease,background .2s ease}.lot:last-child{border:0}.lot>span:not(.activeLotBadge){color:var(--copper);font:600 13px 'Barlow Condensed';letter-spacing:.13em;text-transform:uppercase}.lot strong{display:block;font:700 48px 'Barlow Condensed';margin:22px 0 8px}.lot p{margin:0;color:#9ba097}.lot.activeLot{background:linear-gradient(180deg,rgba(185,111,72,.12),rgba(185,111,72,.035));box-shadow:inset 0 0 0 1px var(--copper)}.activeLotBadge{position:absolute;top:-17px;right:22px;display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 15px;background:var(--copper);color:#fff;font:700 11px 'Barlow Condensed';letter-spacing:.16em;text-transform:uppercase;box-shadow:0 7px 24px rgba(0,0,0,.26)}.activeLotBadge:before{content:'';width:6px;height:6px;margin-right:8px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.14)}
        .modeGrid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.mode{padding:34px;border:1px solid rgba(17,17,17,.18);background:#ede6d9}.mode.dark{background:#111411;color:#f1ece3;border-color:#111411}.mode h3{font:700 40px 'Barlow Condensed';text-transform:uppercase;margin:8px 0 15px}.mode p{line-height:1.65;color:#6f706c}.mode.dark p{color:#a8ada5}.mode .tag{color:var(--copper);font:600 12px 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase}
        .columns{display:grid;grid-template-columns:1fr 1fr;gap:50px}.checkList{list-style:none;padding:0;margin:0}.checkList li{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.11);color:#c4c6c1}.light .checkList li{border-color:rgba(17,17,17,.13);color:#3e403d}.checkList li:before{content:'✓';color:var(--copper);margin-right:10px}.minus li:before{content:'—'}
        .premiumOptions{display:grid;grid-template-columns:1.35fr .65fr;gap:18px}.premiumOption{position:relative;border:1px solid rgba(17,17,17,.17);padding:34px;display:grid;grid-template-columns:1fr auto;gap:34px;align-items:center;background:rgba(255,255,255,.17)}.premiumOption.featured{border-color:rgba(185,111,72,.72);background:linear-gradient(135deg,rgba(185,111,72,.09),rgba(255,255,255,.12))}.premiumBadge{position:absolute;top:0;left:34px;transform:translateY(-50%);background:var(--copper);color:#fff;padding:7px 11px;font:700 10px 'Barlow Condensed';letter-spacing:.15em;text-transform:uppercase}.premiumOption h3{font:700 36px 'Barlow Condensed';text-transform:uppercase;margin:0 0 12px}.premiumOption p{color:#676a65;line-height:1.6;margin:0}.premiumItems{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.premiumItems span{border:1px solid rgba(17,17,17,.15);padding:8px 10px;font:600 11px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.05em}.price{color:var(--copper);font:700 48px 'Barlow Condensed';white-space:nowrap}.price small{display:block;font:600 10px 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase;color:#777;margin-bottom:4px}
        .categoryGrid{display:grid;grid-template-columns:1.15fr .85fr;gap:34px}.categoryGroup{border-top:1px solid rgba(17,17,17,.18)}.categoryGroup h3{font:700 27px 'Barlow Condensed';text-transform:uppercase;margin:0;padding:0 0 16px}.categoryRow{display:flex;justify-content:space-between;gap:20px;padding:13px 0;border-bottom:1px solid rgba(17,17,17,.14)}.categoryRow strong{font:700 18px 'Barlow Condensed';text-transform:uppercase}.categoryRow span{color:#686b65;font-size:13px}.categoryNote{grid-column:1/-1;margin:0;color:#676a65;font-size:12px;line-height:1.65}.stageCompactGrid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid rgba(17,17,17,.17)}.stageCompact{display:grid;align-content:start;gap:10px;min-height:185px;padding:24px;border-right:1px solid rgba(17,17,17,.17);color:var(--ink)}.stageCompact:last-child{border-right:0}.stageCompact span{color:var(--copper);font:600 12px 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase}.stageCompact h3{font:700 24px 'Barlow Condensed';line-height:1;text-transform:uppercase;margin:0}.stageCompact p{color:#646760;font-size:12px;line-height:1.5;margin:0}.stageCompact b{align-self:end;color:var(--copper);font:700 11px 'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase}.scheduleList{border-top:1px solid rgba(17,17,17,.18)}.scheduleItem{display:grid;grid-template-columns:100px 120px minmax(0,1fr);gap:22px;align-items:center;padding:16px 0;border-bottom:1px solid rgba(17,17,17,.14)}.scheduleItem time{color:var(--copper);font:700 19px 'Barlow Condensed';letter-spacing:.06em}.scheduleItem strong{font:700 16px 'Barlow Condensed';text-transform:uppercase}.scheduleItem span{color:#565a53;font-size:13px}.scheduleNote{margin:18px 0 0;color:#686b65;font-size:12px;line-height:1.6}
        .docs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.docCard{border:1px solid var(--line);padding:26px}.docCard h3{font:700 29px 'Barlow Condensed';text-transform:uppercase;margin:10px 0}.docCard p{color:#a4aaa0;line-height:1.55}.docCard a{color:var(--copper);font:700 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.08em}
        .finalCta{text-align:center}.finalCta h2{max-width:880px;margin-inline:auto}.finalCta p{color:#a1a69e;max-width:690px;margin:0 auto 30px;line-height:1.65}.finalCta .mainCta{max-width:360px;margin-inline:auto}
        @media(max-width:850px){.heroGrid,.columns,.modeGrid,.premiumOptions,.detailsHead,.categoryGrid{grid-template-columns:1fr}.lotGrid{grid-template-columns:1fr}.lot{border-right:0;border-bottom:1px solid var(--line)}.lot:last-child{border-bottom:0}.activeLotBadge{top:14px;right:14px}.docs{grid-template-columns:1fr}.premiumOption{grid-template-columns:1fr}.premiumBadge{left:24px}.regNav img{height:58px}.regHero{min-height:auto;padding:64px 0 58px;background-position:60% center}.registrationPage .shell{width:min(100% - 30px,1180px)}.detailsHead{gap:18px}.regAccordion summary{grid-template-columns:58px minmax(0,1fr) 44px;min-height:68px}.accordionIcon svg{width:23px;height:23px}.accordionTitle{padding:11px 14px}.accordionTitle strong{font-size:16px;letter-spacing:.09em}.accordionTitle small{font-size:11px}.accordionBody{padding:20px 16px}.stageCompactGrid{grid-template-columns:1fr 1fr}.stageCompact:nth-child(2){border-right:0}.stageCompact:nth-child(-n+2){border-bottom:1px solid rgba(17,17,17,.17)}.categoryNote{grid-column:auto}}
        @media(max-width:520px){.stageCompactGrid{grid-template-columns:1fr}.stageCompact{min-height:0;border-right:0;border-bottom:1px solid rgba(17,17,17,.17)}.stageCompact:last-child{border-bottom:0}.scheduleItem{grid-template-columns:76px 1fr;gap:6px 14px}.scheduleItem span{grid-column:1/-1}.categoryRow{align-items:baseline}.detailsSection{padding-top:62px}.detailsHead h2{font-size:46px}}
      `}</style>

      <div className="shell regNav">
        <a className="back" href="/">← Voltar ao site</a>
        <img src="/legends-logo-official.png" alt="Legends Bike Race" />
      </div>

      <section className="regHero">
        <div className="shell heroGrid">
          <div>
            <p className="eyebrow">Inscrições · {launchConfig.eventDateShort}</p>
            <h1>Seu lugar na <em>travessia.</em></h1>
            <p className="heroLead">Quatro dias, quatro cidades e uma jornada de 370,3 km pela Serra Gaúcha. Escolha sua modalidade, confira as condições e prepare-se para viver a primeira Legends Bike Race.</p>
          </div>
          <aside className="launchCard">
            <p className="eyebrow">Lote 01</p>
            <strong>{launchConfig.lots[0].price}</strong>
            <small>{launchConfig.lots[0].period}</small>
            <a className="mainCta" href={registrationHref} aria-disabled={!launchConfig.registrationOpen}><span>{registrationLabel}</span><span>→</span></a>
          </aside>
        </div>
      </section>

      <section className="detailsSection" id="informacoes">
        <div className="shell">
          <div className="detailsHead">
            <div><p className="eyebrow">Informações completas</p><h2>Todas as informações<br /><em>para decidir.</em></h2></div>
            <p>Abra apenas o que precisa consultar. Data, vagas, lote atual, preço e acesso à inscrição permanecem sempre visíveis acima.</p>
          </div>

          <div className="regAccordions">
            <details name="registration-details" className="regAccordion">
              <summary>
                <span className="accordionIcon"><AccordionLeadIcon kind="values" /></span>
                <span className="accordionTitle"><strong>Valores e lotes</strong><small>Lote 01 · {launchConfig.lots[0].price} · 100 vagas</small></span>
                <span className="accordionToggle" aria-hidden="true"><AccordionToggleIcons /></span>
              </summary>
              <div className="accordionBody">
                <div className="lotGrid">{launchConfig.lots.map((lot,index)=><article className={`lot${index === launchConfig.activeLotIndex ? " activeLot" : ""}`} key={lot.name}>{index === launchConfig.activeLotIndex && <span className="activeLotBadge">Lote ativo</span>}<span>{lot.name}</span><strong>{lot.price}</strong><p>{lot.period}</p></article>)}</div>
              </div>
            </details>

            <details name="registration-details" className="regAccordion">
              <summary>
                <span className="accordionIcon"><AccordionLeadIcon kind="modalities" /></span>
                <span className="accordionTitle"><strong>Modalidades</strong><small>Gravel Race + Legends Experience</small></span>
                <span className="accordionToggle" aria-hidden="true"><AccordionToggleIcons /></span>
              </summary>
              <div className="accordionBody">
                <div className="modeGrid"><article className="mode dark"><span className="tag">Competição</span><h3>Gravel Race</h3><p>Para Gravel e Cyclocross sem assistência elétrica. Tempos, checkpoints, pontuação por etapa, classificação por categoria e ranking geral.</p></article><article className="mode"><span className="tag">Experiência</span><h3>Legends Experience</h3><p>Para Gravel, MTB e E-Bikes de pedal assistido. A mesma travessia, sem classificação competitiva ou premiação esportiva.</p></article></div>
              </div>
            </details>

            <details name="registration-details" className="regAccordion">
              <summary>
                <span className="accordionIcon"><AccordionLeadIcon kind="categories" /></span>
                <span className="accordionTitle"><strong>Categorias</strong><small>Masculino: 4 categorias · Feminino: 2 categorias</small></span>
                <span className="accordionToggle" aria-hidden="true"><AccordionToggleIcons /></span>
              </summary>
              <div className="accordionBody">
                <div className="categoryGrid">
                  <div className="categoryGroup"><h3>Masculino</h3>{categories.masculine.map(([name,age])=><div className="categoryRow" key={name}><strong>{name}</strong><span>{age}</span></div>)}</div>
                  <div className="categoryGroup"><h3>Feminino</h3>{categories.feminine.map(([name,age])=><div className="categoryRow" key={name}><strong>{name}</strong><span>{age}</span></div>)}</div>
                  <p className="categoryNote">Categorias válidas para a Legends Gravel Race. A idade considerada é a que o atleta completa em 2027. Mínimo de cinco atletas confirmados por categoria, conforme as regras de agrupamento do Regulamento Oficial.</p>
                </div>
              </div>
            </details>

            <details name="registration-details" className="regAccordion">
              <summary>
                <span className="accordionIcon"><AccordionLeadIcon kind="stages" /></span>
                <span className="accordionTitle"><strong>Etapas</strong><small>4 dias · 370,3 km · 6.302 m+ · Serra Gaúcha</small></span>
                <span className="accordionToggle" aria-hidden="true"><AccordionToggleIcons /></span>
              </summary>
              <div className="accordionBody">
                <div className="stageCompactGrid">{stages.map(stage=><a className="stageCompact" href={stage.href} key={stage.number}><span>{stage.number}</span><h3>{stage.route}</h3><p>{stage.stats}</p><b>Ver percurso →</b></a>)}</div>
              </div>
            </details>

            <details name="registration-details" className="regAccordion">
              <summary>
                <span className="accordionIcon"><AccordionLeadIcon kind="schedule" /></span>
                <span className="accordionTitle"><strong>Programação</strong><small>29 de abril a 2 de maio de 2027</small></span>
                <span className="accordionToggle" aria-hidden="true"><AccordionToggleIcons /></span>
              </summary>
              <div className="accordionBody">
                <div className="scheduleList">{schedule.map(([date,stage,route])=><div className="scheduleItem" key={date}><time>{date}</time><strong>{stage}</strong><span>{route}</span></div>)}</div>
                <p className="scheduleNote">Os horários oficiais de credenciamento, briefings, largadas, cortes e premiação serão publicados no Manual do Atleta e nas comunicações oficiais da organização.</p>
              </div>
            </details>

            <details name="registration-details" className="regAccordion">
              <summary>
                <span className="accordionIcon"><AccordionLeadIcon kind="included" /></span>
                <span className="accordionTitle"><strong>O que está incluído</strong><small>18 entregas da organização + itens de responsabilidade do atleta</small></span>
                <span className="accordionToggle" aria-hidden="true"><AccordionToggleIcons /></span>
              </summary>
              <div className="accordionBody">
                <div className="columns"><div><p className="eyebrow">Incluído</p><ul className="checkList">{included.map(item=><li key={item}>{item}</li>)}</ul></div><div><p className="eyebrow">Não incluído</p><ul className="checkList minus">{notIncluded.map(item=><li key={item}>{item}</li>)}</ul></div></div>
              </div>
            </details>

            <details name="registration-details" className="regAccordion">
              <summary>
                <span className="accordionIcon"><AccordionLeadIcon kind="premium" /></span>
                <span className="accordionTitle"><strong>Kit Premium</strong><small>Kit completo {launchConfig.premiumKitPrice} · camisa {launchConfig.cyclingJerseyOnlyPrice}</small></span>
                <span className="accordionToggle" aria-hidden="true"><AccordionToggleIcons /></span>
              </summary>
              <div className="accordionBody">
                <div className="premiumOptions"><article className="premiumOption featured"><span className="premiumBadge">Melhor opção</span><div><h3>Kit Premium</h3><p>O conjunto completo de ciclismo da Legends para quem quer levar a identidade da prova para cada quilômetro da jornada.</p><div className="premiumItems">{launchConfig.premiumKitItems.map(item=><span key={item}>{item}</span>)}</div></div><div className="price"><small>Kit completo</small>{launchConfig.premiumKitPrice}</div></article><article className="premiumOption"><div><h3>Camisa de ciclismo</h3><p>Camisa oficial de ciclismo Legends Bike Race, disponível também para compra individual.</p></div><div className="price"><small>Somente camisa</small>{launchConfig.cyclingJerseyOnlyPrice}</div></article></div>
              </div>
            </details>

            <details name="registration-details" className="regAccordion">
              <summary>
                <span className="accordionIcon"><AccordionLeadIcon kind="documents" /></span>
                <span className="accordionTitle"><strong>Regulamento e documentos</strong><small>Regulamento · documentação médica · manual do atleta</small></span>
                <span className="accordionToggle" aria-hidden="true"><AccordionToggleIcons /></span>
              </summary>
              <div className="accordionBody">
                <div className="docs"><article className="docCard"><span className="eyebrow">01</span><h3>Regulamento</h3><p>Regras esportivas, elegibilidade, categorias, segurança, penalidades, cancelamento e transferência.</p><a href="/regulamento">Consultar regulamento →</a></article><article className="docCard"><span className="eyebrow">02</span><h3>Documento médico</h3><p>Atestado médico e Declaração de Saúde são obrigatórios para liberação do participante.</p><a href="/documentos-medicos">Ver orientações →</a></article><article className="docCard"><span className="eyebrow">03</span><h3>Manual do atleta</h3><p>Logística, SPOT, bag, GPS, equipamentos, Race Engine e rotina das quatro etapas.</p><a href="/manual-do-atleta">Consultar manual →</a></article></div>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="section finalCta"><div className="shell"><p className="eyebrow">Legends Bike Race 2027</p><h2>Não é circuito.<br /><em>É travessia.</em></h2><p>{launchConfig.eventDateLabel} · {launchConfig.location}. As inscrições serão direcionadas à plataforma oficial Windfit quando a abertura for autorizada.</p><a className="mainCta" href={registrationHref} aria-disabled={!launchConfig.registrationOpen}><span>{registrationLabel}</span><span>→</span></a></div></section>
    </main>
  );
}
