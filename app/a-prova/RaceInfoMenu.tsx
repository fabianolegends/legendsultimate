"use client";

import { useState } from "react";

const menuItems = [
  {
    number: "01",
    title: "A jornada",
    summary: "Quatro dias, quatro percursos e uma única travessia pela Serra Gaúcha.",
    detail: "Cada dia apresenta um percurso, uma largada e uma chegada. Ao concluir a etapa, o participante recupera, revisa a bicicleta e se prepara para o próximo destino.",
    href: "#como-funciona",
    link: "Veja os cinco passos",
  },
  {
    number: "02",
    title: "Navegação",
    summary: "O percurso oficial é seguido pelo próprio participante em um dispositivo GPS.",
    detail: "O arquivo GPX de cada etapa é disponibilizado antes da largada. Bateria, leitura da rota e correção de eventuais desvios fazem parte da autonomia do participante.",
    href: "#autonavegacao",
    link: "Entenda a autonavegação",
  },
  {
    number: "03",
    title: "Race Engine",
    summary: "A atividade do GPS é comparada ao percurso e aos checkpoints digitais da etapa.",
    detail: "Depois da sincronização, o Legends Race Engine verifica o caminho percorrido e as passagens. Na Gravel Race, produz tempos, pontos e classificação; no Experience, registra a jornada de MTB e E-bike sem ranking competitivo.",
    href: "/race-engine",
    link: "Conheça a tecnologia",
  },
  {
    number: "04",
    title: "Escolha seu modo",
    summary: "Gravel Race para competir; Experience para viver a jornada com MTB ou E-bike.",
    detail: "A Gravel Race reúne gravel e cyclocross em categorias, classificação e premiação. O Legends Experience recebe MTB e E-bike na mesma travessia, com etapas validadas e certificado, mas sem disputar o ranking.",
    href: "/#modalidades",
    link: "Compare as modalidades",
  },
  {
    number: "05",
    title: "Resultado",
    summary: "Na Gravel Race, o tempo ordena a etapa e os pontos definem a classificação geral.",
    detail: "Cada etapa tem um peso próprio. Os dez primeiros de cada categoria pontuam, e a soma dos pontos após os quatro dias define os campeões da Legends.",
    href: "#classificacao",
    link: "Consulte a pontuação",
  },
];

export default function RaceInfoMenu() {
  const [openItem, setOpenItem] = useState<number | null>(null);

  return (
    <div className="raceInfoMenu" aria-labelledby="race-info-title">
      <div className="raceInfoHead">
        <div>
          <p className="raceInfoKicker">O essencial em cinco pontos</p>
          <h2 id="race-info-title">Como funciona.</h2>
        </div>
        <p>Abra somente o assunto que deseja entender. Os detalhes técnicos continuam disponíveis nas seções abaixo.</p>
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
              <div className="raceInfoPanel" id={panelId} hidden={!isOpen}>
                <div>
                  <p>{item.detail}</p>
                  <a href={item.href}>{item.link} <span aria-hidden="true">→</span></a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
