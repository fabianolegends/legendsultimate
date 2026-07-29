import type { Metadata } from "next";
import RaceInfoMenu from "./RaceInfoMenu";

export const metadata: Metadata = {
  title: "A Prova",
  description: "Entenda como funciona a Legends Ultimate: quatro etapas de gravel, autonavegação, categorias, classificação e estrutura na Serra Gaúcha.",
  alternates: { canonical: "/a-prova" },
  openGraph: { url: "/a-prova", title: "A Prova | Legends Ultimate Gravel Race", description: "Conheça a jornada, as regras e a estrutura da Legends Ultimate Gravel Race." },
};

const numbers = [
  ["04", "dias de prova"],
  ["370,3 km", "de percurso"],
  ["6.302 m", "de ascensão"],
  ["75%", "em estradas de terra"],
];

const journey = [
  ["01", "Prepare", "Receba o GPX oficial, confira seu equipamento e participe do briefing."],
  ["02", "Pedale", "Siga a rota por GPS e administre ritmo, hidratação e estratégia."],
  ["03", "Sincronize", "Ao concluir, conecte sua atividade ao Legends Passport."],
  ["04", "Valide", "O Race Engine confere percurso e passagens nos checkpoints digitais."],
  ["05", "Acompanhe", "Veja sua etapa validada e, na Gravel Race, tempos, pontos e classificação."],
];

