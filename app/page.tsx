const metrics = [
  ["04", "dias"],
  ["360", "quilômetros"],
  ["6.000", "metros de ascensão"],
  ["100", "vagas"],
];

const stages = [
  { n: "STAGE 01", city: "Canela", stats: "111 km · 1.420 m+", route: "/stage-route-1.png", href: "/percursos/stage-1" },
  { n: "STAGE 02", city: "São Francisco de Paula", stats: "89,1 km · 1.520 m+", route: "/stage-route-2.png", href: "/percursos/stage-2" },
  { n: "STAGE 03", city: "Gramado", stats: "99,7 km · 1.530 m+", route: "/stage-route-3.png", href: "/percursos/stage-3" },
  { n: "STAGE 04", city: "Nova Petrópolis", stats: "70 km · 1.530 m+", route: "/stage-route-4.png", href: "/percursos/stage-4" },
];

const destinations = [
  { name: "CANELA", icon: "/city-icon-canela.png", href: "https://canela.com.br/" },
  { name: "SÃO FRANCISCO\nDE PAULA", icon: "/city-icon-sao-francisco.png", href: "https://www.saofranciscodepaula.rs.gov.br/portal/turismo" },
  { name: "GRAMADO", icon: "/city-icon-gramado.png", href: "https://www.gramadoinesquecivel.tur.br/" },
  { name: "NOVA\nPETRÓPOLIS", icon: "/city-icon-nova-petropolis.png", href: "https://turismo.novapetropolis.rs.gov.br/" },
];

const differences = [
  ["01", "Autonavegação", "Você recebe os arquivos GPX e percorre cada etapa usando GPS, com autonomia, leitura de percurso e estratégia."],
  ["02", "Bagagem transportada", "A organização leva sua bag de 50 litros entre as cidades-base. Você pedala apenas com o necessário para o dia."],
  ["03", "Hospedagens adaptadas", "Hotéis oficiais e opções indicadas para facilitar check-in, guarda da bike, recuperação e deslocamentos."],
  ["04", "Estrutura pós-etapa", "Bike wash, suporte mecânico, briefing e serviços opcionais de recuperação ao final de cada dia."],
];

const timeline = [
  ["06:30", "Café da manhã e preparação"],
  ["08:00", "Largada da etapa"],
  ["Durante", "Dois checkpoints com hidratação e carimbo do passaporte"],
  ["Chegada", "Controle de tempo, bike wash e mecânica"],
  ["Fim de tarde", "Hotel, recuperação e organização da bagagem"],
  ["Noite", "Briefing da próxima etapa e jantar opcional"],
];

const included = [
  "Jersey de ciclismo", "Camiseta casual", "Cap de ciclismo", "Meias", "Bag de 50 litros",
  "Transporte de bagagem", "Seguro básico", "Bike wash pós-etapa", "Mecânica pós-prova",
  "Placa personalizada", "GPX dos percursos", "Hidratação nos checkpoints", "Medalha de conclusão",
];

const safety = [
  ["SPOT", "Rastreamento satelital durante as etapas."],
  ["STARLINK", "Comunicação entre os veículos oficiais de apoio."],
  ["RESGATE", "Ambulância, equipes de resgate e veículos de segurança."],
  ["SEM APOIO EXTERNO", "A assistência é centralizada pela organização para preservar igualdade e segurança."],
];

const faqs = [
  ["É uma prova para iniciantes?", "Não. Não é necessário ser profissional, mas o participante deve estar treinado para quatro dias consecutivos, distância elevada e aproximadamente 1.500 metros de ascensão por etapa."],
  ["Posso participar com MTB ou E-bike?", "Sim, no modo Experience. MTB e E-bike realizam a jornada sem classificação, registro competitivo ou premiação."],
  ["Como funciona a navegação?", "O GPX será disponibilizado no site uma semana antes do evento. É obrigatório usar GPS com navegação e autonomia mínima de 15 horas."],
  ["O que acontece se eu errar o percurso?", "O atleta deve retornar ao ponto em que deixou o trajeto oficial e seguir novamente pelo percurso correto, evitando desclassificação."],
  ["A organização transporta minha bagagem?", "Sim. Cada participante recebe uma bag de 50 litros, transportada entre as cidades-base pela organização."],
  ["Hospedagem e alimentação estão incluídas?", "Não. A organização oferecerá hotéis oficiais, opções adaptadas e jantares opcionais contratados separadamente."],
];

