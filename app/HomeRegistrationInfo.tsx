"use client";

import { useEffect, useState } from "react";
import { launchConfig, type JourneyFormat } from "./lib/launch";
import { getHomeCopy } from "./i18n/home";
import type { Locale } from "./i18n/config";
import styles from "./HomeRegistrationInfo.module.css";
import modeStyles from "./RegistrationModes.module.css";

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


const journeySteps = [
  ["01", "Largue", "Com o GPX oficial, sua estratégia de hidratação, alimentação e equipamento."],
  ["02", "Pedale", "Siga a rota por GPS e complete os checkpoints previstos para a etapa."],
  ["03", "Chegue", "Ao final da etapa, sua atividade é validada e você entra na nova cidade-base."],
  ["04", "Recupere", "Sua bag oficial é transportada pela organização. Bike Wash e mecânica básica ajudam na preparação."],
  ["05", "Repita", "No dia seguinte, uma nova etapa, uma nova cidade e mais um capítulo da travessia."],
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

const packedTechnicalProfiles: Record<number, string> = {"56232690":"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","56232708":"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","56232721":"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","56232745":"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"};

export function getPackedTechnicalProfiles() {
  return packedTechnicalProfiles;
}

type PackedTechnicalProfile = { d: number; g: number; p: Array<[number, number, number]> };
type TechnicalProfile = { points: string; climbByPercent: number[] };

async function unpackTechnicalProfile(encoded: string): Promise<PackedTechnicalProfile> {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as PackedTechnicalProfile;
}

function buildTechnicalProfile(payload: PackedTechnicalProfile): TechnicalProfile | null {
  if (payload.p.length < 2 || !payload.d) return null;
  const elevations = payload.p.map((point) => point[1] / 10);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationRange = Math.max(maxElevation - minElevation, 1);
  const chartPoints = payload.p.map(([distance, elevation]) => {
    const x = distance / 100;
    const y = 6 + ((maxElevation - elevation / 10) / elevationRange) * 54;
    return x.toFixed(2) + "," + y.toFixed(2);
  }).join(" ");

  let pointIndex = 0;
  const climbByPercent = Array.from({ length: 101 }, (_, index) => {
    const target = index * 100;
    while (pointIndex < payload.p.length - 1 && payload.p[pointIndex + 1][0] <= target) pointIndex += 1;
    const current = payload.p[pointIndex];
    const next = payload.p[Math.min(payload.p.length - 1, pointIndex + 1)];
    const fraction = next[0] === current[0] ? 0 : Math.max(0, Math.min(1, (target - current[0]) / (next[0] - current[0])));
    return Math.round(current[2] + (next[2] - current[2]) * fraction);
  });

  return { points: chartPoints, climbByPercent };
}

function ElevationProfile({ stage, active, locale }: { stage: StageProfile; active: boolean; locale: Locale }) {
  const [progress, setProgress] = useState(0);
  const [profile, setProfile] = useState<TechnicalProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    const packed = packedTechnicalProfiles[stage.rideWithGpsId];
    if (!packed) { setProfile(null); return; }
    void unpackTechnicalProfile(packed)
      .then(buildTechnicalProfile)
      .then((next) => { if (!cancelled) setProfile(next); })
      .catch(() => { if (!cancelled) setProfile(null); });
    return () => { cancelled = true; };
  }, [stage.rideWithGpsId]);

  useEffect(() => {
    if (!active) { setProgress(0); return; }
    if (window.matchMedia("prefers-reduced-motion: reduce").matches) { setProgress(1); return; }
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
  const numberLocale = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  const currentKm = (stage.distance * progress).toLocaleString(numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const currentAscent = Math.round(stage.ascent * climbProgress).toLocaleString(numberLocale);
  const labels = locale === "pt" ? { technical: "Perfil técnico animado da", distance: "Distância", elevation: "Elevação acumulada" } : locale === "es" ? { technical: "Perfil técnico animado de", distance: "Distancia", elevation: "Desnivel acumulado" } : { technical: "Animated technical profile of", distance: "Distance", elevation: "Elevation gain" };

  return <div className={styles.elevationProfile} aria-label={labels.technical + " " + stage.label}>
    <div className={styles.profileVisual}>
      {profile ? <svg className={styles.profileGraph} viewBox="0 0 100 84" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={"fill-" + stage.id} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#cf7d45" stopOpacity=".42" /><stop offset="1" stopColor="#cf7d45" stopOpacity=".04" /></linearGradient>
          <clipPath id={"clip-" + stage.id}><rect width={progress * 100} height="84" /></clipPath>
        </defs>
        <polygon className={styles.profileFill} points={profile.points + " 100,66 0,66"} fill={"url(#fill-" + stage.id + ")"} clipPath={"url(#clip-" + stage.id + ")"} />
        <polyline points={profile.points} className={styles.profileLine} clipPath={"url(#clip-" + stage.id + ")"} />
      </svg> : <div className={styles.profileLoading} aria-hidden="true" />}
      <p className={styles.profileReadout}><span><small>{labels.distance}</small><b>{currentKm} km</b></span><span><small>{labels.elevation}</small><b>{currentAscent} m+</b></span></p>
    </div>
  </div>;
}

const registrationCopy: Record<Locale, {
  kicker: string; titleLead: string; titleAccent: string; introduction: string; formatAria: string; days: string; stages: string; register: string;
  values: string; activeLot: string; spots: string; included: string; includedSummary: string; provided: string; excluded: string; premium: string; premiumSummary: string;
  premiumFull: string; premiumOnly: string; premiumFullText: string; premiumOnlyText: string; categories: string; male: string; female: string; years: string; award: string;
  journey: string; journeySummary: string; safety: string; schedule: string; documents: string; hotels: string; rules: string; medical: string; manual: string;
}> = {
  pt: { kicker: "Inscrições · informações completas", titleLead: "Tudo para decidir.", titleAccent: "Sem procurar.", introduction: "Escolha a jornada e consulte valores, itens incluídos, categorias, programação e documentos sem sair da página inicial.", formatAria: "Escolha o formato da Legends", days: "dias", stages: "etapas", register: "Me inscrever", values: "Valores e lotes", activeLot: "Lote ativo", spots: "vagas", included: "O que está incluído", includedSummary: "18 entregas da organização", provided: "Incluído", excluded: "Não incluído", premium: "Kit Premium", premiumSummary: "Kit completo R$ 399 · camisa R$ 189", premiumFull: "Kit completo", premiumOnly: "Somente camisa", premiumFullText: "Camisa de ciclismo, colete e dois pares de meias.", premiumOnlyText: "Camisa oficial de ciclismo Legends Bike Race.", categories: "Categorias", male: "Masculino", female: "Feminino", years: "anos", award: "Premiação", journey: "Como funciona a jornada", journeySummary: "5 passos essenciais", safety: "Segurança e suporte", schedule: "Programação", documents: "Regulamento e documentos", hotels: "Hospedagens conveniadas", rules: "Regras · saúde · manual", medical: "Documento médico", manual: "Manual do atleta" },
  es: { kicker: "Inscripciones · información completa", titleLead: "Todo para decidir.", titleAccent: "Sin buscar.", introduction: "Elige tu travesía y consulta valores, elementos incluidos, categorías, programación y documentos sin salir de la página principal.", formatAria: "Elige el formato Legends", days: "días", stages: "etapas", register: "Inscribirme", values: "Valores y lotes", activeLot: "Lote activo", spots: "plazas", included: "Qué está incluido", includedSummary: "18 entregas de la organización", provided: "Incluido", excluded: "No incluido", premium: "Kit Premium", premiumSummary: "Kit completo R$ 399 · camiseta R$ 189", premiumFull: "Kit completo", premiumOnly: "Solo camiseta", premiumFullText: "Camiseta de ciclismo, chaleco y dos pares de medias.", premiumOnlyText: "Camiseta oficial de ciclismo Legends Bike Race.", categories: "Categorías", male: "Masculino", female: "Femenino", years: "años", award: "Premiación", journey: "Cómo funciona la travesía", journeySummary: "5 pasos esenciales", safety: "Seguridad y soporte", schedule: "Programación", documents: "Reglamento y documentos", hotels: "Alojamientos asociados", rules: "Reglas · salud · manual", medical: "Documento médico", manual: "Manual del ciclista" },
  en: { kicker: "Registration · complete information", titleLead: "Everything to decide.", titleAccent: "Without searching.", introduction: "Choose your journey and view pricing, included items, categories, schedule and documents without leaving the homepage.", formatAria: "Choose the Legends format", days: "days", stages: "stages", register: "Register", values: "Pricing and lots", activeLot: "Active lot", spots: "spots", included: "What's included", includedSummary: "18 organizer deliverables", provided: "Included", excluded: "Not included", premium: "Premium Kit", premiumSummary: "Complete kit R$ 399 · jersey R$ 189", premiumFull: "Complete kit", premiumOnly: "Jersey only", premiumFullText: "Cycling jersey, vest and two pairs of socks.", premiumOnlyText: "Official Legends Bike Race cycling jersey.", categories: "Categories", male: "Men", female: "Women", years: "years", award: "Awards", journey: "How the journey works", journeySummary: "5 essential steps", safety: "Safety and support", schedule: "Schedule", documents: "Rules and documents", hotels: "Partner accommodations", rules: "Rules · health · manual", medical: "Medical document", manual: "Athlete guide" },
};

function localizeProgramText(value: string, locale: Locale) {
  if (locale === "pt") return value;
  const translations: Record<Exclude<Locale, "pt">, Record<string, string>> = {
    es: {
      "Credenciamento": "Acreditación", "Credenciamento Short": "Acreditación Short", "Entrega das bags": "Entrega de bags", "Briefing da etapa": "Briefing de etapa", "Largada": "Salida", "Resultados oficiais": "Resultados oficiales", "Briefing pós-etapa": "Briefing postetapa", "Premiação geral e encerramento": "Premiación general y cierre", "Credenciamento, conferência documental e entrega dos kits": "Acreditación, control documental y entrega de kits"
    },
    en: {
      "Credenciamento": "Check-in", "Credenciamento Short": "Short check-in", "Entrega das bags": "Bag drop-off", "Briefing da etapa": "Stage briefing", "Largada": "Start", "Resultados oficiais": "Official results", "Briefing pós-etapa": "Post-stage briefing", "Premiação geral e encerramento": "Overall awards and closing", "Credenciamento, conferência documental e entrega dos kits": "Check-in, document review and kit collection"
    },
  };
  return translations[locale][value] ?? value;
}

function getRows(format: JourneyFormat, stagesOpen: boolean, locale: Locale) {
  const journey = launchConfig.journeys[format];
  const activeLot = journey.lots[launchConfig.activeLotIndex];
  const t = getHomeCopy(locale);
  const c = registrationCopy[locale];
  const program = (format === "ultimate" ? ultimateProgram : shortProgram).map((day) => ({ ...day, stage: localizeProgramText(day.stage, locale), events: day.events.map(([time, event]) => [time, localizeProgramText(event, locale)] as const) }));
  const visibleStages = (format === "ultimate" ? stageProfiles : stageProfiles.slice(2)).map((stage, index) => ({ ...stage, eligibility: stage.eligibility.includes("Somente") ? t.routes.ultimateOnly : t.routes.shared, label: `Stage ${String(index + (format === "ultimate" ? 1 : 3)).padStart(2, "0")}` }));

  return [
    {
      label: c.values,
      summary: `${activeLot.name} · ${activeLot.price} · ${journey.spots} ${c.spots}`,
      content: <div className={styles.lots}>{journey.lots.map((lot, index) => { const isActive = index === launchConfig.activeLotIndex; const lotContent = <><span>{isActive ? `${c.activeLot} · ${lot.name}` : lot.name}</span><strong>{lot.price}</strong><small>{lot.period}</small></>; return isActive ? <a className={styles.activeLot} href={launchConfig.registrationUrl} target="_blank" rel="noreferrer" key={lot.name} aria-label={`${c.register} — ${lot.name}, ${lot.price}`}>{lotContent}</a> : <div key={lot.name}>{lotContent}</div>; })}</div>,
    },
    {
      label: c.included,
      summary: c.includedSummary,
      content: <div className={styles.included}><div><h3>{c.provided}</h3><ul><li>{locale === "pt" ? "Participação nas etapas do formato escolhido" : locale === "es" ? "Participación en las etapas del formato elegido" : "Participation in the stages of the selected format"}</li><li>{t.launch.products.join(", ")}</li><li>SPOT, GPX, checkpoints e medalha de conclusão</li><li>{locale === "pt" ? "Transporte da bag entre as cidades-base" : locale === "es" ? "Transporte de la bag entre ciudades base" : "Bag transport between host cities"}</li><li>{t.launch.services.slice(0, 4).join(", ")}</li><li>{t.launch.services.slice(4).join(", ")}</li></ul></div><div><h3>{c.excluded}</h3><ul><li>Kit Premium Legends Bike Race</li><li>{locale === "pt" ? "Hospedagem e refeições" : locale === "es" ? "Alojamiento y comidas" : "Accommodation and meals"}</li><li>{locale === "pt" ? "Transporte do participante e da bicicleta" : locale === "es" ? "Transporte del participante y de la bicicleta" : "Participant and bike transport"}</li><li>{locale === "pt" ? "Passagens, combustível, pedágios e estacionamento" : locale === "es" ? "Pasajes, combustible, peajes y estacionamiento" : "Tickets, fuel, tolls and parking"}</li><li>{locale === "pt" ? "Equipamentos, peças e serviços particulares" : locale === "es" ? "Equipos, repuestos y servicios particulares" : "Equipment, parts and private services"}</li></ul></div></div>,
    },
    {
      label: c.premium,
      summary: c.premiumSummary,
      content: <div className={`${styles.cards} ${styles.premiumCards}`}><article><img className={styles.premiumImage} src="/kit-premium-lbr.webp" alt="Legends Bike Race Premium Kit" /><div className={styles.premiumCopy}><span>{c.premiumFull}</span><strong>R$ 399</strong><p>{c.premiumFullText}</p></div></article><article><img className={styles.premiumImage} src="/camisa-ciclismo-lbr.webp" alt="Legends Bike Race cycling jersey" /><div className={styles.premiumCopy}><span>{c.premiumOnly}</span><strong>R$ 189</strong><p>{c.premiumOnlyText}</p></div></article></div>,
    },
    {
      label: t.modes.navigation,
      summary: "Gravel Race + Legends Experience",
      content: <div className={`${styles.cards} ${modeStyles.modeCards}`}><article><span>{t.modes.raceTag}</span><h3>Legends Gravel Race</h3><p>{t.modes.raceDescription}</p><ul>{t.modes.raceItems.map((item) => <li key={item}>{item}</li>)}</ul></article><article><span>{t.modes.experienceTag}</span><h3>Legends Experience</h3><p>{t.modes.experienceDescription}</p><ul>{t.modes.experienceItems.map((item) => <li key={item}>{item}</li>)}</ul></article></div>,
    },
    {
      label: c.categories,
      summary: `${c.male}: 4 · ${c.female}: 2`,
      content: <div className={styles.cards}><article><span>{c.male}</span><p><b>Open</b> 18–29 {c.years}<br /><b>Master A</b> 30–39 {c.years}<br /><b>Master B</b> 40–49 {c.years}<br /><b>Senior</b> 50 {locale === "pt" ? "anos ou mais" : locale === "es" ? "años o más" : "years or older"}</p></article><article><span>{c.female}</span><p><b>{c.female} A</b> 18–40 {c.years}<br /><b>{c.female} B</b> 41 {locale === "pt" ? "anos ou mais" : locale === "es" ? "años o más" : "years or older"}</p></article></div>,
    },
    {
      label: c.award,
      summary: `${journey.name.replace("Legends ", "")} · ${locale === "pt" ? `troféus do 1º ao ${journey.awardPlaces}º` : locale === "es" ? `trofeos del 1.º al ${journey.awardPlaces}.º` : `trophies from 1st to ${journey.awardPlaces}th`}`,
      content: <p className={styles.copy}>{locale === "pt" ? `Na ${journey.name}, os ${journey.awardPlaces} primeiros colocados de cada categoria da Gravel Race recebem troféu. A classificação é definida pelo somatório dos pontos das ${journey.days} etapas. A Legends Experience não possui classificação competitiva ou premiação esportiva.` : locale === "es" ? `En ${journey.name}, los ${journey.awardPlaces} primeros de cada categoría de Gravel Race reciben trofeo. La clasificación se define por la suma de puntos de las ${journey.days} etapas. Legends Experience no tiene clasificación competitiva ni premiación deportiva.` : `In ${journey.name}, the top ${journey.awardPlaces} riders in each Gravel Race category receive a trophy. Rankings are based on the total points from the ${journey.days} stages. Legends Experience has no competitive ranking or sporting awards.`}</p>,
    },
    {
      label: t.navigation.routes,
      summary: `${journey.days} ${c.days} · ${journey.distance} · ${journey.ascent}`,
      content: <div className={styles.stages}>{visibleStages.map((stage) => <a href={stage.href} key={stage.id}><div className={styles.stageCopy}><span>{stage.label} · {stage.eligibility}</span><b>{stage.route}</b></div><ElevationProfile stage={stage} active={stagesOpen} locale={locale} /></a>)}</div>,
    },
    {
      label: c.journey,
      summary: c.journeySummary,
      content: <div className={styles.journey}><div className={styles.journeyIntro}><h3>{t.launch.journeyTitleLead}<br /><em>{t.launch.journeyTitleAccent}</em></h3><p>{t.launch.journeyDescription}</p></div><div className={styles.journeySteps}>{t.launch.steps.map(([number, title, description]) => <article key={number}><b>{number}</b><div><h3>{title}</h3><p>{description}</p></div></article>)}</div><div className={styles.journeyNote}><strong>{t.launch.beforeTitle}</strong><p>{t.launch.beforeText}</p></div></div>,
    },
    {
      label: c.safety,
      summary: "SPOT · Starlink · Rescue",
      content: <div className={styles.safetyGrid}>{t.safety.items.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div>,
    },
    {
      label: c.schedule,
      summary: format === "ultimate" ? "28 APR — 02 MAY · 2027" : "30 APR — 02 MAY · 2027",
      content: <div className={styles.schedule}>{program.map((day) => <article key={`${day.date}-${day.stage}`}><header><span>{day.date}</span><strong>{day.stage}</strong></header><p>{day.route}</p><ul>{day.events.map(([time, event]) => <li key={`${time}-${event}`}><time>{time}</time><span>{event}</span></li>)}</ul></article>)}</div>,
    },
    {
      label: c.documents,
      summary: c.rules,
      content: <div className={styles.documents}><a href="/regulamento"><b>01</b><span>{locale === "pt" ? "Regulamento" : locale === "es" ? "Reglamento" : "Regulations"}</span><small>{locale === "pt" ? "Formatos, categorias, segurança, penalidades e transferência." : locale === "es" ? "Formatos, categorías, seguridad, penalizaciones y transferencias." : "Formats, categories, safety, penalties and transfers."}</small></a><a href="/documentos-medicos"><b>02</b><span>{c.medical}</span><small>{locale === "pt" ? "Atestado médico e Declaração de Saúde obrigatórios." : locale === "es" ? "Certificado médico y Declaración de Salud obligatorios." : "Medical certificate and Health Declaration are mandatory."}</small></a><a href="/manual-do-atleta"><b>03</b><span>{c.manual}</span><small>{locale === "pt" ? "Logística e equipamentos perto do evento." : locale === "es" ? "Logística y equipamiento cerca del evento." : "Logistics and equipment close to the event."}</small></a></div>,
    },
    {
      label: c.hotels,
      summary: journey.cities,
      content: <p className={styles.copy}>{locale === "pt" ? "A rede de hospedagens está em cadastramento. Os hotéis serão selecionados com café da manhã antecipado, entrega das bags e check-in ajustado à rotina de cada etapa. A relação completa será publicada nos canais oficiais." : locale === "es" ? "La red de alojamientos está en registro. Los hoteles serán seleccionados con desayuno temprano, entrega de bags y check-in adaptado a la rutina de cada etapa. La lista completa se publicará en los canales oficiales." : "The accommodation network is being registered. Hotels will be selected with early breakfast, bag delivery and check-in adapted to each stage. The complete list will be published through official channels."}</p>,
    },
  ];
}

export default function HomeRegistrationInfo({ locale = "pt" }: { locale?: Locale }) {
  const [format, setFormat] = useState<JourneyFormat>("ultimate");
  const [open, setOpen] = useState<number | null>(0);
  const journey = launchConfig.journeys[format];
  const activeLot = journey.lots[launchConfig.activeLotIndex];
  const rows = getRows(format, open === 6, locale);
  const c = registrationCopy[locale];

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#percursos") setOpen(6);
      if (window.location.hash === "#modalidades") setOpen(3);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  function selectFormat(nextFormat: JourneyFormat) {
    setFormat(nextFormat);
    setOpen(0);
  }

  return <section className={styles.section} id="inscricoes">
    <div className={`wide ${styles.frame}`}>
      <div className={styles.head}><div><p className="kicker">{c.kicker}</p><h2>{c.titleLead}<br /><em>{c.titleAccent}</em></h2></div><p>{c.introduction}</p></div>
      <div className={styles.highlight}>
        <div className={styles.formatPicker} aria-label={c.formatAria}>
          <button type="button" className={format === "ultimate" ? styles.selected : ""} aria-pressed={format === "ultimate"} onClick={() => selectFormat("ultimate")}><b>Ultimate</b><span>4 {c.stages}</span></button>
          <button type="button" className={format === "short" ? styles.selected : ""} aria-pressed={format === "short"} onClick={() => selectFormat("short")}><b>Short</b><span>2 {c.stages}</span></button>
        </div>
        <small>{journey.dateShort} · {journey.days} {c.days}</small><b>{activeLot.price} <i>{activeLot.name}</i></b><a href={launchConfig.registrationUrl}>{c.register} <em>→</em></a>
      </div>
      <div className={styles.content}><div className={styles.accordion}>{rows.map((row, index) => <details id={index === 6 ? "percursos" : index === 3 ? "modalidades" : undefined} key={row.label} open={open === index} onToggle={(event) => { setOpen((event.currentTarget as HTMLDetailsElement).open ? index : null); }}><summary><b>{open === index ? "×" : "+"}</b><strong>{row.label}</strong><small>{row.summary}</small></summary><div className={styles.body}>{row.content}</div></details>)}</div></div>
    </div>
  </section>;
}
