"use client";

import { useEffect, useState } from "react";
import { launchConfig, type JourneyFormat } from "./lib/launch";
import styles from "./HomeRegistrationInfo.module.css";

const ultimateProgram = [
  {
    date: "28 ABR",
    stage: "Credenciamento",
    route: "Canela",
    events: [
      ["12h–18h", "Credenciamento, conferência documental e entrega dos kits"],
      ["18h30", "Briefing geral obrigatório"],
    ],
  },
  {
    date: "29 ABR",
    stage: "Stage 01",
    route: "Canela → São Francisco de Paula",
    events: [
      ["07h–07h30", "Entrega das bags"],
      ["07h30", "Briefing da etapa"],
      ["07h45", "Largada"],
      ["17h", "Resultados oficiais"],
      ["18h30", "Briefing pós-etapa"],
    ],
  },
  {
    date: "30 ABR",
    stage: "Stage 02",
    route: "São Francisco de Paula → Gramado",
    events: [
      ["07h–07h30", "Entrega das bags"],
      ["07h30", "Briefing da etapa"],
      ["07h45", "Largada"],
      ["17h", "Resultados oficiais"],
      ["18h30", "Briefing pós-etapa"],
    ],
  },
  {
    date: "01 MAI",
    stage: "Stage 03",
    route: "Gramado → Nova Petrópolis",
    events: [
      ["07h–07h30", "Entrega das bags"],
      ["07h30", "Briefing da etapa"],
      ["07h45", "Largada"],
      ["17h", "Resultados oficiais"],
      ["18h30", "Briefing pós-etapa"],
    ],
  },
  {
    date: "02 MAI",
    stage: "Stage 04",
    route: "Nova Petrópolis → Canela",
    events: [
      ["07h–07h30", "Entrega das bags"],
      ["07h30", "Briefing da etapa"],
      ["07h45", "Largada"],
      ["17h", "Resultados oficiais"],
      ["18h30", "Premiação geral e encerramento"],
    ],
  },
] as const;

const shortProgram = [
  {
    date: "30 ABR",
    stage: "Credenciamento Short",
    route: "Gramado",
    events: [["A confirmar", "Credenciamento, conferência documental e entrega dos kits"]],
  },
  {
    date: "01 MAI",
    stage: "Stage 03",
    route: "Gramado → Nova Petrópolis",
    events: [
      ["07h–07h30", "Entrega das bags"],
      ["07h30", "Briefing da etapa"],
      ["07h45", "Largada"],
      ["17h", "Resultados oficiais"],
      ["18h30", "Briefing pós-etapa"],
    ],
  },
  {
    date: "02 MAI",
    stage: "Stage 04",
    route: "Nova Petrópolis → Canela",
    events: [
      ["07h–07h30", "Entrega das bags"],
      ["07h30", "Briefing da etapa"],
      ["07h45", "Largada"],
      ["17h", "Resultados oficiais"],
      ["18h30", "Premiação geral e encerramento"],
    ],
  },
] as const;


type StageProfile = {
  id: string;
  label: string;
  eligibility: string;
  route: string;
  stats: string;
  distance: number;
  distanceLabel: string;
  ascent: number;
  ascentLabel: string;
  href: string;
  image: string;
  path: string;
};

