import type { Metadata } from "next";
import RaceInfoMenu from "./RaceInfoMenu";

export const metadata: Metadata = {
  title: "A Prova",
  description: "Como funciona a Legends Bike Race 2027: quatro etapas, autonavegação, categorias, pontos, Race Engine e estrutura na Serra Gaúcha.",
  alternates: { canonical: "/a-prova" },
  openGraph: { url: "/a-prova", title: "A Prova | Legends Bike Race 2027", description: "Conheça a jornada, as modalidades e as regras esportivas da Legends Bike Race 2027." },
};

const numbers = [
  ["04", "dias"],
  ["370,3 km", "de percurso"],
  ["6.302 m+", "de ascensão"],
  ["100", "vagas"],
];

const journey = [
  ["01", "Prepare", "Confira documentação, equipamento, GPX, SPOT e participe do briefing."],
  ["02", "Pedale", "Siga a rota oficial por GPS e administre ritmo, hidratação e estratégia."],
  ["03", "Monitore", "O SPOT e a estrutura operacional acompanham a progressão durante a etapa."],
  ["04", "Valide", "O Race Engine cruza dados da atividade, percurso, checkpoints e rastreamento."],
  ["05", "Acompanhe", "Na Gravel Race, consulte tempos, pontos, classificação e eventuais revisões."],
];

