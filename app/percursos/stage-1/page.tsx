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
            <div className="chartScale"><span>1.050 m</span><span>900 m</span><span>750 m</span><span>600 m</span></div>
            <svg className="elevationChart" viewBox="0 0 1000 340" role="img" aria-label="Perfil de elevação da Stage 1">
              <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c67a3b" stopOpacity=".5"/><stop offset="100%" stopColor="#c67a3b" stopOpacity="0"/></linearGradient></defs>
              <g className="chartGrid"><line x1="0" y1="45" x2="1000" y2="45"/><line x1="0" y1="130" x2="1000" y2="130"/><line x1="0" y1="215" x2="1000" y2="215"/><line x1="0" y1="300" x2="1000" y2="300"/></g>
              <path className="chartArea" d="M0 150 L35 170 L65 240 L95 265 L125 190 L155 225 L180 130 L215 120 L250 175 L285 210 L315 295 L350 190 L390 125 L430 105 L465 85 L505 110 L545 75 L580 115 L615 78 L650 80 L690 48 L730 32 L765 80 L795 42 L830 95 L870 110 L900 210 L930 190 L960 132 L1000 120 L1000 300 L0 300 Z"/>
              <path className="chartLine" d="M0 150 L35 170 L65 240 L95 265 L125 190 L155 225 L180 130 L215 120 L250 175 L285 210 L315 295 L350 190 L390 125 L430 105 L465 85 L505 110 L545 75 L580 115 L615 78 L650 80 L690 48 L730 32 L765 80 L795 42 L830 95 L870 110 L900 210 L930 190 L960 132 L1000 120"/>
            </svg>
            <div className="chartKm"><span>0 km</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100</span><span>111 km</span></div>
            <div className="chartHighlights"><div><span>↑</span><strong>1.420 m</strong><p>Subida</p></div><div><span>↓</span><strong>1.350 m</strong><p>Descida</p></div><div><span>△</span><strong>990 m</strong><p>Ponto mais alto</p></div><div><span>▽</span><strong>640 m</strong><p>Ponto mais baixo</p></div></div>
          </div>
        </div>
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