const stageProfiles: StageProfile[] = [
  { id: "stage-1", label: "Stage 01", eligibility: "Somente Ultimate", route: "Canela → São Francisco de Paula", stats: "111,9 km · 1.684 m+ · limite 10 h", distance: 111.9, distanceLabel: "111,9 km", ascent: 1684, ascentLabel: "1.684 m+", href: "/percursos/stage-1", image: "/stage-1-profile-final.png", path: "M0 66 C4 61 7 71 11 63 S18 70 22 58 S29 64 34 50 S41 59 47 47 S54 52 60 38 S67 45 73 29 S80 37 86 25 S93 35 100 20" },
  { id: "stage-2", label: "Stage 02", eligibility: "Somente Ultimate", route: "São Francisco de Paula → Gramado", stats: "89,1 km · 1.520 m+ · limite 9 h", distance: 89.1, distanceLabel: "89,1 km", ascent: 1520, ascentLabel: "1.520 m+", href: "/percursos/stage-2", image: "/stage-2-profile-transparent.png", path: "M0 20 C5 28 8 42 13 46 S21 55 27 59 S38 63 45 68 S56 73 64 66 S73 72 81 68 S89 73 94 60 S98 39 100 25" },
  { id: "stage-3", label: "Stage 03", eligibility: "Ultimate + Short", route: "Gramado → Nova Petrópolis", stats: "99,3 km · 1.522 m+ · limite 10 h", distance: 99.3, distanceLabel: "99,3 km", ascent: 1522, ascentLabel: "1.522 m+", href: "/percursos/stage-3", image: "/stage-3-profile-transparent.png", path: "M0 24 C7 31 12 38 18 45 S31 53 39 60 S51 68 59 72 S70 77 80 76 S89 80 94 65 S98 38 100 22" },
  { id: "stage-4", label: "Stage 04", eligibility: "Ultimate + Short", route: "Nova Petrópolis → Canela", stats: "70 km · 1.576 m+ · limite 6 h", distance: 70, distanceLabel: "70 km", ascent: 1576, ascentLabel: "1.576 m+", href: "/percursos/stage-4", image: "/stage-4-profile-transparent.png", path: "M0 54 C5 35 10 58 15 41 S24 50 30 31 S39 60 47 48 S55 68 63 57 S72 63 80 40 S89 53 94 32 S98 44 100 25" },
];

