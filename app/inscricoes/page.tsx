import type { Metadata } from "next";
import { getRegistrationHref, getRegistrationLabel, launchConfig } from "../lib/launch";

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

export default function InscricoesPage() {
  const registrationHref = getRegistrationHref();
  const registrationLabel = getRegistrationLabel();

  return (
    <main className="registrationPage">
      <style>{`
        .registrationPage{--paper:#f4f0db;--ink:#0b0d0c;--copper:#c67a3b;--line:rgba(198,122,59,.32);background:#080a09;color:#f1ece3;min-height:100vh}
        .registrationPage *{box-sizing:border-box}.registrationPage .shell{width:min(1180px,calc(100% - 48px));margin:auto}
        .regNav{height:94px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.1)}
        .regNav img{width:150px;height:auto}.back{font:600 13px 'Barlow Condensed';letter-spacing:.11em;text-transform:uppercase;color:#d8d1c8}
        .regHero{padding:92px 0 70px;background:radial-gradient(circle at 76% 22%,rgba(198,122,59,.18),transparent 35%),linear-gradient(180deg,#0a0c0b,#080a09)}
        .eyebrow{margin:0 0 18px;color:var(--copper);font:600 13px 'Barlow Condensed';letter-spacing:.2em;text-transform:uppercase}
        .regHero h1{margin:0;max-width:850px;font:700 clamp(58px,8vw,112px) 'Barlow Condensed';line-height:.86;text-transform:uppercase}.regHero h1 em{font-style:normal;color:var(--copper)}
        .heroMeta{display:flex;gap:16px;flex-wrap:wrap;margin-top:32px}.heroMeta span{border:1px solid var(--line);padding:11px 14px;font:600 13px 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase}
        .heroGrid{display:grid;grid-template-columns:1.3fr .7fr;gap:64px;align-items:end}.heroLead{font-size:18px;line-height:1.7;color:#acaea8;margin:25px 0 0;max-width:720px}
        .launchCard{border:1px solid var(--line);background:rgba(15,18,16,.88);padding:28px}.launchCard strong{display:block;font:700 43px 'Barlow Condensed';text-transform:uppercase}.launchCard small{display:block;color:#aaa79f;margin-top:4px}.mainCta{display:flex;justify-content:space-between;align-items:center;margin-top:22px;background:var(--copper);color:white;padding:17px 20px;font:700 15px 'Barlow Condensed';letter-spacing:.09em;text-transform:uppercase}.mainCta[aria-disabled="true"]{opacity:.6;pointer-events:none}
        .section{padding:90px 0;border-top:1px solid rgba(255,255,255,.08)}.section.light{background:var(--paper);color:var(--ink)}
        .section h2{font:700 clamp(44px,5vw,72px) 'Barlow Condensed';line-height:.9;text-transform:uppercase;margin:0 0 34px}.section h2 em{font-style:normal;color:var(--copper)}
        .lotGrid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);overflow:visible}.lot{position:relative;padding:28px;border-right:1px solid var(--line);transition:border-color .2s ease,background .2s ease}.lot:last-child{border:0}.lot>span:not(.activeLotBadge){color:var(--copper);font:600 13px 'Barlow Condensed';letter-spacing:.13em;text-transform:uppercase}.lot strong{display:block;font:700 48px 'Barlow Condensed';margin:22px 0 8px}.lot p{margin:0;color:#9ba097}.lot.activeLot{background:linear-gradient(180deg,rgba(198,122,59,.12),rgba(198,122,59,.035));box-shadow:inset 0 0 0 1px var(--copper)}.activeLotBadge{position:absolute;top:-17px;right:22px;display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 15px;background:var(--copper);color:#fff;font:700 11px 'Barlow Condensed';letter-spacing:.16em;text-transform:uppercase;box-shadow:0 7px 24px rgba(0,0,0,.26)}.activeLotBadge:before{content:'';width:6px;height:6px;margin-right:8px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.14)}
        .modeGrid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.mode{padding:34px;border:1px solid rgba(17,17,17,.18);background:#ede6d9}.mode.dark{background:#111411;color:#f1ece3;border-color:#111411}.mode h3{font:700 40px 'Barlow Condensed';text-transform:uppercase;margin:8px 0 15px}.mode p{line-height:1.65;color:#6f706c}.mode.dark p{color:#a8ada5}.mode .tag{color:var(--copper);font:600 12px 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase}
        .columns{display:grid;grid-template-columns:1fr 1fr;gap:50px}.checkList{list-style:none;padding:0;margin:0}.checkList li{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.11);color:#c4c6c1}.light .checkList li{border-color:rgba(17,17,17,.13);color:#3e403d}.checkList li:before{content:'✓';color:var(--copper);margin-right:10px}.minus li:before{content:'—'}
        .premium{display:grid;grid-template-columns:1fr auto;gap:45px;align-items:center;border:1px solid rgba(17,17,17,.17);padding:32px}.premium strong{font:700 44px 'Barlow Condensed'}.premium p{color:#676a65;line-height:1.6;margin:7px 0 0}.price{color:var(--copper);font:700 48px 'Barlow Condensed'}
        .docs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.docCard{border:1px solid var(--line);padding:26px}.docCard h3{font:700 29px 'Barlow Condensed';text-transform:uppercase;margin:10px 0}.docCard p{color:#a4aaa0;line-height:1.55}.docCard a{color:var(--copper);font:700 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.08em}
        .finalCta{text-align:center}.finalCta h2{max-width:880px;margin-inline:auto}.finalCta p{color:#a1a69e;max-width:690px;margin:0 auto 30px;line-height:1.65}.finalCta .mainCta{max-width:360px;margin-inline:auto}
        @media(max-width:850px){.heroGrid,.columns,.modeGrid{grid-template-columns:1fr}.lotGrid{grid-template-columns:1fr}.lot{border-right:0;border-bottom:1px solid var(--line)}.lot:last-child{border-bottom:0}.activeLotBadge{top:14px;right:14px}.docs{grid-template-columns:1fr}.premium{grid-template-columns:1fr}.regHero{padding-top:60px}.registrationPage .shell{width:min(100% - 30px,1180px)}}
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
            <div className="heroMeta"><span>100 vagas</span><span>370,3 km</span><span>6.302 m+</span><span>4 etapas</span></div>
          </div>
          <aside className="launchCard">
            <p className="eyebrow">Lote 01</p>
            <strong>{launchConfig.lots[0].price}</strong>
            <small>{launchConfig.lots[0].period}</small>
            <a className="mainCta" href={registrationHref} aria-disabled={!launchConfig.registrationOpen}><span>{registrationLabel}</span><span>→</span></a>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="shell"><p className="eyebrow">Valores</p><h2>Três lotes.<br /><em>100 lugares.</em></h2><div className="lotGrid">{launchConfig.lots.map((lot,index)=><article className={`lot${index === launchConfig.activeLotIndex ? " activeLot" : ""}`} key={lot.name}>{index === launchConfig.activeLotIndex && <span className="activeLotBadge">Lote ativo</span>}<span>{lot.name}</span><strong>{lot.price}</strong><p>{lot.period}</p></article>)}</div></div>
      </section>

      <section className="section light">
        <div className="shell"><p className="eyebrow">Modalidades</p><h2>Duas formas de<br /><em>viver a Legends.</em></h2><div className="modeGrid"><article className="mode dark"><span className="tag">Competição</span><h3>Gravel Race</h3><p>Para Gravel e Cyclocross sem assistência elétrica. Tempos, checkpoints, pontuação por etapa, classificação por categoria e ranking geral.</p></article><article className="mode"><span className="tag">Experiência</span><h3>Legends Experience</h3><p>Para Gravel, MTB e E-Bikes de pedal assistido. A mesma travessia, sem classificação competitiva ou premiação esportiva.</p></article></div></div>
      </section>

      <section className="section">
        <div className="shell columns"><div><p className="eyebrow">Incluído</p><h2>Você pedala.<br /><em>A estrutura acompanha.</em></h2><ul className="checkList">{included.map(item=><li key={item}>{item}</li>)}</ul></div><div><p className="eyebrow">Não incluído</p><h2>Planeje sua<br /><em>jornada completa.</em></h2><ul className="checkList minus">{notIncluded.map(item=><li key={item}>{item}</li>)}</ul></div></div>
      </section>

      <section className="section light">
        <div className="shell"><p className="eyebrow">Opcional</p><h2>Kit <em>Premium.</em></h2><div className="premium"><div><strong>Um upgrade da experiência.</strong><p>Produto opcional vendido separadamente. Conteúdo, tamanhos, prazos e condições serão apresentados no momento da comercialização.</p></div><div className="price">{launchConfig.premiumKitPrice}</div></div></div>
      </section>

      <section className="section">
        <div className="shell"><p className="eyebrow">Antes de confirmar</p><h2>Leia. Entenda.<br /><em>Prepare-se.</em></h2><div className="docs"><article className="docCard"><span className="eyebrow">01</span><h3>Regulamento</h3><p>Regras esportivas, elegibilidade, categorias, segurança, penalidades, cancelamento e transferência.</p><a href="/regulamento">Consultar regulamento →</a></article><article className="docCard"><span className="eyebrow">02</span><h3>Documento médico</h3><p>Atestado médico e Declaração de Saúde são obrigatórios para liberação do participante.</p><a href="/documentos-medicos">Ver orientações →</a></article><article className="docCard"><span className="eyebrow">03</span><h3>Manual do atleta</h3><p>Logística, SPOT, bag, GPS, equipamentos, Race Engine e rotina das quatro etapas.</p><a href="/manual-do-atleta">Consultar manual →</a></article></div></div>
      </section>

      <section className="section finalCta"><div className="shell"><p className="eyebrow">Legends Bike Race 2027</p><h2>Não é circuito.<br /><em>É travessia.</em></h2><p>{launchConfig.eventDateLabel} · {launchConfig.location}. As inscrições serão direcionadas à plataforma oficial Windfit quando a abertura for autorizada.</p><a className="mainCta" href={registrationHref} aria-disabled={!launchConfig.registrationOpen}><span>{registrationLabel}</span><span>→</span></a></div></section>
    </main>
  );
}
