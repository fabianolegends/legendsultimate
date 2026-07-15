"use client";

import { useState } from "react";

const menuItems = [
  {
    number: "01",
    title: "O evento",
    summary: "Quatro dias, quatro destinos e uma travessia contínua pela Serra Gaúcha.",
    detail: [
      "A Legends Ultimate é uma stage race de gravel realizada ao longo de quatro dias consecutivos na Serra Gaúcha. A prova conecta Canela, São Francisco de Paula, Gramado e Nova Petrópolis em uma travessia contínua, na qual cada etapa apresenta um novo percurso, diferentes características de terreno e desafios próprios de distância e altimetria.",
      "Os atletas percorrem estradas rurais, trechos de cascalho e segmentos pavimentados utilizando autonavegação por GPS. Ao final de cada dia, a chegada marca também o início da preparação para a etapa seguinte: recuperação física, alimentação, manutenção da bicicleta e planejamento da estratégia.",
      "Cada etapa possui classificação própria por tempo e distribui pontos aos dez primeiros de cada categoria. A classificação geral é definida pela soma desses pontos após as quatro etapas. Para disputar o título geral, o atleta deverá concluir todos os percursos dentro dos respectivos tempos-limite.",
      "Mais do que quatro provas independentes, a Legends foi concebida como uma única jornada. O desafio exige resistência, regularidade, autonomia e capacidade de administrar o esforço durante toda a travessia. Cada largada abre um novo capítulo; somente após a chegada da Stage 04 a experiência estará completa.",
    ],
    href: "#conceito",
    link: "Entenda o formato",
  },
  {
    number: "02",
    title: "Como funciona",
    summary: "Da entrega do kit à consagração final, conheça a rotina de cada etapa.",
    detail: [
      "Briefing, largada, percurso por autonavegação, chegada, recuperação e preparação: a experiência foi desenhada para que os quatro dias formem uma única jornada.",
    ],
    href: "#como-funciona",
    link: "Veja a jornada diária",
  },
  {
    number: "03",
    title: "Autonavegação",
    summary: "Arquivo GPX, GPS, checkpoints e autonomia fazem parte do desafio.",
    detail: [
      "O atleta recebe o arquivo oficial de cada etapa e deve estar preparado para navegar, administrar alimentação e hidratação e realizar reparos básicos durante o percurso.",
    ],
    href: "#autonavegacao",
    link: "Conheça a navegação",
  },
  {
    number: "04",
    title: "Classificação por pontos",
    summary: "O tempo ordena cada etapa; os pontos definem os campeões da geral.",
    detail: [
      "As etapas têm pesos diferentes conforme distância, altimetria e dificuldade. A regularidade é decisiva e quem vencer as quatro etapas encerra a prova com 400 pontos.",
    ],
    href: "#classificacao",
    link: "Consulte a pontuação",
  },
  {
    number: "05",
    title: "Categorias e regras",
    summary: "Faixas etárias, tempos-limite, penalizações e critérios de desempate.",
    detail: [
      "Open, Master e Senior têm classificações masculina e feminina. Para disputar o título geral, é necessário concluir todas as etapas dentro dos respectivos tempos-limite.",
    ],
    href: "#categorias-regras",
    link: "Leia as regras",
  },
  {
    number: "06",
    title: "Preparação do atleta",
    summary: "Treinamento, estratégia e autonomia para quatro dias de gravel.",
    detail: [
      "A prova exige preparo para longas distâncias, planejamento de equipamento, alimentação, hidratação e recuperação. Não é preciso ser profissional, mas é essencial chegar preparado.",
    ],
    href: "#para-quem",
    link: "Descubra para quem é",
  },
];

export default function RaceInfoMenu() {
  const [openItem, setOpenItem] = useState<number | null>(0);

  return (
    <div className="raceInfoMenu" aria-labelledby="race-info-title">
      <div className="raceInfoHead">
        <div>
          <p className="raceInfoKicker">Antes de aceitar o desafio</p>
          <h2 id="race-info-title">Entenda a jornada.</h2>
        </div>
        <p>Tudo o que você precisa saber para chegar preparado à largada.</p>
      </div>

      <div className="raceInfoList">
        {menuItems.map((item, index) => {
          const isOpen = openItem === index;
          const panelId = `race-info-panel-${index}`;

          return (
            <article className={`raceInfoItem${isOpen ? " isOpen" : ""}`} key={item.number}>
              <button
                type="button"
                className="raceInfoTrigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenItem(isOpen ? null : index)}
              >
                <span className="raceInfoNumber">{item.number}</span>
                <span className="raceInfoTitle">{item.title}</span>
                <span className="raceInfoSummary">{item.summary}</span>
                <span className="raceInfoIcon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>

              <div className="raceInfoPanel" id={panelId} hidden={!isOpen}>
                <div>
                  {item.detail.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
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
