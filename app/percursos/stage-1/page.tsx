const facts = [
  ["111 km", "Distância"],
  ["1.420 m", "Ascensão"],
  ["1.350 m", "Descida"],
  ["78%", "Não pavimentado"],
];

const surfaces = [
  ["Não pavimentado", "86,9 km"],
  ["Asfalto", "11,6 km"],
  ["Pavimentado", "11,2 km"],
  ["Paralelepípedo", "1,14 km"],
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
            <strong className="terrainHero">78<small>%</small></strong>
            <p className="terrainLabel">não pavimentado</p>
            <div className="surfaceBar"><i /><i /><i /><i /></div>
            <div className="surfaceLegend">
              {surfaces.map(([label,value], index) => <div key={label}><span className={`surfaceDot dot${index + 1}`} /><p>{label}</p><strong>{value}</strong></div>)}
            </div>
          </div>
          <div className="elevationPanel">
            <div className="panelTop"><span>02</span><p>Perfil de elevação</p><em>Canela → São Francisco de Paula</em></div>
            <img className="exactProfile" src="/stage-1-profile-exact.jpg" alt="Perfil altimétrico oficial da Stage 1 extraído do Komoot" />
            <p className="technicalSource">Perfil técnico oficial · Komoot</p>
          </div>
        </div>
        <div className="routeMapPanel"><div className="mapPanelHead"><div><span>03</span><p>Mapa do trajeto</p></div><p>Canela → São Francisco de Paula · 111 km</p></div><img src="/stage-1-map-exact.jpg" alt="Mapa oficial do percurso da Stage 1 no Komoot" /><a href="https://www.komoot.com/pt-br/tour/3089098231" target="_blank" rel="noreferrer">Explorar mapa no Komoot ↗</a></div>
      </section>

      <section className="stageData">
        <div className="shell stageDataGrid">
          <div><p className="detailEyebrow">Características</p><dl className="dataList"><div><dt>Largada</dt><dd>Canela</dd></div><div><dt>Chegada</dt><dd>São Francisco de Paula</dd></div><div><dt>Ponto mais alto</dt><dd>990 m</dd></div><div><dt>Ponto mais baixo</dt><dd>640 m</dd></div><div><dt>Tempo-limite</dt><dd>A definir</dd></div><div><dt>Estimativa Komoot</dt><dd>9h22</dd></div></dl></div>
          <div><p className="detailEyebrow">Superfícies</p><dl className="dataList">{surfaces.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><a className="button detailButton" href="https://www.komoot.com/pt-br/tour/3089098231" target="_blank" rel="noreferrer">Ver percurso no Komoot <span>↗</span></a></div>
        </div>
      </section>

      <footer className="stageDetailFooter shell"><a href="/#percurso">← Todas as etapas</a><p>Legends Ultimate · Serra Gaúcha</p></footer>
    </main>
  );
}
