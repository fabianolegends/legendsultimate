"use client";

import { useState } from "react";

const menuItems = [
  {
    number: "01",
    title: "A jornada",
    summary: "Quatro dias, quatro etapas e 370,3 km de travessia pela Serra Gaúcha.",
    detail: "A edição 2027 acontece de 29 de abril a 2 de maio. A cada dia, um novo percurso exige estratégia, recuperação e autonomia até completar os 6.302 m+ acumulados.",
    href: "#como-funciona",
    link: "Veja como funciona",
  },
  {
    number: "02",
    title: "Navegação",
    summary: "O participante segue o percurso oficial por GPS em sistema de autonavegação.",
    detail: "O GPX oficial deve estar carregado antes da largada. Sinalização física é complementar; bateria, leitura da rota e correção de desvios fazem parte da responsabilidade do participante.",
    href: "#autonavegacao",
    link: "Entenda a autonavegação",
  },
  {
    number: "03",
    title: "Race Engine",
    summary: "GPS, checkpoints, rastreamento e dados da atividade sustentam a validação.",
    detail: "O Legends Race Engine pode analisar GPS, FIT, GPX, checkpoints, horários, direção, aderência ao percurso e dados de rastreamento. Inconsistências podem ser submetidas à revisão humana.",
    href: "/race-engine",
    link: "Conheça a tecnologia",
  },
  {
    number: "04",
    title: "Escolha seu modo",
    summary: "Gravel Race para competir; Experience para completar a jornada sem ranking.",
    detail: "A Gravel Race aceita Gravel e Cyclocross sem assistência motorizada. A Legends Experience aceita Gravel, MTB e E-Bikes exclusivamente de pedal assistido.",
    href: "/#modalidades",
    link: "Compare as modalidades",
  },
  {
    number: "05",
    title: "Resultado",
    summary: "Na Gravel Race, a classificação geral é definida pela soma dos pontos das etapas.",
    detail: "A pontuação usa o melhor tempo válido da categoria como referência, o tempo válido do atleta e o coeficiente de cada etapa. A fórmula e os critérios de desempate estão no Regulamento Oficial.",
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
          return (
            <article className={`raceInfoItem${isOpen ? " isOpen" : ""}`} key={item.number}>
              <button type="button" className="raceInfoTrigger" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpenItem(isOpen ? null : index)}>
                <span className="raceInfoNumber">{item.number}</span>
                <span className="raceInfoTitle">{item.title}</span>
                <span className="raceInfoSummary">{item.summary}</span>
                <span className="raceInfoIcon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              <div className="raceInfoPanel" id={panelId} hidden={!isOpen}><div><p>{item.detail}</p><a href={item.href}>{item.link} <span aria-hidden="true">→</span></a></div></div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
