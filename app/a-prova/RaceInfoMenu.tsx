"use client";

import { useState } from "react";
import { Bicycle, Cpu, MapTrifold, NavigationArrow, Plus, Minus, Trophy } from "@phosphor-icons/react";

const menuItems = [
  {
    number: "01",
    icon: MapTrifold,
    title: "A jornada",
    summary: "Ultimate percorre quatro etapas; Short reúne as duas etapas finais.",
    detail: "A Ultimate acontece de 29 de abril a 2 de maio, com 370,3 km e 6.302 m+. A Short acontece em 1º e 2 de maio, nas Stages 03 e 04, com 169,3 km e 3.098 m+.",
    href: "#formatos",
    link: "Compare os formatos",
  },
  {
    number: "02",
    icon: NavigationArrow,
    title: "Navegação",
    summary: "O participante segue o percurso oficial por GPS em sistema de autonavegação.",
    detail: "O GPX oficial deve estar carregado antes da largada. Sinalização física é complementar; bateria, leitura da rota e correção de desvios fazem parte da responsabilidade do participante.",
    href: "#autonavegacao",
    link: "Entenda a autonavegação",
  },
  {
    number: "03",
    icon: Cpu,
    title: "Race Engine",
    summary: "GPS, checkpoints, rastreamento e dados da atividade sustentam a validação.",
    detail: "O Legends Race Engine pode analisar GPS, FIT, GPX, checkpoints, horários, direção, aderência ao percurso e dados de rastreamento. Inconsistências podem ser submetidas à revisão humana.",
    href: "/race-engine",
    link: "Conheça a tecnologia",
  },
  {
    number: "04",
    icon: Bicycle,
    title: "Escolha seu modo",
    summary: "Gravel Race para competir; Experience para completar a jornada sem ranking.",
    detail: "A Gravel Race aceita Gravel e Cyclocross sem assistência motorizada. A Legends Experience aceita Gravel, MTB e E-Bikes exclusivamente de pedal assistido.",
    href: "/#modalidades",
    link: "Compare as modalidades",
  },
  {
    number: "05",
    icon: Trophy,
    title: "Resultado",
    summary: "Na Gravel Race, cada formato possui sua própria classificação geral.",
    detail: "A Ultimate soma as quatro etapas e premia do 1º ao 5º de cada categoria. A Short soma apenas as Stages 03 e 04 e premia do 1º ao 3º. A fórmula e os critérios estão no Regulamento Oficial.",
    href: "#classificacao",
    link: "Entenda a classificação",
  },
];

export default function RaceInfoMenu() {
  const [openItem, setOpenItem] = useState<number | null>(null);

  return (
    <div className="raceInfoMenu" aria-labelledby="race-info-title">
      <div className="raceInfoHead">
        <div><p className="raceInfoKicker">O essencial em cinco pontos</p><h2 id="race-info-title">Como funciona.</h2></div>
        <p>Abra o assunto que deseja entender. As regras completas estão disponíveis no Regulamento Oficial.</p>
      </div>
      <div className="raceInfoList">
        {menuItems.map((item, index) => {
          const isOpen = openItem === index;
          const panelId = `race-info-panel-${index}`;
          const Icon = item.icon;
          return (
            <article className={`raceInfoItem${isOpen ? " isOpen" : ""}`} key={item.number}>
              <button type="button" className="raceInfoTrigger" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpenItem(isOpen ? null : index)}>
                <span className="raceInfoLeadIcon"><Icon aria-hidden="true" /></span>
                <span className="raceInfoCopy"><span className="raceInfoTitle">{item.title}</span><span className="raceInfoSummary">{item.summary}</span></span>
                <span className="raceInfoIcon" aria-hidden="true"><Plus className="raceInfoPlus" /><Minus className="raceInfoMinus" /></span>
              </button>
              <div className="raceInfoPanel" id={panelId} hidden={!isOpen}><div><span className="raceInfoPanelNumber">Ponto {item.number}</span><p>{item.detail}</p><a href={item.href}>{item.link} <span aria-hidden="true">→</span></a></div></div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