export default function AboutRace() {
  return (
    <main className="aboutRacePage">
      <header className="stageDetailNav shell">
        <a href="/" className="backLink">← Voltar ao início</a>
        <img src="/legends-logo-official.png" alt="Legends Bike Race" className="detailLogo" />
      </header>

      <section className="aboutHero">
        <div className="shell">
          <p className="aboutKicker">A prova · 29 ABR — 02 MAI 2027</p>
          <h1>Quatro dias.<br /><em>Uma única travessia.</em></h1>
          <p className="aboutLead">Uma stage race que conecta Canela, São Francisco de Paula, Gramado e Nova Petrópolis em 370,3 km e 6.302 m+ pela Serra Gaúcha.</p>
          <div className="aboutNumbers">{numbers.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
        </div>
      </section>

      <section className="raceInfoSection"><div className="shell"><RaceInfoMenu /></div></section>

      <section className="aboutConcept" id="conceito">
        <div className="shell aboutConceptGrid">
          <p className="detailEyebrow">O conceito</p>
          <div>
            <h2>Não é circuito.<br /><em>É travessia.</em></h2>
            <div className="aboutCopyCols">
              <p>A Legends é disputada em quatro etapas consecutivas. Cada dia apresenta um novo percurso e exige que o participante administre esforço, equipamento, alimentação, navegação e recuperação.</p>
              <p>As vias poderão permanecer abertas ao trânsito. Autonomia e pilotagem defensiva fazem parte da experiência, sempre respeitando o Regulamento, as autoridades e as orientações de segurança.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="aboutNavigation shell" id="autonavegacao">
        <div><p className="detailEyebrow">Autonavegação</p><h2>O GPS é parte<br /><em>da prova.</em></h2></div>
        <div className="navigationText">
          <p>O percurso oficial será disponibilizado eletronicamente. O participante é responsável por carregar corretamente a rota, conhecer o dispositivo, manter autonomia de bateria e permanecer no trajeto oficial.</p>
          <p>A sinalização física é complementar. Se sair involuntariamente da rota, o atleta deve retornar ao ponto do desvio antes de continuar. Atalhos e reconexões posteriores podem gerar penalização ou desclassificação.</p>
        </div>
      </section>

      <section className="dailyJourney" id="como-funciona">
        <div className="shell">
          <div className="journeyHead"><div><p className="detailEyebrow">Como funciona</p><h2>Do percurso<br /><em>ao resultado.</em></h2></div><p className="journeyIntro">A operação integra autonavegação, SPOT, checkpoints, Race Engine e revisão humana quando necessário.</p></div>
          <div className="journeyGrid">{journey.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
          <div className="journeyEngine">
            <div className="journeyEngineCopy"><p className="detailEyebrow">Legends Race Engine</p><h3>Uma tecnologia.<br />Duas experiências.</h3><p>O sistema respeita a modalidade escolhida e utiliza dados de percurso e passagem para apoiar validação e apuração.</p></div>
            <div className="journeyMode"><span>Competição</span><strong>Gravel Race</strong><p>Gravel e Cyclocross sem assistência motorizada. Tempos, pontos e classificação.</p></div>
            <div className="journeyMode journeyModeExperience"><span>Experiência</span><strong>Legends Experience</strong><p>Gravel, MTB e E-Bikes de pedal assistido, sem ranking competitivo.</p></div>
            <a className="journeyEngineLink" href="/race-engine">Conheça o Race Engine <span>→</span></a>
          </div>
        </div>
      </section>

      <section className="classificationSection" id="classificacao">
        <div className="shell">
          <div className="classificationIntro">
            <p className="detailEyebrow">Classificação geral</p>
            <div><h2>O tempo valida a etapa.<br /><em>Os pontos fazem a geral.</em></h2><p>A Gravel Race utiliza uma fórmula proporcional ao melhor tempo válido de cada categoria. O resultado de cada etapa é multiplicado pelo coeficiente correspondente, e a classificação geral é formada pela soma dos pontos válidos.</p></div>
          </div>

          <div className="stageWeights">
            <article><span>Stage 01</span><strong>1,15</strong><p>111,9 km · 1.684 m+</p></article>
            <article><span>Stage 02</span><strong>1,00</strong><p>89,1 km · 1.520 m+</p></article>
            <article><span>Stage 03</span><strong>1,20</strong><p>99,3 km · 1.522 m+</p></article>
            <article><span>Stage 04</span><strong>0,65</strong><p>70,0 km · 1.576 m+</p></article>
          </div>

          <div className="pointsTableWrap">
            <div className="pointsTableHead"><p className="detailEyebrow">Fórmula oficial de referência</p><span>Regulamento Oficial v1.1</span></div>
            <div style={{padding:"34px",border:"1px solid rgba(198,122,59,.3)",fontFamily:"Barlow Condensed",fontSize:"clamp(24px,3vw,40px)",fontWeight:700,textTransform:"uppercase",lineHeight:1.15}}>
              Pontos = 1.000 × (melhor tempo válido da categoria ÷ tempo válido do atleta) × coeficiente da etapa
            </div>
          </div>

          <div className="classificationBottom" id="categorias-regras">
            <div className="categoryBlock">
              <p className="detailEyebrow">Categorias masculinas</p>
              <div className="categoryCards">
                <article><strong>Open</strong><span>18–29 anos</span></article>
                <article><strong>Master A</strong><span>30–39 anos</span></article>
                <article><strong>Master B</strong><span>40–49 anos</span></article>
                <article><strong>Senior</strong><span>50 anos ou mais</span></article>
              </div>
              <p className="detailEyebrow">Categorias femininas</p>
              <div className="categoryCards"><article><strong>Feminino A</strong><span>18–40 anos</span></article><article><strong>Feminino B</strong><span>41 anos ou mais</span></article></div>
              <p className="categoryNote">A idade considerada é a que o atleta completa no ano-base da competição. É exigido mínimo de cinco atletas confirmados por categoria. Quando o mínimo não for atingido, aplica-se o agrupamento previsto no Regulamento Oficial.</p>
            </div>
            <div className="rulesBlock">
              <p className="detailEyebrow">Regras da geral</p>
              <ul>
                <li>A classificação geral é formada pela soma dos pontos válidos das etapas.</li>
                <li>DNS significa não largou; DNF significa largou e não concluiu validamente; DSQ significa desclassificado.</li>
                <li>Um DNF pode ser autorizado a largar a etapa seguinte, sem recuperar a pontuação perdida.</li>
                <li>Penalizações podem resultar em tempo, perda de pontos, DNF ou DSQ.</li>
                <li>Resultados provisórios podem ser contestados em até 30 minutos pelo canal oficial.</li>
              </ul>
            </div>
          </div>

          <div className="tieBreak">
            <p className="detailEyebrow">Critérios de desempate</p>
            <ol>
              <li><span>01</span>Maior número de vitórias em etapas</li>
              <li><span>02</span>Melhor pontuação na Stage 03</li>
              <li><span>03</span>Menor soma dos tempos válidos</li>
              <li><span>04</span>Melhor classificação na Stage 04</li>
              <li><span>05</span>Persistindo igualdade, colocação compartilhada ou decisão da Direção de Prova</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="aboutAudience shell" id="para-quem">
        <p className="detailEyebrow">Antes de se inscrever</p>
        <div><h2>Leia. Entenda.<br /><em>Prepare-se.</em></h2><p>A participação exige Atestado Médico e Declaração de Saúde oficiais, além do cumprimento das exigências de equipamento, navegação e segurança previstas no Regulamento.</p><a className="button aboutButton" href="/regulamento">Consultar regulamento <span>→</span></a></div>
      </section>

    </main>
  );
}
