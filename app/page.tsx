const metrics = [
  ["04", "dias de prova"],
  ["370", "quilômetros"],
  ["6.000", "metros de ascensão"],
  ["75%", "estradas de terra"],
];

const stages = [
  { n: "STAGE 01", city: "Canela", stats: "111 km · 1.420 m de ascensão", route: "/stage-route-1.png", href: "/percursos/stage-1" },
  { n: "STAGE 02", city: "São Francisco de Paula", stats: "89,1 km · 1.520 m de ascensão", route: "/stage-route-2.png", href: "/percursos/stage-2" },
  { n: "STAGE 03", city: "Gramado", stats: "99,7 km · 1.530 m de ascensão", route: "/stage-route-3.png", href: "/percursos/stage-3" },
  { n: "STAGE 04", city: "Nova Petrópolis", stats: "70 km · 1.530 m de ascensão", route: "/stage-route-4.png", href: "/percursos/stage-4" },
];

const destinations = [
  { name: "CANELA", icon: "/city-icon-canela.png", href: "https://canela.com.br/" },
  { name: "SÃO FRANCISCO\nDE PAULA", icon: "/city-icon-sao-francisco.png", href: "https://www.saofranciscodepaula.rs.gov.br/portal/turismo" },
  { name: "GRAMADO", icon: "/city-icon-gramado.png", href: "https://www.gramadoinesquecivel.tur.br/" },
  { name: "NOVA\nPETRÓPOLIS", icon: "/city-icon-nova-petropolis.png", href: "https://turismo.novapetropolis.rs.gov.br/" },
];

function Logo({ className = "" }: { className?: string }) {
  return <img className={`officialLogo ${className}`} src="/legends-logo-official.png" alt="Legends Bike Race" />;
}

export default function Home() {
  return (
    <main>
      <section className="hero" id="inicio">
        <nav className="nav shell" aria-label="Navegação principal">
          <a className="brand" href="#inicio" aria-label="Legends Bike Race — início"><Logo /></a>
          <div className="navLinks">
            <a href="#prova">A prova</a><a href="#percurso">Percurso</a><a href="#destinos">Destinos</a><a href="#experiencia">Experiência</a>
          </div>
          <a className="navCta" href="#inscricao">Quero participar</a>
        </nav>

        <div className="heroContent shell">
          <div className="heroLockup">
            <p className="eyebrow">Serra Gaúcha · Brasil</p>
            <img className="heroGladiator" src="/hero-gladiator-official.png" alt="" aria-hidden="true" />
            <h1>Onde a estrada<br />termina, a lenda<br />começa.</h1>
          </div>
        </div>

        <div className="heroBottom shell">
          <div className="heroDockActions">
            <a className="button" href="#inscricao">Viva a lenda <span>→</span></a>
            <a className="textLink" href="#prova">Descubra a prova ↓</a>
          </div>
          <div className="metrics">{metrics.map(([value,label]) => <div className="metric" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
          <p className="cities">Canela <i>·</i> São Francisco de Paula <i>·</i> Gramado <i>·</i> Nova Petrópolis</p>
        </div>
      </section>

      <section className="manifesto section shell" id="prova">
        <div className="sectionLabel"><span>01</span> A prova</div>
        <div className="manifestoCopy">
          <p className="eyebrow">Mais que uma competição</p>
          <h2>Uma travessia pela <em>Serra.</em> Uma jornada além do percurso.</h2>
          <div className="twoCols">
            <p>A Legends Ultimate é uma stage race de gravel criada para transformar distância em experiência. São quatro dias conectando alguns dos destinos mais emblemáticos da Serra Gaúcha.</p>
            <p>Autonavegação, estradas de terra e altimetria exigente formam uma jornada premium para atletas que valorizam o caminho tanto quanto a chegada.</p>
          </div>
          <div className="manifestoFeature">
            <div className="manifestoFeatureImage">
              <img src="/manifesto-guid-bike.webp" alt="Orientações de navegação autossuficiente para os atletas" />
            </div>
            <div className="manifestoFeatureCopy">
              <h3>Antes de aceitar o desafio, entenda a jornada.</h3>
              <i aria-hidden="true" />
              <p>Conheça a navegação, a classificação por pontos, as categorias e as quatro etapas.</p>
              <a href="/a-prova">Entenda como funciona <span>→</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className="route section" id="percurso">
        <div className="shell">
          <div className="routeHead"><div className="sectionLabel light"><span>02</span> O percurso</div><p>Quatro etapas. Uma história contínua.</p></div>
          <div className="stageGrid">{stages.map(stage => <a className="stage stageLink" href={stage.href} key={stage.n} aria-label={`Ver detalhes da etapa ${stage.n}: ${stage.city}`}><span className="stageN">{stage.n}</span><div className="stageRouteGraphic" aria-hidden="true"><img src={stage.route} alt="" /></div><div className="stageInfo"><h3>{stage.city}</h3><p className="stageStats">{stage.stats}</p><span className="stageAction">Ver percurso</span></div><span className="stageArrow">↗</span></a>)}</div>
        </div>
      </section>

      <section className="destinations section shell" id="destinos">
        <div className="sectionLabel"><span>03</span> O território</div>
        <div className="destinationIntro"><h2>Quatro destinos.<br /><em>Uma única Serra.</em></h2><div className="destinationCopy"><p>Da arquitetura às paisagens rurais, cada cidade entrega um capítulo próprio. Juntas, revelam uma região feita para o gravel.</p><a className="destinationCta" href="#cidades">Conheça as cidades do percurso <span>→</span></a></div></div>
        <div className="destinationNames" id="cidades">{destinations.map(destination => <a href={destination.href} target="_blank" rel="noreferrer" key={destination.name} aria-label={`Conheça ${destination.name.replace("\n", " ")}`}><span className="cityIcon"><img src={destination.icon} alt="" aria-hidden="true" /></span><strong>{destination.name.split("\n").map((line, index) => <span key={line}>{line}{index === 0 && destination.name.includes("\n") ? <br /> : null}</span>)}</strong><i aria-hidden="true">↗</i></a>)}</div>
      </section>

      <section className="experience section" id="experiencia">
        <div className="shell experienceGrid">
          <div><div className="sectionLabel light"><span>04</span> A experiência</div><h2>Seu corpo cruza a Serra.<br /><em>Sua história fica.</em></h2></div>
          <div className="features"><div><span>01</span><h3>Autonavegação</h3><p>Liberdade, leitura de percurso e conexão real com o território.</p></div><div><span>02</span><h3>Estrutura premium</h3><p>Cuidado e excelência antes, durante e depois de cada etapa.</p></div><div><span>03</span><h3>Turismo esportivo</h3><p>Esporte, gastronomia, cultura e hospitalidade em uma só jornada.</p></div></div>
        </div>
      </section>

      <section className="finalCta" id="inscricao">
        <div className="shell"><Logo className="ctaLogo" /><p className="eyebrow">A estrada está chamando</p><h2>A próxima lenda<br />pode ser a sua.</h2><p>Cadastre seu interesse e receba as novidades da primeira edição.</p><a className="button" href="mailto:contato@threerace.com.br?subject=Tenho interesse na Legends Ultimate">Quero viver a Legends <span>→</span></a></div>
      </section>

      <footer className="footer shell"><Logo className="footerLogo" /><p>Uma experiência Threerace Sports</p><p>Serra Gaúcha · Brasil</p></footer>
    </main>
  );
}