const stagePoints = [
  ["1º", "115", "100", "120", "65"],
  ["2º", "98", "85", "102", "55"],
  ["3º", "83", "72", "86", "47"],
  ["4º", "70", "61", "73", "40"],
  ["5º", "60", "52", "62", "34"],
  ["6º", "51", "44", "53", "29"],
  ["7º", "43", "37", "44", "24"],
  ["8º", "36", "31", "37", "20"],
  ["9º", "30", "26", "31", "17"],
  ["10º", "25", "22", "26", "14"],
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
          <p className="aboutKicker">A prova · Legends Ultimate</p>
          <h1>Quatro dias.<br /><em>Uma única travessia.</em></h1>
          <p className="aboutLead">Uma stage race de gravel que conecta Canela, São Francisco de Paula, Gramado e Nova Petrópolis em uma jornada de resistência, estratégia e descoberta pela Serra Gaúcha.</p>
          <div className="aboutNumbers">
            {numbers.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
          </div>
        </div>
      </section>

      <section className="raceInfoSection">
        <div className="shell"><RaceInfoMenu /></div>
      </section>

      <section className="aboutConcept" id="conceito">
        <div className="shell aboutConceptGrid">
          <p className="detailEyebrow">O conceito</p>
          <div>
            <h2>O que é uma<br /><em>stage race de gravel?</em></h2>
            <div className="aboutCopyCols">
              <p>É uma prova disputada em etapas consecutivas. A cada dia, um novo percurso leva o atleta a outro destino, criando uma experiência contínua que vai muito além de uma corrida de um único dia.</p>
              <p>Na Legends, o terreno combina estradas rurais, cascalho, trechos pavimentados e altimetria exigente. O desafio não é apenas pedalar: é administrar esforço, equipamento e recuperação ao longo de toda a jornada.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="aboutNavigation shell" id="autonavegacao">
        <div>
          <p className="detailEyebrow">Autonavegação</p>
          <h2>Você escolhe o ritmo.<br /><em>O percurso mostra o caminho.</em></h2>
        </div>
        <div className="navigationText">
          <p>Os atletas recebem o arquivo oficial de cada etapa para navegação por GPS. O trajeto não depende de uma sequência contínua de placas: atenção, leitura do percurso e autonomia fazem parte do desafio.</p>
          <p>Cada participante deve largar preparado para cuidar da própria estratégia de hidratação, alimentação, vestuário, ferramentas e reparos básicos, respeitando as orientações e os pontos de apoio definidos pela organização.</p>
        </div>
      </section>

      <section className="dailyJourney" id="como-funciona">
        <div className="shell">
          <div className="journeyHead"><div><p className="detailEyebrow">Como funciona</p><h2>Do percurso<br /><em>ao resultado.</em></h2></div><p className="journeyIntro">Uma sequência simples para o participante. O sistema trabalha nos bastidores e apresenta apenas o que importa.</p></div>
          <div className="journeyGrid">
            {journey.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="journeyEngine">
            <div className="journeyEngineCopy"><p className="detailEyebrow">Legends Race Engine</p><h3>Uma tecnologia.<br />Duas experiências.</h3><p>O mesmo sistema valida a jornada respeitando o objetivo escolhido por cada participante.</p></div>
            <div className="journeyMode"><span>Competição</span><strong>Gravel Race</strong><p>Tempos, pontos e classificação por categoria.</p></div>
            <div className="journeyMode journeyModeExperience"><span>Experiência</span><strong>MTB e E-bike</strong><p>Etapas validadas e certificado, sem ranking competitivo.</p></div>
            <a className="journeyEngineLink" href="/race-engine">Conheça o Race Engine <span>→</span></a>
          </div>
        </div>
      </section>

      <section className="classificationSection" id="classificacao">
        <div className="shell">
          <div className="classificationIntro">
            <p className="detailEyebrow">Classificação geral</p>
            <div>
              <h2>O tempo define a etapa.<br /><em>Os pontos fazem o campeão.</em></h2>
              <p>A classificação geral será definida pela soma dos pontos conquistados — e não pela soma dos tempos. Cada etapa recebe um peso proporcional à distância, à altimetria, à dificuldade e ao tempo-limite. A soma dos pesos equivale a 4,00; quem vencer as quatro etapas termina com exatamente 400 pontos.</p>
            </div>
          </div>

          <div className="stageWeights">
            <article><span>Stage 01</span><strong>1,15</strong><p>Etapa longa e exigente.</p></article>
            <article><span>Stage 02</span><strong>1,00</strong><p>Dificuldade intermediária.</p></article>
            <article><span>Stage 03</span><strong>1,20</strong><p>Maior importância técnica e física.</p></article>
            <article><span>Stage 04</span><strong>0,65</strong><p>Etapa mais curta, com limite de 6 horas.</p></article>
          </div>

          <div className="pointsTableWrap">
            <div className="pointsTableHead"><p className="detailEyebrow">Pontuação por etapa</p><span>Os dez primeiros de cada categoria pontuam</span></div>
            <table className="pointsTable">
              <thead><tr><th>Colocação</th><th>Stage 01</th><th>Stage 02</th><th>Stage 03</th><th>Stage 04</th></tr></thead>
              <tbody>{stagePoints.map(([place, ...points]) => <tr key={place}><th>{place}</th>{points.map((point, index) => <td key={index}>{point}</td>)}</tr>)}</tbody>
            </table>
          </div>

          <div className="classificationBottom" id="categorias-regras">
            <div className="categoryBlock">
              <p className="detailEyebrow">Categorias masculinas</p>
              <div className="categoryCards">
                <article><strong>Open</strong><span>18–35 anos</span></article>
                <article><strong>Master</strong><span>36–49 anos</span></article>
                <article><strong>Senior</strong><span>50 anos ou mais</span></article>
              </div>
              <p className="detailEyebrow">Categorias femininas</p>
              <div className="categoryCards">
                <article><strong>Feminino A</strong><span>18–40 anos</span></article>
                <article><strong>Feminino B</strong><span>41 anos ou mais</span></article>
              </div>
              <p className="categoryNote">As categorias femininas exigem no mínimo cinco atletas inscritas em cada faixa. Caso esse número não seja atingido, será formada uma categoria feminina única.</p>
            </div>
            <div className="rulesBlock">
              <p className="detailEyebrow">Regras da geral</p>
              <ul>
                <li>Será campeão quem acumular o maior número de pontos após as quatro etapas.</li>
                <li>Para integrar a classificação geral final, o atleta deverá completar todas as etapas dentro dos respectivos tempos-limite.</li>
                <li>Quem não concluir uma etapa não pontua nela e deixa a disputa pelo título geral, mas pode continuar nas premiações individuais das etapas.</li>
                <li>O tempo define a ordem de chegada de cada etapa, mas não é somado para decidir o campeão geral.</li>
                <li>Penalizações poderão resultar em perda de pontos ou desclassificação.</li>
              </ul>
            </div>
          </div>

          <div className="tieBreak">
            <p className="detailEyebrow">Critérios de desempate</p>
            <ol>
              <li><span>01</span>Melhor colocação na Stage 04</li>
              <li><span>02</span>Maior número de vitórias em etapas</li>
              <li><span>03</span>Maior número de segundos lugares</li>
              <li><span>04</span>Maior número de terceiros lugares</li>
              <li><span>05</span>Menor tempo registrado na Stage 04</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="aboutAudience shell" id="para-quem">
        <p className="detailEyebrow">Para quem é</p>
        <div>
          <h2>Para quem entende que<br /><em>chegar é parte da jornada.</em></h2>
          <p>A Legends foi criada para ciclistas de gravel e mountain bike com preparo para longas distâncias, que valorizam desafio, paisagem, cultura local e uma experiência esportiva premium. Não é necessário ser atleta profissional, mas treinamento, planejamento e autonomia são essenciais.</p>
          <a className="button aboutButton" href="/percursos">Conheça as etapas <span>→</span></a>
        </div>
      </section>

      <footer className="stageDetailFooter shell"><a href="/">← Voltar ao site</a><p>Legends Ultimate · Serra Gaúcha</p></footer>
    </main>
  );
}
