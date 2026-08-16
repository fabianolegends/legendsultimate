import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stage 04: Nova Petrópolis a Canela",
  description: "Conheça a etapa final da Legends Ultimate e da Legends Short: 70 km e 1.576 m+ entre Nova Petrópolis e Canela.",
  alternates: { canonical: "/percursos/stage-4" },
  openGraph: { url: "/percursos/stage-4", title: "Stage 04: Nova Petrópolis a Canela", description: "70 km e 1.576 m+ na etapa final da Legends Ultimate e da Legends Short." },
};

const facts = [["70,0 km", "Distância"],["1.576 m", "Ascensão"],["1.316 m", "Descida"],["62%", "Não pavimentado"]];
const surfaces = [["Não pavimentado", "43,1 km"],["Pavimentado", "26,9 km"]];

export default function StageFour() {
  return (
    <main className="stagePage">
      <header className="stageDetailNav shell"><a href="/percursos" className="backLink">← Voltar aos percursos</a><img src="/legends-logo-official.png" alt="Legends Bike Race" className="detailLogo" /></header>
      <section className="stageDetailHero stage4Hero"><div className="shell stageHeroInner"><div className="stageKicker"><span>Stage 04</span> Nova Petrópolis → Canela</div><h1>A chegada<br />da lenda.</h1><p>O capítulo final parte da tradição de Nova Petrópolis e cruza vales, colônias e caminhos de terra até a chegada em Canela.</p><a className="stageCityLink" href="https://turismo.novapetropolis.rs.gov.br/" target="_blank" rel="noreferrer">Conheça a cidade da largada <span>↗</span></a><div className="stageFacts">{facts.map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></div></section>
      <section className="stageProfile shell">
        <div className="profileIntro"><div><p className="detailEyebrow">Perfil da etapa</p><h2>O último desafio.<br /><em>A consagração.</em></h2></div><p>Uma etapa de terreno variado, com sucessivas ascensões na primeira metade, um setor mais veloz entre os quilômetros 40 e 65 e a sequência final que conduz o participante até a chegada em Canela.</p></div>
        <div className="performancePanel"><div className="surfacePanel"><div className="panelTop"><span>01</span><p>Composição do terreno</p></div><strong className="terrainHero">62<small>%</small></strong><p className="terrainLabel">não pavimentado</p><div className="surfaceBar surfaceBarTwo"><i /><i /></div><div className="surfaceLegend">{surfaces.map(([label,value],index)=><div key={label}><span className={`surfaceDot dot${index+1}`} /><p>{label}</p><strong>{value}</strong></div>)}</div></div><div className="elevationPanel"><div className="panelTop"><span>02</span><p>Perfil de elevação</p><em>Nova Petrópolis → Canela</em></div><div className="profileChartWrap"><img className="exactProfile stageFourProfileExact" src="/stage-4-profile-transparent.png" alt="Perfil altimétrico oficial da Stage 4" /></div><p className="technicalSource">Dados técnicos · Ride with GPS</p></div></div>
        <div className="routeMapPanel"><div className="mapPanelHead"><div><span>03</span><p>Mapa do trajeto</p></div><p>Nova Petrópolis → Canela · 70,0 km</p></div><img src="/stage-4-map-rwgps-v2.jpg" alt="Mapa oficial do percurso da Stage 4" /></div>
      </section>
      <section className="stageData"><div className="shell stageDataGrid"><div><p className="detailEyebrow">Características</p><dl className="dataList"><div><dt>Largada</dt><dd>Nova Petrópolis</dd></div><div><dt>Chegada</dt><dd>Canela</dd></div><div><dt>Ponto mais alto</dt><dd>850 m</dd></div><div><dt>Ponto mais baixo</dt><dd>500 m</dd></div><div><dt>Tempo estimado</dt><dd>3h41</dd></div><div><dt>Inclinação máxima</dt><dd>+12,2% / -13,1%</dd></div><div><dt>Tempo-limite</dt><dd>6 horas</dd></div></dl></div><div><p className="detailEyebrow">Superfícies</p><dl className="dataList">{surfaces.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div></div></section>
      <footer className="stageDetailFooter shell"><a href="/percursos">← Todas as etapas</a><p>Legends Ultimate + Short · Serra Gaúcha</p></footer>
    </main>
  );
}
