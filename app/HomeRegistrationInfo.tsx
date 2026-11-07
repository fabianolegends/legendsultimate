"use client";

import { useState } from "react";
import { launchConfig, type JourneyFormat } from "./lib/launch";
import styles from "./HomeRegistrationInfo.module.css";

function getRows(format: JourneyFormat) {
  const journey = launchConfig.journeys[format];
  const activeLot = journey.lots[launchConfig.activeLotIndex];

  return [
    {
      label: "Valores e lotes",
      summary: `${activeLot.name} · ${activeLot.price} · ${journey.spots} vagas`,
      content: <div className={styles.lots}>{journey.lots.map((lot, index) => <div className={index === launchConfig.activeLotIndex ? styles.activeLot : ""} key={lot.name}><span>{index === launchConfig.activeLotIndex ? `Lote ativo · ${lot.name}` : lot.name}</span><strong>{lot.price}</strong><small>{lot.period}</small></div>)}</div>,
    },
    {
      label: "O que está incluído",
      summary: "18 entregas da organização",
      content: <div className={styles.included}><div><h3>Incluído</h3><ul><li>Participação nas etapas do formato escolhido</li><li>Camiseta casual, bag oficial de 50 L e cap oficial</li><li>Rastreador SPOT, placa oficial e medalha de conclusão</li><li>Transporte da bag entre as cidades-base</li><li>Hidratação, GPX oficial e checkpoints</li><li>Seguro básico, apoio, segurança e resgate</li><li>Bike wash, mecânica básica e briefings</li></ul></div><div><h3>Não incluído</h3><ul><li>Kit Premium Legends Bike Race</li><li>Hospedagem e refeições</li><li>Transporte do participante e da bicicleta</li><li>Passagens, combustível, pedágios e estacionamento</li><li>Equipamentos, peças e serviços particulares</li></ul></div></div>,
    },
    {
      label: "Kit Premium",
      summary: "Kit completo R$ 399 · camisa R$ 189",
      content: <div className={styles.cards}><article><span>Kit completo</span><strong>R$ 399</strong><p>Camisa de ciclismo, colete e dois pares de meias.</p></article><article><span>Somente camisa</span><strong>R$ 189</strong><p>Camisa oficial de ciclismo Legends Bike Race.</p></article></div>,
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
      content: <div className={styles.stages}>{format === "ultimate" ? <><a href="/percursos/stage-1"><span>Stage 01 · somente Ultimate</span><b>Canela → São Francisco de Paula</b><small>111,9 km · 1.684 m+ · limite 10 h</small></a><a href="/percursos/stage-2"><span>Stage 02 · somente Ultimate</span><b>São Francisco de Paula → Gramado</b><small>89,1 km · 1.520 m+ · limite 9 h</small></a></> : null}<a href="/percursos/stage-3"><span>Stage 03 · Ultimate + Short</span><b>Gramado → Nova Petrópolis</b><small>99,3 km · 1.522 m+ · limite 10 h</small></a><a href="/percursos/stage-4"><span>Stage 04 · Ultimate + Short</span><b>Nova Petrópolis → Canela</b><small>70 km · 1.576 m+ · limite 6 h</small></a></div>,
    },
    {
      label: "Programação",
      summary: format === "ultimate" ? "29 ABR a 02 MAI · 2027" : "01 — 02 MAI · 2027",
      content: <div className={styles.schedule}>{format === "ultimate" ? <><p><b>28 ABR · Canela</b> Credenciamento, conferência documental, entrega de kits e briefing geral obrigatório.</p><p><b>29 ABR · Stage 01</b> Canela → São Francisco de Paula.</p><p><b>30 ABR · Stage 02</b> São Francisco de Paula → Gramado.</p></> : null}<p><b>01 MAI · Stage 03</b> Gramado → Nova Petrópolis.</p><p><b>02 MAI · Stage 04</b> Nova Petrópolis → Canela, premiação geral e encerramento.</p></div>,
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
  const rows = getRows(format);

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
      <div className={styles.content}><aside><span>Leia no seu ritmo</span><p>As informações da página de inscrições agora fazem parte da home. Abra somente o que interessa antes de decidir.</p></aside><div className={styles.accordion}>{rows.map((row, index) => <details key={row.label} open={open === index} onToggle={(event) => { setOpen((event.currentTarget as HTMLDetailsElement).open ? index : null); }}><summary><strong>{row.label}</strong><small>{row.summary}</small><b>{open === index ? "×" : "+"}</b></summary><div className={styles.body}>{row.content}</div></details>)}</div></div>
    </div>
  </section>;
}
