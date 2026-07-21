const facts = [
  ["70,0 km", "Distância"],
  ["1.530 m", "Ascensão"],
  ["1.270 m", "Descida"],
  ["47%", "Não pavimentado"],
];
const surfaces = [
  ["Não pavimentado", "33,0 km"],
  ["Asfalto", "28,7 km"],
  ["Pavimentado", "8,43 km"],
];

export default function StageFour() {
  return (
    <main className="stagePage">
      <header className="stageDetailNav shell">
        <a href="/#percurso" className="backLink">← Voltar aos percursos</a>
        <img src="/legends-logo-official.png" alt="Legends Bike Race" className="detailLogo" />
      </header>
      <section className="stageDetailHero stage4Hero">
        <div className="shell stageHeroInner">
          <div className="stageKicker"><span>Stage 04</span> Nova Petrópolis → Gramado</div>
          <h1>A chegada<br />da lenda.</h1>
          <p>O capítulo final parte da tradição de Nova Petrópolis e cruza vales, colônias e caminhos de terra até a chegada em Gramado.</p>
          <div className="stageFacts">
            {facts.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
          </div>
        </div>
      </section>
      <section className="stageProfile shell">
        <div className="profileIntro">
          <div><p className="detailEyebrow">Perfil da etapa</p><h2>O último desafio.<br /><em>A consagração.</em></h2></div>
          <p>Uma etapa de terreno variado, com sucessivas ascensões na primeira metade, um setor mais veloz entre os quilômetros 40 e 65 e uma subida decisiva para alcançar Gramado.</p>
        </div>
        <div className="performancePanel">
          <div className="surfacePanel">
            <div className="panelTop"><span>01</span><p>Composição do terreno</p></div>
            <strong className="terrainHero">47<small>%</small></strong>
            <p className="terrainLabel">não pavimentado</p>
            <div className="surfaceBar stage4Surface"><i /><i /><i /></div>
            <div className="surfaceLegend">
              {surfaces.map(([label, value], index) => <div key={label}><span className={`surfaceDot dot${index + 1}`} /><p>{label}</p><strong>{value}</strong></div>)}
            </div>
          </div>
          <div className="elevationPanel">
            <div className="panelTop"><span>02</span><p>Perfil de elevação</p><em>Nova Petrópolis → Gramado</em></div>
            <img className="exactProfile" src="/stage-4-profile-exact.jpg" alt="Perfil altimétrico oficial da Stage 4" />
            <p className="technicalSource">Perfil técnico oficial</p>
          </div>
        </div>
        <div className="routeMapPanel">
          <div className="mapPanelHead"><div><span>03</span><p>Mapa do trajeto</p></div><p>Nova Petrópolis → Gramado · 70,0 km</p></div>
          <img src="/stage-4-map-exact.jpg" alt="Mapa oficial do percurso da Stage 4" />
        </div>
      </section>
      <section className="stageData">
        <div className="shell stageDataGrid">
          <div>
            <p className="detailEyebrow">Características</p>
            <dl className="dataList">
              <div><dt>Largada</dt><dd>Nova Petrópolis</dd></div>
              <div><dt>Chegada</dt><dd>Gramado</dd></div>
              <div><dt>Ponto mais alto</dt><dd>850 m</dd></div>
              <div><dt>Ponto mais baixo</dt><dd>500 m</dd></div>
              <div><dt>Tempo-limite</dt><dd>6 horas</dd></div>
            </dl>
          </div>
          <div>
            <p className="detailEyebrow">Superfícies</p>
            <dl className="dataList">{surfaces.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          </div>
        </div>
      </section>
      <footer className="stageDetailFooter shell"><a href="/#percurso">← Todas as etapas</a><p>Legends Ultimate · Serra Gaúcha</p></footer>
    </main>
  );
}
