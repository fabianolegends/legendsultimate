import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stage 03: Gramado a Nova Petrópolis",
  description: "Conheça a terceira etapa da Legends Ultimate e a abertura da Legends Short: 99,3 km e 1.522 m+ entre Gramado e Nova Petrópolis.",
  alternates: { canonical: "/percursos/stage-3" },
  openGraph: { url: "/percursos/stage-3", title: "Stage 03: Gramado a Nova Petrópolis", description: "99,3 km e 1.522 m+ na Legends Ultimate e na Legends Short." },
};

const facts = [
  ["99,3 km", "Distância"],
  ["1.522 m", "Ascensão"],
  ["1.798 m", "Descida"],
  ["79%", "Não pavimentado"],
];
const surfaces = [
  ["Não pavimentado", "78,5 km"],
  ["Asfalto", "17,5 km"],
  ["Pavimentado", "3,33 km"],
];

export default function StageThree() {
  return (
    <main className="stagePage">
      <header className="stageDetailNav shell">
        <a href="/" className="backLink">
          ← Voltar à home
        </a>
        <img
          src="/legends-logo-official.png"
          alt="Legends Bike Race"
          className="detailLogo"
        />
      </header>
      <section className="stageDetailHero stage3Hero">
        <div className="shell stageHeroInner">
          <div className="stageKicker">
            <span>Stage 03</span> Gramado → Nova Petrópolis
          </div>
          <h1>
            Precisão e<br />
            resistência.
          </h1>
          <p>
            Uma etapa de contrastes: da altitude de Gramado ao ponto mais baixo
            da prova, seguida por uma escalada final que conduz a Nova
            Petrópolis.
          </p>
          <a className="stageCityLink" href="https://www.gramadoinesquecivel.tur.br/" target="_blank" rel="noreferrer">Conheça a cidade da largada <span>↗</span></a>
          <div className="stageFacts">
            {facts.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="stageProfile shell">
        <div className="profileIntro">
          <div>
            <p className="detailEyebrow">Perfil da etapa</p>
            <h2>
              Da montanha ao vale.
              <br />
              <em>E de volta ao alto.</em>
            </h2>
          </div>
          <p>
            A etapa começa próxima dos 870 metros, perde altitude de forma
            progressiva e alcança apenas 60 metros no trecho mais baixo. A longa
            subida final até Nova Petrópolis transforma a chegada em uma prova
            de gestão e resistência.
          </p>
        </div>
        <div className="performancePanel">
          <div className="surfacePanel">
            <div className="panelTop">
              <span>01</span>
              <p>Composição do terreno</p>
            </div>
            <strong className="terrainHero">
              79<small>%</small>
            </strong>
            <p className="terrainLabel">não pavimentado</p>
            <div className="surfaceBar stage3Surface">
              <i />
              <i />
              <i />
            </div>
            <div className="surfaceLegend">
              {surfaces.map(([label, value], index) => (
                <div key={label}>
                  <span className={`surfaceDot dot${index + 1}`} />
                  <p>{label}</p>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="elevationPanel">
            <div className="panelTop">
              <span>02</span>
              <p>Perfil de elevação</p>
              <em>Gramado → Nova Petrópolis</em>
            </div>
            <div className="profileChartWrap">
              <img
                className="exactProfile stageThreeProfileExact"
                src="/stage-3-profile-transparent.png"
                alt="Perfil altimétrico oficial da Stage 3"
              />
            </div>
            <p className="technicalSource">Dados técnicos · Ride with GPS</p>
          </div>
        </div>
        <div className="routeMapPanel">
          <div className="mapPanelHead">
            <div>
              <span>03</span>
              <p>Mapa do trajeto</p>
            </div>
            <p>Gramado → Nova Petrópolis · 99,3 km</p>
          </div>
          <img
            src="/stage-3-map-rwgps-v2.jpg"
            alt="Mapa oficial do percurso da Stage 3"
          />
        </div>
      </section>
      <section className="stageData">
        <div className="shell stageDataGrid">
          <div>
            <p className="detailEyebrow">Características</p>
            <dl className="dataList">
              <div>
                <dt>Largada</dt>
                <dd>Gramado</dd>
              </div>
              <div>
                <dt>Chegada</dt>
                <dd>Nova Petrópolis</dd>
              </div>
              <div>
                <dt>Ponto mais alto</dt>
                <dd>870 m</dd>
              </div>
              <div>
                <dt>Ponto mais baixo</dt>
                <dd>60 m</dd>
              </div>
              <div>
                <dt>Tempo estimado</dt>
                <dd>4h50</dd>
              </div>
              <div>
                <dt>Inclinação máxima</dt>
                <dd>+14,2% / -23,3%</dd>
              </div>
              <div>
                <dt>Tempo-limite</dt>
                <dd>10 horas</dd>
              </div>
            </dl>
          </div>
          <div>
            <p className="detailEyebrow">Superfícies</p>
            <dl className="dataList">
              {surfaces.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      <footer className="stageDetailFooter shell">
        <a href="/percursos">← Todas as etapas</a>
        <p>Legends Ultimate + Short · Serra Gaúcha</p>
      </footer>
    </main>
  );
}
