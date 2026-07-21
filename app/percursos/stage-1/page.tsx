const facts = [
  ["111,9 km", "Distância"],
  ["1.684 m", "Ascensão"],
  ["1.621 m", "Descida"],
  ["79%", "Não pavimentado"],
];

const surfaces = [
  ["Não pavimentado", "88 km"],
  ["Pavimentado", "23,9 km"],
];

export default function StageOne() {
  return (
    <main className="stagePage">
      <header className="stageDetailNav shell">
        <a href="/#percurso" className="backLink">← Voltar aos percursos</a>
        <img src="/legends-logo-official.png" alt="Legends Bike Race" className="detailLogo" />
      </header>

      <section className="stageDetailHero">
        <div className="shell stageHeroInner">
          <div className="stageKicker"><span>Stage 01</span> Canela → São Francisco de Paula</div>
          <h1>O portal<br />da aventura.</h1>
          <p>Uma travessia de gravel entre vales, estradas rurais e campos de altitude, conectando Canela a São Francisco de Paula.</p>
          <div className="stageFacts">{facts.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
        </div>
      </section>

      <section className="stageProfile shell">
        <div className="profileIntro">
          <div><p className="detailEyebrow">Perfil da etapa</p><h2>Uma jornada de<br /><em>ritmo e constância.</em></h2></div>
          <p>O percurso parte de aproximadamente 830 metros, alcança o ponto mais alto aos 990 metros e termina próximo dos 900 metros. A sequência de ondulações e subidas longas exige gestão de esforço durante toda a etapa.</p>
        </div>
        <div className="performancePanel">
          <div className="surfacePanel">
            <div className="panelTop"><span>01</span><p>Composição do terreno</p></div>
            <strong className="terrainHero">79<small>%</small></strong>
            <p className="terrainLabel">não pavimentado</p>
            <div className="surfaceBar surfaceBarTwo"><i /><i /></div>
            <div className="surfaceLegend">
              {surfaces.map(([label,value], index) => <div key={label}><span className={`surfaceDot dot${index + 1}`} /><p>{label}</p><strong>{value}</strong></div>)}
            </div>
          </div>
          <div className="elevationPanel">
            <div className="panelTop"><span>02</span><p>Perfil de elevação</p><em>Canela → São Francisco de Paula</em></div>
            <div className="profileChartWrap">
              <img className="exactProfile stageOneProfileExact" src="/stage-1-profile-final.png" alt="Perfil altimétrico oficial da Stage 1" />
            </div>
            <p className="technicalSource">Dados técnicos · Ride with GPS</p>
          </div>
        </div>
        <div className="routeMapPanel">
          <div className="mapPanelHead"><div><span>03</span><p>Mapa do trajeto</p></div><p>Canela → São Francisco de Paula · 111,9 km</p></div>
          <img src="/stage-1-map-rwgps-v2.jpg" alt="Mapa oficial do percurso da Stage 1" />
          <a href="https://ridewithgps.com/routes/56232690" target="_blank" rel="noreferrer">Abrir rota no Ride with GPS ↗</a>
        </div>
      </section>

      <section className="stageData">
        <div className="shell stageDataGrid">
          <div><p className="detailEyebrow">Características</p><dl className="dataList"><div><dt>Largada</dt><dd>Canela</dd></div><div><dt>Chegada</dt><dd>São Francisco de Paula</dd></div><div><dt>Ponto mais alto</dt><dd>990 m</dd></div><div><dt>Ponto mais baixo</dt><dd>650 m</dd></div><div><dt>Tempo estimado</dt><dd>5h24</dd></div><div><dt>Inclinação máxima</dt><dd>+10,8% / -11,0%</dd></div><div><dt>Tempo-limite</dt><dd>10 horas</dd></div></dl></div>
          <div><p className="detailEyebrow">Superfícies</p><dl className="dataList">{surfaces.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>
        </div>
      </section>

      <footer className="stageDetailFooter shell"><a href="/#percurso">← Todas as etapas</a><p>Legends Ultimate · Serra Gaúcha</p></footer>
    </main>
  );
}
