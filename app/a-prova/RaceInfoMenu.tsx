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
    summary: "Quatro etapas consecutivas, autonavegação por GPS, classificação diária e pontos acumulados para definir os campeões.",
    detail: [
      "A Legends Ultimate é disputada em quatro etapas consecutivas. Em cada dia, o atleta enfrenta um novo percurso, com distância, altimetria e características próprias. As etapas fazem parte de uma única travessia, mas possuem largadas, chegadas e classificações independentes.",
      "Antes de cada etapa, a organização disponibiliza o arquivo GPX oficial e apresenta as informações técnicas do percurso, incluindo pontos de controle, locais de apoio, trechos de atenção e tempo-limite. A navegação é realizada pelo próprio atleta por meio de ciclocomputador ou dispositivo GPS compatível.",
      "Durante o percurso, cada participante deverá administrar seu ritmo, alimentação, hidratação e condições mecânicas da bicicleta. A organização contará com estrutura de segurança, pontos de controle e assistência prevista para o evento, mas o atleta deverá possuir autonomia para realizar reparos básicos e continuar a prova dentro do tempo estabelecido.",
      "Ao cruzar a linha de chegada, o tempo da etapa é registrado e os dez primeiros colocados de cada categoria recebem pontos para a classificação geral. Depois da chegada, começa a preparação para o dia seguinte: recuperação física, alimentação, revisão da bicicleta e definição da estratégia para o próximo percurso.",
      "Para permanecer na disputa pelo título geral, o atleta deverá concluir as quatro etapas dentro dos respectivos tempos-limite. Ao final da Stage 04, a soma dos pontos conquistados ao longo da competição determinará os campeões de cada categoria.",
    ],
    href: "#como-funciona",
    link: "Veja a jornada diária",
  },
  {
    number: "03",
    title: "Autonavegação",
    summary: "O atleta recebe o arquivo GPX oficial e segue o percurso com seu próprio dispositivo GPS, sendo responsável pela navegação, bateria e correção de eventuais desvios.",
    detail: [
      "Na Legends Ultimate, o percurso não será indicado por sinalização contínua. Cada atleta deverá seguir o trajeto oficial utilizando um ciclocomputador, relógio ou dispositivo GPS compatível com arquivos GPX.",
      "Antes de cada etapa, a organização disponibilizará o arquivo oficial do percurso. O atleta deverá carregá-lo previamente em seu equipamento, conferir se a rota está funcionando corretamente e iniciar a navegação antes da largada. No briefing técnico também serão apresentados os principais pontos de atenção, locais de apoio e eventuais trechos que exijam maior cuidado.",
      "Durante a prova, o próprio participante será responsável por acompanhar a rota, identificar mudanças de direção e perceber eventuais desvios. Caso saia do percurso, deverá retornar ao ponto em que abandonou o traçado oficial antes de continuar. Atalhos ou caminhos diferentes do arquivo disponibilizado poderão resultar em penalização ou desclassificação.",
      "A autonavegação faz parte do desafio da Legends. Além da capacidade física, o atleta deverá manter atenção ao percurso, administrar a bateria do equipamento e estar preparado para resolver situações básicas sem depender de marcação permanente ao longo da estrada.",
      "Recomenda-se utilizar um dispositivo com boa autonomia, iniciar cada etapa com a bateria completamente carregada e levar uma alternativa de segurança, como o arquivo salvo no celular ou uma fonte de energia portátil.",
    ],
    href: "#autonavegacao",
    link: "Conheça a navegação",
  },
  {
    number: "04",
    title: "Categorias e regras",
    summary: "Categorias por faixa etária, participação mínima no feminino e regras essenciais para permanecer na classificação geral.",
    detail: [
      "A Legends Ultimate contará com categorias definidas por gênero e faixa etária. A categoria de cada participante será determinada conforme sua idade e os critérios estabelecidos no regulamento oficial do evento.",
      "§ Categorias masculinas",
      "• Open: 18 a 35 anos",
      "• Master: 36 a 49 anos",
      "• Senior: 50 anos ou mais",
      "§ Categorias femininas",
      "• Feminina A: 18 a 40 anos",
      "• Feminina B: 41 anos ou mais",
      "Para que a divisão feminina seja mantida, será necessário um mínimo de cinco atletas inscritas em cada categoria. Caso esse número não seja atingido, todas as participantes serão reunidas em uma única categoria feminina.",
      "Para permanecer na disputa pela classificação geral, o atleta deverá largar e concluir as quatro etapas dentro dos respectivos tempos-limite, seguir integralmente o percurso oficial e passar por todos os pontos de controle estabelecidos pela organização.",
      "O uso de capacete será obrigatório durante toda a prova. Cada participante deverá portar o equipamento necessário para autonavegação, identificação oficial, hidratação, alimentação e realização de reparos mecânicos básicos.",
      "Desvios do percurso deverão ser corrigidos com o retorno ao ponto em que o atleta deixou o traçado oficial. Atalhos, ausência em pontos de controle, auxílio externo em locais não autorizados, conduta antidesportiva ou descumprimento das orientações de segurança poderão resultar em advertência, penalização de tempo, perda de pontos ou desclassificação.",
      "As regras detalhadas, os tempos-limite, os equipamentos obrigatórios e os procedimentos de fiscalização serão apresentados no regulamento oficial e reforçados durante os briefings técnicos do evento.",
    ],
    href: "#categorias-regras",
    link: "Leia as regras",
  },
  {
    number: "05",
    title: "Classificação por pontos",
    summary: "O tempo ordena cada etapa; os pontos definem os campeões da geral.",
    detail: [
      "As etapas têm pesos diferentes conforme distância, altimetria e dificuldade. A regularidade é decisiva e quem vencer as quatro etapas encerra a prova com 400 pontos.",
    ],
    href: "#classificacao",
    link: "Consulte a pontuação",
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
                <div
                  style={{
                    display: "block",
                    marginLeft: "clamp(0px, 6.2vw, 94px)",
                    padding: "8px clamp(8px, 4vw, 50px) 30px 8px",
                  }}
                >
                  {item.detail.map((paragraph) => {
                    const isSectionLabel = paragraph.startsWith("§ ");
                    const isBullet = paragraph.startsWith("• ");
                    const text = isSectionLabel || isBullet ? paragraph.slice(2) : paragraph;

                    return (
                      <p
                        key={paragraph}
                        style={{
                          width: "100%",
                          maxWidth: "none",
                          margin: isSectionLabel ? "26px 0 12px" : isBullet ? "0 0 10px" : "0 0 18px",
                          ...(isSectionLabel
                            ? {
                                color: "#c67a3b",
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontSize: "16px",
                                fontWeight: 700,
                                letterSpacing: ".14em",
                                textTransform: "uppercase" as const,
                              }
                            : {}),
                          ...(isBullet
                            ? {
                                display: "flex",
                                alignItems: "baseline",
                                gap: "12px",
                                color: "#e1e2dc",
                                fontWeight: 600,
                              }
                            : {}),
                        }}
                      >
                        {isBullet && (
                          <span aria-hidden="true" style={{ color: "#c67a3b", fontSize: "20px", lineHeight: 1 }}>
                            •
                          </span>
                        )}
                        {text}
                      </p>
                    );
                  })}
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