function ElevationProfile({ stage, active }: { stage: StageProfile; active: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }

    let frame = 0;
    let startedAt = 0;
    const duration = 5400;
    const animate = (now: number) => {
      if (!startedAt) startedAt = now;
      const elapsed = Math.min((now - startedAt) / duration, 1);
      setProgress(1 - Math.pow(1 - elapsed, 3));
      if (elapsed < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  const currentKm = (stage.distance * progress).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const currentAscent = Math.round(stage.ascent * progress).toLocaleString("pt-BR");

  return <div className={styles.elevationProfile} aria-label={`Perfil animado da ${stage.label}`}>
    <div className={styles.profileVisual}>
      <svg className={styles.profileGraph} viewBox="0 0 100 84" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id={`fill-${stage.id}`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#cf7d45" stopOpacity=".42" /><stop offset="1" stopColor="#cf7d45" stopOpacity=".04" /></linearGradient><clipPath id={`clip-${stage.id}`}><rect width={progress * 100} height="84" /></clipPath></defs>
        <path d={`${stage.path} L100 82 L0 82 Z`} fill={`url(#fill-${stage.id})`} clipPath={`url(#clip-${stage.id})`} />
        <path d={stage.path} className={styles.profileLine} pathLength="100" style={{ strokeDasharray: 100, strokeDashoffset: 100 - progress * 100 }} />
      </svg>
      <p className={styles.profileReadout}><span><small>Distância</small><b>{currentKm} km</b></span><span><small>Elevação acumulada</small><b>{currentAscent} m+</b></span></p>
    </div>
  </div>;
}


function getRows(format: JourneyFormat, stagesOpen: boolean) {
  const journey = launchConfig.journeys[format];
  const activeLot = journey.lots[launchConfig.activeLotIndex];
  const visibleStages = format === "ultimate" ? stageProfiles : stageProfiles.slice(2);

  return [
    {
      label: "Valores e lotes",
      summary: `${activeLot.name} · ${activeLot.price} · ${journey.spots} vagas`,
      content: <div className={styles.lots}>{journey.lots.map((lot, index) => { const isActive = index === launchConfig.activeLotIndex; const lotContent = <><span>{isActive ? `Lote ativo · ${lot.name}` : lot.name}</span><strong>{lot.price}</strong><small>{lot.period}</small></>; return isActive ? <a className={styles.activeLot} href={launchConfig.registrationUrl} target="_blank" rel="noreferrer" key={lot.name} aria-label={`Inscrever-se na Windfit — ${lot.name}, ${lot.price}`}>{lotContent}</a> : <div key={lot.name}>{lotContent}</div>; })}</div>,
    },
    {
      label: "O que está incluído",
      summary: "18 entregas da organização",
      content: <div className={styles.included}><div><h3>Incluído</h3><ul><li>Participação nas etapas do formato escolhido</li><li>Camiseta casual, bag oficial de 50 L e cap oficial</li><li>Rastreador SPOT, placa oficial e medalha de conclusão</li><li>Transporte da bag entre as cidades-base</li><li>Hidratação, GPX oficial e checkpoints</li><li>Seguro básico, apoio, segurança e resgate</li><li>Bike wash, mecânica básica e briefings</li></ul></div><div><h3>Não incluído</h3><ul><li>Kit Premium Legends Bike Race</li><li>Hospedagem e refeições</li><li>Transporte do participante e da bicicleta</li><li>Passagens, combustível, pedágios e estacionamento</li><li>Equipamentos, peças e serviços particulares</li></ul></div></div>,
    },
    {
      label: "Kit Premium",
      summary: "Kit completo R$ 399 · camisa R$ 189",
      content: <div className={`${styles.cards} ${styles.premiumCards}`}><article><img className={styles.premiumImage} src="/kit-premium-lbr.webp" alt="Kit Premium Legends Bike Race com camisa, colete e dois pares de meias" /><div className={styles.premiumCopy}><span>Kit completo</span><strong>R$ 399</strong><p>Camisa de ciclismo, colete e dois pares de meias.</p></div></article><article><img className={styles.premiumImage} src="/camisa-ciclismo-lbr.webp" alt="Camisa de ciclismo Legends Bike Race vista de frente e de costas" /><div className={styles.premiumCopy}><span>Somente camisa</span><strong>R$ 189</strong><p>Camisa oficial de ciclismo Legends Bike Race.</p></div></article></div>,
    },
    {
      label: "Modalidades",
      summary: "Gravel Race + Legends Experience",
      content: <div className={styles.cards}><article><span>Competição</span><h3>Gravel Race</h3><p>Para Gravel e Cyclocross sem assistência elétrica, com tempo, checkpoints, pontuação e classificação.</p></article><article><span>Experiência</span><h3>Legends Experience</h3><p>Para Gravel, MTB e E-bikes de pedal assistido, sem ranking ou premiação esportiva.</p></article></div>,
    },
    {
      label: "Categorias",
      summary: "Masculino: 4 · Feminino: 2",
      content: <div className={styles.cards}><article><span>Masculino</span><p><b>Open</b> 18–29 anos<br /><b>Master A</b> 30–39 anos<br /><b>Master B</b> 40–49 anos<br /><b>Senior</b> 50 anos ou mais</p></article><article><span>Feminino</span><p><b>Feminino A</b> 18–40 anos<br /><b>Feminino B</b> 41 anos ou mais</p></article></div>,
    },
    {
      label: "Premiação",
      summary: `${journey.name.replace("Legends ", "")} · troféus do 1º ao ${journey.awardPlaces}º`,
      content: <p className={styles.copy}>Na {journey.name}, os {journey.awardPlaces} primeiros colocados de cada categoria da Gravel Race recebem troféu. A classificação é definida pelo somatório dos pontos das {journey.days} etapas. A Legends Experience não possui classificação competitiva ou premiação esportiva.</p>,
    },
    {
      label: "Etapas",
      summary: `${journey.days} dias · ${journey.distance} · ${journey.ascent}`,
      content: <div className={styles.stages}>{visibleStages.map((stage) => <a href={stage.href} key={stage.id}><div className={styles.stageCopy}><span>{stage.label} · {stage.eligibility}</span><b>{stage.route}</b></div><ElevationProfile stage={stage} active={stagesOpen} /></a>)}</div>,
    },
    {
      label: "Programação",
      summary: format === "ultimate" ? "28 ABR a 02 MAI · 2027" : "30 ABR a 02 MAI · 2027",
      content: <div className={styles.schedule}>{(format === "ultimate" ? ultimateProgram : shortProgram).map((day) => <article key={`${day.date}-${day.stage}`}><header><span>{day.date}</span><strong>{day.stage}</strong></header><p>{day.route}</p><ul>{day.events.map(([time, event]) => <li key={`${time}-${event}`}><time>{time}</time><span>{event}</span></li>)}</ul></article>)}</div>,
    },
    {
      label: "Regulamento e documentos",
      summary: "Regras · saúde · manual",
      content: <div className={styles.documents}><a href="/regulamento"><b>01</b><span>Regulamento</span><small>Formatos, categorias, segurança, penalidades e transferência.</small></a><a href="/documentos-medicos"><b>02</b><span>Documento médico</span><small>Atestado médico e Declaração de Saúde obrigatórios.</small></a><a href="/manual-do-atleta"><b>03</b><span>Manual do atleta</span><small>Logística e equipamentos perto do evento.</small></a></div>,
    },
    {
      label: "Hospedagens conveniadas",
      summary: journey.cities,
      content: <p className={styles.copy}>A rede de hospedagens está em cadastramento. Os hotéis serão selecionados com café da manhã antecipado, entrega das bags e check-in ajustado à rotina de cada etapa. A relação completa será publicada nos canais oficiais.</p>,
    },
  ];
}

export default function HomeRegistrationInfo() {
  const [format, setFormat] = useState<JourneyFormat>("ultimate");
  const [open, setOpen] = useState<number | null>(0);
  const journey = launchConfig.journeys[format];
  const activeLot = journey.lots[launchConfig.activeLotIndex];
  const rows = getRows(format, open === 6);

  function selectFormat(nextFormat: JourneyFormat) {
    setFormat(nextFormat);
    setOpen(0);
  }

  return <section className={styles.section} id="inscricoes">
    <div className={`wide ${styles.frame}`}>
      <div className={styles.head}><div><p className="kicker">Inscrições · informações completas</p><h2>Tudo para decidir.<br /><em>Sem procurar.</em></h2></div><p>Escolha a jornada e consulte valores, itens incluídos, categorias, programação e documentos sem sair da página inicial.</p></div>
      <div className={styles.highlight}>
        <div className={styles.formatPicker} aria-label="Escolha o formato da Legends">
          <button type="button" className={format === "ultimate" ? styles.selected : ""} aria-pressed={format === "ultimate"} onClick={() => selectFormat("ultimate")}><b>Ultimate</b><span>4 etapas</span></button>
          <button type="button" className={format === "short" ? styles.selected : ""} aria-pressed={format === "short"} onClick={() => selectFormat("short")}><b>Short</b><span>2 etapas</span></button>
        </div>
        <small>{journey.dateShort} · {journey.days} dias</small><b>{activeLot.price} <i>{activeLot.name}</i></b><a href={launchConfig.registrationUrl}>Me inscrever <em>→</em></a>
      </div>
      <div className={styles.content}><div className={styles.accordion}>{rows.map((row, index) => <details key={row.label} open={open === index} onToggle={(event) => { setOpen((event.currentTarget as HTMLDetailsElement).open ? index : null); }}><summary><b>{open === index ? "×" : "+"}</b><strong>{row.label}</strong><small>{row.summary}</small></summary><div className={styles.body}>{row.content}</div></details>)}</div></div>
    </div>
  </section>;
}