function Logo({ className = "" }: { className?: string }) {
  return <img className={`officialLogo ${className}`} src="/legends-logo-official.png" alt="Legends Bike Race" />;
}

export default function Home() {
  return (
    <main className="redesign">
      <style>{`
        .redesign{--paper:#f4f0db;--ink:#0b0d0c;--copper:#c67a3b;--line:rgba(198,122,59,.34)}
        .redesign .wide{width:min(1440px,calc(100% - 96px));margin-inline:auto}
        .redesign .kicker{text-transform:uppercase;letter-spacing:.24em;color:var(--copper);font:600 14px 'Barlow Condensed';margin:0 0 18px}
        .redesign h2{font:700 clamp(48px,5.7vw,88px) 'Barlow Condensed';text-transform:uppercase;line-height:.9;letter-spacing:-.02em;margin:0}
        .redesign h2 em{font-style:normal;color:var(--copper)}
        .redesign .sectionHead{display:grid;grid-template-columns:1.4fr .8fr;gap:80px;align-items:end;margin-bottom:70px}
        .redesign .sectionHead p{font-size:18px;line-height:1.75;color:#9ba097;margin:0}
        .heroRedesign{min-height:100svh;background:linear-gradient(90deg,rgba(6,8,7,.98),rgba(6,8,7,.77) 38%,rgba(6,8,7,.14) 72%),linear-gradient(0deg,rgba(6,8,7,.92),transparent 44%),url('/hero-production.jpg') center/cover;display:grid;grid-template-rows:104px 1fr auto;color:#f1ece3}
        .heroRedesign .nav{border-bottom:1px solid rgba(241,236,227,.12)}
        .heroMain{display:flex;align-items:center;padding:70px 0}.heroCopy{max-width:790px}
        .heroCopy h1{font:700 clamp(64px,7.2vw,116px) 'Barlow Condensed';text-transform:uppercase;line-height:.84;margin:18px 0 28px}
        .heroIntro{font-size:20px;line-height:1.55;color:#ddd5c9;max-width:680px}.heroCtas{display:flex;gap:20px;align-items:center;margin-top:34px;flex-wrap:wrap}
        .secondaryCta{padding:17px 24px;border:1px solid rgba(241,236,227,.35);text-transform:uppercase;letter-spacing:.1em;font:600 14px 'Barlow Condensed'}
        .heroStats{display:grid;grid-template-columns:repeat(4,1fr);background:rgba(11,13,12,.88);border:1px solid var(--line);backdrop-filter:blur(12px)}
        .heroStat{padding:22px 28px;border-right:1px solid var(--line)}.heroStat:last-child{border:0}.heroStat strong{display:block;font:700 48px 'Barlow Condensed'}.heroStat span{text-transform:uppercase;letter-spacing:.12em;color:#b8b0a4;font:500 12px 'Barlow Condensed'}

        .manifestoRedesign{background:var(--paper);color:var(--ink);padding:110px 0}
        .manifestoFeature{min-height:auto;background:none;overflow:visible}
        .manifestoContent{width:100%;padding:0}
        .manifestoQuote{font:700 clamp(30px,3.35vw,54px) 'Barlow Condensed';text-transform:uppercase;line-height:1.08;max-width:none;margin:0}.manifestoQuote em{font-style:normal;color:var(--copper)}
        .manifestoButton{display:flex;align-items:center;justify-content:space-between;gap:24px;width:min(100%,560px);margin-top:42px;padding:22px 28px;background:var(--copper);color:#111;font:700 18px 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase}.manifestoButton span:last-child{font-size:28px}
        .manifestoHighlights{display:grid;grid-template-columns:repeat(4,1fr);width:100%;margin-top:72px;border-top:1px solid rgba(17,17,17,.22)}
        .manifestoHighlights span{padding:24px 24px 0 0;border-right:1px solid rgba(17,17,17,.2);font:700 15px 'Barlow Condensed';line-height:1.25;text-transform:uppercase;letter-spacing:.05em}.manifestoHighlights span:not(:first-child){padding-left:24px}.manifestoHighlights span:last-child{border-right:0}

        .factsBand{background:#111411;color:#f1ece3;padding:120px 0}.factsGrid{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
        .fact{padding:34px 28px;border-right:1px solid var(--line)}.fact:last-child{border:0}.fact span{color:var(--copper);font:600 13px 'Barlow Condensed';letter-spacing:.16em}.fact h3{font:700 31px 'Barlow Condensed';text-transform:uppercase;margin:38px 0 16px}.fact p{color:#989e95;line-height:1.65;margin:0}
        .modes{background:var(--paper);color:var(--ink);padding:140px 0}.modeGrid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.modeCard{padding:48px;border:1px solid #bdb4a7;background:#ede6d9}.modeCard.dark{background:#101310;color:#f1ece3;border-color:#101310}.modeCard .tag{color:var(--copper);text-transform:uppercase;letter-spacing:.16em;font:600 13px 'Barlow Condensed'}.modeCard h3{font:700 48px 'Barlow Condensed';text-transform:uppercase;margin:22px 0}.modeCard p{line-height:1.75;color:#555950}.modeCard.dark p{color:#a5aaa1}.modeCard ul{list-style:none;padding:0;margin:28px 0 0;display:grid;gap:12px}.modeCard li:before{content:'→';color:var(--copper);margin-right:12px}
        .daySection{background:#0b0d0c;color:#f1ece3;padding:140px 0}.timeline{border-top:1px solid var(--line)}.timelineItem{display:grid;grid-template-columns:140px 1fr;gap:40px;padding:24px 0;border-bottom:1px solid var(--line)}.timelineItem strong{color:var(--copper);font:700 28px 'Barlow Condensed'}.timelineItem span{font-size:18px;color:#c2c7bf}
        .routePreview{background:#121411;color:#f1ece3;padding:140px 0}.stageGridNew{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.stageNew{padding:30px 24px;min-height:430px;border-right:1px solid var(--line);display:flex;flex-direction:column;justify-content:space-between;transition:.25s}.stageNew:last-child{border:0}.stageNew:hover{background:#1a1e19;transform:translateY(-6px)}.stageNew small{color:var(--copper);letter-spacing:.15em;font:600 13px 'Barlow Condensed'}.stageNew img{width:100%;height:145px;object-fit:contain;opacity:.9}.stageNew h3{font:700 34px 'Barlow Condensed';text-transform:uppercase;line-height:.95;margin:0 0 12px}.stageNew p{color:#8f948c;font:500 13px 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;margin:0}
        .destinationStory{background:var(--paper);color:var(--ink);padding:140px 0}.destinationText{display:grid;grid-template-columns:1.4fr .8fr;gap:80px}.destinationText p{font-size:18px;line-height:1.8;color:#4d504a}.cityStrip{display:grid;grid-template-columns:repeat(4,1fr);margin-top:70px;border-top:1px solid #bdb4a7}.cityStrip a{padding:30px 20px 0 0;min-height:150px;border-right:1px solid #bdb4a7}.cityStrip a:last-child{border:0;padding-left:22px}.cityStrip strong{font:700 34px 'Barlow Condensed';text-transform:uppercase;line-height:.95}.cityStrip span{display:block;color:var(--copper);margin-top:16px;font-size:13px;text-transform:uppercase;letter-spacing:.1em}
        .includedSection{background:#101310;color:#f1ece3;padding:140px 0}.includedGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}.includedItem{background:#101310;padding:24px 26px;font:600 18px 'Barlow Condensed';text-transform:uppercase}.includedItem:before{content:'✓';color:var(--copper);margin-right:12px}
        .safetySection{background:#0b0d0c;color:#f1ece3;padding:120px 0}.safetyGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}.safetyCard{border:1px solid var(--line);padding:30px}.safetyCard h3{font:700 26px 'Barlow Condensed';color:var(--copper);margin:0 0 14px}.safetyCard p{color:#9ca198;line-height:1.6;margin:0}
        .profileSection{background:var(--paper);color:var(--ink);padding:140px 0}.profileBox{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}.profileBox blockquote{font:700 clamp(42px,5vw,72px) 'Barlow Condensed';text-transform:uppercase;line-height:.92;margin:0}.profileBox blockquote em{font-style:normal;color:var(--copper)}.profileBox ul{list-style:none;padding:0;margin:0;display:grid;gap:18px}.profileBox li{border-bottom:1px solid #bdb4a7;padding-bottom:18px;font-size:17px;line-height:1.6}
        .faqSection{background:#121411;color:#f1ece3;padding:140px 0}.faqList{border-top:1px solid var(--line)}.faqList details{border-bottom:1px solid var(--line);padding:24px 0}.faqList summary{cursor:pointer;font:600 24px 'Barlow Condensed';text-transform:uppercase;list-style:none}.faqList summary:after{content:'+';float:right;color:var(--copper)}.faqList details[open] summary:after{content:'–'}.faqList p{max-width:850px;color:#a9aea6;line-height:1.75}
        .priorityCta{padding:160px 0;text-align:center;color:#f1ece3;background:linear-gradient(rgba(7,9,8,.75),rgba(7,9,8,.95)),url('/hero-production.jpg') center/cover}.priorityCta h2{max-width:1000px;margin:0 auto}.priorityCta p{color:#b8bdb5;max-width:680px;margin:28px auto 34px;line-height:1.7}.priorityCta .button{min-width:280px}
        @media(max-width:1000px){.redesign .wide{width:min(100% - 48px,920px)}.redesign .sectionHead,.destinationText,.profileBox{grid-template-columns:1fr}.manifestoQuote{font-size:clamp(30px,5vw,46px)}.factsGrid,.safetyGrid,.stageGridNew{grid-template-columns:1fr 1fr}.modeGrid{grid-template-columns:1fr}.includedGrid{grid-template-columns:1fr 1fr}}
        @media(max-width:640px){.redesign .wide{width:calc(100% - 32px)}.heroRedesign{grid-template-rows:82px 1fr auto;min-height:100svh;background-position:68% center}.heroMain{padding:44px 0}.heroCopy h1{font-size:56px}.heroIntro{font-size:16px}.heroStats{grid-template-columns:1fr 1fr}.heroStat:nth-child(2){border-right:0}.heroStat:nth-child(-n+2){border-bottom:1px solid var(--line)}.heroStat strong{font-size:38px}.manifestoRedesign,.factsBand,.modes,.daySection,.routePreview,.destinationStory,.includedSection,.safetySection,.profileSection,.faqSection{padding:78px 0}.manifestoQuote{font-size:30px;line-height:1.04}.manifestoButton{font-size:16px;padding:18px 20px;margin-top:30px}.manifestoHighlights{grid-template-columns:1fr 1fr;margin-top:48px}.manifestoHighlights span{border-bottom:1px solid rgba(17,17,17,.2);padding:18px 10px 18px 0}.manifestoHighlights span:not(:first-child){padding-left:10px}.factsGrid,.stageGridNew,.safetyGrid,.includedGrid,.cityStrip{grid-template-columns:1fr}.fact,.stageNew,.safetyCard,.cityStrip a{border-right:0;border-bottom:1px solid var(--line)}.modeCard{padding:34px 26px}.timelineItem{grid-template-columns:90px 1fr;gap:18px}.stageNew{min-height:330px}.destinationText{gap:20px}.cityStrip a:last-child{padding-left:0}.includedGrid{background:transparent;border:0}.includedItem{border-bottom:1px solid var(--line)}.profileBox{gap:34px}}
      `}</style>

      <section className="heroRedesign" id="inicio">
        <nav className="nav wide" aria-label="Navegação principal">
          <a className="brand" href="#inicio"><Logo /></a>
          <div className="navLinks"><a href="/a-prova">A prova</a><a href="#modalidades">Modalidades</a><a href="#percurso">Percurso</a><a href="#destino">Destino</a><a href="#faq">FAQ</a></div>
          <a className="navCta" href="#interesse">Lista prioritária</a>
        </nav>
        <div className="heroMain wide"><div className="heroCopy"><p className="kicker">Serra Gaúcha · Brasil</p><h1>Onde o asfalto termina, a lenda começa.</h1><p className="heroIntro"><strong>Uma Stage Race Premium de Gravel pela Serra Gaúcha.</strong><br />Quatro etapas, quatro cidades e uma travessia criada para quem procura muito mais do que uma prova.</p><div className="heroCtas"><a className="button" href="/a-prova">Conheça a Legends <span>→</span></a><a className="secondaryCta" href="#interesse">Entre para a lista prioritária</a></div></div></div>
        <div className="wide"><div className="heroStats">{metrics.map(([value,label]) => <div className="heroStat" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></div>
      </section>

      <section className="manifestoRedesign" id="conceito"><div className="wide manifestoFeature">
        <div className="manifestoContent">
          <p className="kicker">Por que ela existe</p>
          <h2 className="manifestoQuote">A Legends não foi criada para quem procura apenas uma medalha. Foi criada para quem acredita que a bicicleta é o melhor passaporte para <em>descobrir lugares, pessoas e histórias.</em></h2>
          <a className="manifestoButton" href="/a-prova"><span>Entenda como funciona a Legends</span><span>→</span></a>
        </div>
      </div></section>

      <section className="modes" id="modalidades"><div className="wide"><div className="sectionHead"><div><p className="kicker">Escolha como viver a Legends</p><h2>Competir ou experimentar.<br /><em>A jornada é a mesma.</em></h2></div><p>O participante escolhe o propósito: disputar a classificação no gravel ou realizar a travessia em modo turismo.</p></div><div className="modeGrid"><div className="modeCard dark"><span className="tag">Modalidade competitiva</span><h3>Legends Gravel Race</h3><p>Para ciclistas de gravel ou cyclocross que desejam disputar as quatro etapas com tempo registrado, classificação por pontos, categorias e premiação final.</p><ul><li>Classificação oficial</li><li>Pontuação por etapa</li><li>Categorias por idade</li><li>Troféus ao final da travessia</li></ul></div><div className="modeCard"><span className="tag">Modalidade turismo</span><h3>Legends Experience</h3><p>Para participantes de MTB e E-bike que desejam viver o mesmo percurso e a mesma estrutura, sem pressão por tempo, ranking ou resultado competitivo.</p><ul><li>Sem classificação</li><li>MTB e E-bike permitidas</li><li>Mesma logística e segurança</li><li>Foco em turismo e desafio pessoal</li></ul></div></div></div></section>
      <section className="factsBand"><div className="wide"><div className="sectionHead"><div><p className="kicker">O que torna a Legends diferente</p><h2>Aventura com estrutura.<br /><em>Autonomia com cuidado.</em></h2></div><p>Uma experiência pensada para eliminar a complexidade logística sem retirar do atleta o protagonismo da jornada.</p></div><div className="factsGrid">{differences.map(([n,title,text]) => <div className="fact" key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
      <section className="routePreview" id="percurso"><div className="wide"><div className="sectionHead"><div><p className="kicker">Quatro etapas</p><h2>Uma história contínua.<br /><em>Quatro destinos.</em></h2></div><p>360 quilômetros, aproximadamente 6.000 metros de ascensão e 70% do percurso em estradas de terra.</p></div><div className="stageGridNew">{stages.map(stage => <a className="stageNew" href={stage.href} key={stage.n}><small>{stage.n}</small><img src={stage.route} alt="" /><div><h3>{stage.city}</h3><p>{stage.stats}</p></div></a>)}</div></div></section>
      <section className="daySection" id="experiencia"><div className="wide"><div className="sectionHead"><div><p className="kicker">Um dia na Legends</p><h2>Pedalar. Recuperar.<br /><em>Descobrir. Recomeçar.</em></h2></div><p>Cada dia tem seu próprio ritmo, mas todos terminam preparando o corpo, a bicicleta e a estratégia para um novo capítulo.</p></div><div className="timeline">{timeline.map(([time,text]) => <div className="timelineItem" key={time+text}><strong>{time}</strong><span>{text}</span></div>)}</div></div></section>
      <section className="destinationStory" id="destino"><div className="wide"><div className="destinationText"><div><p className="kicker">O Brasil que poucos conhecem</p><h2>A Serra não é cenário.<br /><em>Ela faz parte da prova.</em></h2></div><div><p>A Serra Gaúcha reúne estradas rurais, araucárias, vales, cânions, pequenas comunidades, gastronomia reconhecida e cidades marcadas pela imigração europeia. Cada etapa revela um novo território e uma nova forma de conhecer o Brasil sobre duas rodas.</p><p>O ciclista estrangeiro virá à Legends para viver, de gravel, uma travessia premium por um Brasil surpreendente que poucos no mundo conhecem.</p></div></div><div className="destinationNames" id="cidades">{destinations.map(destination => <a href={destination.href} target="_blank" rel="noreferrer" key={destination.name} aria-label={`Conheça ${destination.name.replace("\n", " ")}`}><span className="cityIcon"><img src={destination.icon} alt="" aria-hidden="true" /></span><strong>{destination.name.split("\n").map((line, index) => <span key={line}>{line}{index === 0 && destination.name.includes("\n") ? <br /> : null}</span>)}</strong><i aria-hidden="true">↗</i></a>)}</div></div></section>
      <section className="includedSection"><div className="wide"><div className="sectionHead"><div><p className="kicker">O que está incluído</p><h2>Você cuida da jornada.<br /><em>Nós cuidamos da estrutura.</em></h2></div><p>O pacote foi desenhado para que o participante concentre energia no percurso, na recuperação e na experiência.</p></div><div className="includedGrid">{included.map(item => <div className="includedItem" key={item}>{item}</div>)}</div></div></section>
      <section className="safetySection"><div className="wide"><div className="sectionHead"><div><p className="kicker">Segurança e suporte</p><h2>Aventura exige liberdade.<br /><em>Confiança exige estrutura.</em></h2></div><p>A operação utiliza comunicação, rastreamento e resgate dimensionados para uma travessia de múltiplos dias.</p></div><div className="safetyGrid">{safety.map(([title,text]) => <div className="safetyCard" key={title}><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
      <section className="profileSection"><div className="wide profileBox"><blockquote>Não é para iniciantes.<br />Não é para todos.<br /><em>É para quem está pronto.</em></blockquote><ul><li>Entusiastas do ciclismo com mais de 35 anos, tempo para viajar e desejo de descobrir novos destinos.</li><li>Não é necessário ser atleta profissional, mas é indispensável estar treinado para quatro dias consecutivos.</li><li>O participante deve ter autonomia, disciplina e capacidade de administrar esforço, alimentação, equipamento e navegação.</li><li><strong>Not for everyone. Only for Legends.</strong></li></ul></div></section>
      <section className="faqSection" id="faq"><div className="wide"><div className="sectionHead"><div><p className="kicker">Perguntas frequentes</p><h2>Antes de aceitar o desafio,<br /><em>entenda a jornada.</em></h2></div><p>As informações definitivas de data, valores, hotéis e programação serão publicadas após a confirmação oficial da primeira edição.</p></div><div className="faqList">{faqs.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></div></section>
      <section className="priorityCta" id="interesse"><div className="wide"><Logo className="ctaLogo" /><p className="kicker">A data ainda será revelada</p><h2>Seja um dos<br /><em>100 Legends.</em></h2><p>Entre para a lista prioritária e receba em primeira mão a data oficial, os valores, os hotéis parceiros e a abertura das inscrições.</p><a className="button" href="mailto:contato@threerace.com.br?subject=Quero entrar na lista prioritária da Legends">Entrar para a lista prioritária <span>→</span></a></div></section>
      <footer className="footer wide"><Logo className="footerLogo" /><p>Uma experiência Threerace Sports</p><p>Serra Gaúcha · Brasil</p></footer>
    </main>
  );
}
