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
  rideWithGpsId: number;
};

const stageProfiles: StageProfile[] = [
  { id: "stage-1", label: "Stage 01", eligibility: "Somente Ultimate", route: "Canela → São Francisco de Paula", stats: "111,9 km · 1.684 m+ · limite 10 h", distance: 111.908, distanceLabel: "111,9 km", ascent: 1683.9, ascentLabel: "1.684 m+", href: "/percursos/stage-1", rideWithGpsId: 56232690 },
  { id: "stage-2", label: "Stage 02", eligibility: "Somente Ultimate", route: "São Francisco de Paula → Gramado", stats: "89,9 km · 1.590 m+ · limite 9 h", distance: 89.9166, distanceLabel: "89,9 km", ascent: 1590.24, ascentLabel: "1.590 m+", href: "/percursos/stage-2", rideWithGpsId: 56232708 },
  { id: "stage-3", label: "Stage 03", eligibility: "Ultimate + Short", route: "Gramado → Nova Petrópolis", stats: "99,3 km · 1.522 m+ · limite 10 h", distance: 99.3242, distanceLabel: "99,3 km", ascent: 1521.95, ascentLabel: "1.522 m+", href: "/percursos/stage-3", rideWithGpsId: 56232721 },
  { id: "stage-4", label: "Stage 04", eligibility: "Ultimate + Short", route: "Nova Petrópolis → Canela", stats: "70,0 km · 1.576 m+ · limite 6 h", distance: 69.9754, distanceLabel: "70,0 km", ascent: 1576.22, ascentLabel: "1.576 m+", href: "/percursos/stage-4", rideWithGpsId: 56232745 },
];

type TechnicalProfile = { points: string; climbByPercent: number[] };

function buildTechnicalProfile(payload: unknown): TechnicalProfile | null {
  const route = payload as { distance?: number; track_points?: Array<{ d: number; e: number }> };
  const points = route.track_points?.filter((point) => Number.isFinite(point.d) && Number.isFinite(point.e)) ?? [];
  const distance = route.distance ?? 0;
  if (points.length < 2 || !distance) return null;

  const bucketCount = 180;
  const buckets = Array.from({ length: bucketCount }, () => [] as Array<{ d: number; e: number }>);
  let cumulative = 0;
  const rises: number[] = [0];

  points.forEach((point, index) => {
    if (index) cumulative += Math.max(0, point.e - points[index - 1].e);
    rises.push(cumulative);
    buckets[Math.min(bucketCount - 1, Math.floor((point.d / distance) * bucketCount))].push(point);
  });

  const envelope: Array<{ d: number; e: number }> = [points[0]];
  buckets.forEach((bucket) => {
    if (!bucket.length) return;
    const low = bucket.reduce((best, point) => point.e < best.e ? point : best);
    const high = bucket.reduce((best, point) => point.e > best.e ? point : best);
    envelope.push(...(low.d <= high.d ? [low, high] : [high, low]));
  });
  envelope.push(points[points.length - 1]);

  const ordered = envelope.filter((point, index, all) => index === 0 || point.d !== all[index - 1].d);
  const minElevation = Math.min(...points.map((point) => point.e));
  const maxElevation = Math.max(...points.map((point) => point.e));
  const elevationRange = Math.max(maxElevation - minElevation, 1);
  const chartPoints = ordered.map((point) => {
    const x = (point.d / distance) * 100;
    const y = 6 + ((maxElevation - point.e) / elevationRange) * 54;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  let pointIndex = 0;
  const climbByPercent = Array.from({ length: 101 }, (_, index) => {
    const targetDistance = distance * (index / 100);
    while (pointIndex < points.length - 1 && points[pointIndex + 1].d <= targetDistance) pointIndex += 1;
    return Math.round((rises[pointIndex] / Math.max(cumulative, 1)) * 10000);
  });

  return { points: chartPoints, climbByPercent };
}

function ElevationProfile({ stage, active }: { stage: StageProfile; active: boolean }) {
  const [progress, setProgress] = useState(0);
  const [profile, setProfile] = useState<TechnicalProfile | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setProfile(null);
    fetch(`https://ridewithgps.com/routes/${stage.rideWithGpsId}.json`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((payload) => { if (!controller.signal.aborted) setProfile(buildTechnicalProfile(payload)); })
      .catch(() => { if (!controller.signal.aborted) setProfile(null); });
    return () => controller.abort();
  }, [stage.rideWithGpsId]);

  useEffect(() => {
    if (!active) { setProgress(0); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setProgress(1); return; }
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

  const marker = progress * 100;
  const lowerMarker = Math.floor(marker);
  const markerFraction = marker - lowerMarker;
  const lowerClimb = profile?.climbByPercent[lowerMarker] ?? 0;
  const upperClimb = profile?.climbByPercent[Math.min(100, lowerMarker + 1)] ?? lowerClimb;
  const climbProgress = (lowerClimb + (upperClimb - lowerClimb) * markerFraction) / 10000;
  const currentKm = (stage.distance * progress).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const currentAscent = Math.round(stage.ascent * climbProgress).toLocaleString("pt-BR");

  return <div className={styles.elevationProfile} aria-label={`Perfil técnico animado da ${stage.label}`}>
    <div className={styles.profileVisual}>
      {profile ? <svg className={styles.profileGraph} viewBox="0 0 100 84" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`fill-${stage.id}`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#cf7d45" stopOpacity=".42" /><stop offset="1" stopColor="#cf7d45" stopOpacity=".04" /></linearGradient>
          <clipPath id={`clip-${stage.id}`}><rect width={progress * 100} height="84" /></clipPath>
        </defs>
        <polygon className={styles.profileFill} points={`${profile.points} 100,66 0,66`} fill={`url(#fill-${stage.id})`} clipPath={`url(#clip-${stage.id})`} />
        <polyline points={profile.points} className={styles.profileLine} clipPath={`url(#clip-${stage.id})`} />
      </svg> : <div className={styles.profileLoading} aria-hidden="true" />}
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
