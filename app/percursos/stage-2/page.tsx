const facts = [
  ["89,1 km", "Distância"],
  ["1.520 m", "Ascensão"],
  ["1.540 m", "Descida"],
  ["76%", "Não pavimentado"],
];
const surfaces = [
  ["Não pavimentado", "67,8 km"],
  ["Asfalto", "18,1 km"],
  ["Pavimentado", "2,39 km"],
  ["Paralelepípedo", "858 m"],
];

export default function StageTwo() {
  return (
    <main className="stagePage">
      <header className="stageDetailNav shell">
        <a href="/#percurso" className="backLink">
          ← Voltar aos percursos
        </a>
        <img
          src="/legends-logo-official.png"
          alt="Legends Bike Race"
          className="detailLogo"
        />
      </header>
      <section className="stageDetailHero stage2Hero">
        <div className="shell stageHeroInner">
          <div className="stageKicker">
            <span>Stage 02</span> São Francisco de Paula → Gramado
          </div>
          <h1>
            Campos
            <br />
            de altitude.
          </h1>
          <p>
            Uma travessia pelos horizontes abertos dos Campos de Cima da Serra,
            entre araucárias, estradas rurais e a subida final em direção a
            Gramado.
          </p>
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
              Velocidade no vale.
              <br />
              <em>Força na chegada.</em>
            </h2>
          </div>
          <p>
            A etapa começa nos 900 metros de altitude e perde elevação
            rapidamente. Depois de um longo setor ondulado entre 500 e 600
            metros, a decisão acontece na subida final para Gramado.
          </p>
        </div>
        <div className="performancePanel">
          <div className="surfacePanel">
            <div className="panelTop">
              <span>01</span>
              <p>Composição do terreno</p>
            </div>
            <strong className="terrainHero">
              76<small>%</small>
            </strong>
            <p className="terrainLabel">não pavimentado</p>
            <div className="surfaceBar stage2Surface">
              <i />
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
              <em>São Francisco de Paula → Gramado</em>
            </div>
            <img className="exactProfile" src="/stage-2-profile-exact.jpg" alt="Perfil altimétrico oficial da Stage 2 extraído do Komoot" />
            <p className="technicalSource">Perfil técnico oficial · Komoot</p>
          </div>
        </div>
        <div className="routeMapPanel"><div className="mapPanelHead"><div><span>03</span><p>Mapa do trajeto</p></div><p>São Francisco de Paula → Gramado · 89,1 km</p></div><img src="/stage-2-map-exact.jpg" alt="Mapa oficial do percurso da Stage 2 no Komoot" /><a href="https://www.komoot.com/pt-br/tour/3089094539" target="_blank" rel="noreferrer">Explorar mapa no Komoot ↗</a></div>
      </section>
      <section className="stageData">
        <div className="shell stageDataGrid">
          <div>
            <p className="detailEyebrow">Características</p>
            <dl className="dataList">
              <div>
                <dt>Largada</dt>
                <dd>São Francisco de Paula</dd>
              </div>
              <div>
                <dt>Chegada</dt>
                <dd>Gramado</dd>
              </div>
              <div>
                <dt>Ponto mais alto</dt>
                <dd>900 m</dd>
              </div>
              <div>
                <dt>Ponto mais baixo</dt>
                <dd>500 m</dd>
              </div>
              <div>
                <dt>Tempo-limite</dt>
                <dd>A definir</dd>
              </div>
              <div>
                <dt>Estimativa Komoot</dt>
                <dd>7h36</dd>
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
            <a
              className="button detailButton"
              href="https://www.komoot.com/pt-br/tour/3089094539"
              target="_blank"
              rel="noreferrer"
            >
              Ver percurso no Komoot <span>↗</span>
            </a>
          </div>
        </div>
      </section>
      <footer className="stageDetailFooter shell">
        <a href="/#percurso">← Todas as etapas</a>
        <p>Legends Ultimate · Serra Gaúcha</p>
      </footer>
    </main>
  );
}
