const numbers = [
  ["04", "dias de prova"],
  ["370 km", "de percurso"],
  ["6.000 m", "de ascensão"],
  ["75%", "em estradas de terra"],
];

const journey = [
  ["01", "Antes da largada", "Recepção dos atletas, entrega do kit, orientações técnicas e disponibilização dos arquivos de navegação."],
  ["02", "Durante a etapa", "Cada atleta percorre a rota por autonavegação, administrando ritmo, alimentação, hidratação e estratégia."],
  ["03", "Ao cruzar a chegada", "A estrutura de chegada recebe os participantes para recuperação, convivência e preparação para o dia seguinte."],
  ["04", "A consagração", "Quem completa a travessia vive a chegada final em Gramado e passa a fazer parte da história da Legends."],
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

      <section className="aboutConcept">
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

      <section className="aboutGallery shell" aria-label="Experiência Legends">
        <a className="galleryMain" href="https://www.instagram.com/legends.race/p/DGa0nXcxZvL/" target="_blank" rel="noreferrer">
          <img src="/about-instagram-2.jpg" alt="Atletas Legends celebrando a conclusão da prova" />
          <span>Superação compartilhada · Ver no Instagram ↗</span>
        </a>
        <div className="galleryStatement">
          <p className="detailEyebrow">Mais que quilômetros</p>
          <h2>O desafio termina.<br /><em>A história permanece.</em></h2>
          <p>Cada chegada reúne esforço, território e pessoas. É essa experiência que transforma participantes em Legends.</p>
        </div>
        <a className="galleryPortrait" href="https://www.instagram.com/legends.race/p/DGa0nXcxZvL/" target="_blank" rel="noreferrer">
          <img src="/about-instagram-3.jpg" alt="Atleta Legends com medalha e troféu após completar o desafio" />
          <span>Quem aceita o desafio escreve a própria lenda ↗</span>
        </a>
      </section>

      <section className="aboutNavigation shell">
        <div>
          <p className="detailEyebrow">Autonavegação</p>
          <h2>Você escolhe o ritmo.<br /><em>O percurso mostra o caminho.</em></h2>
        </div>
        <div className="navigationText">
          <p>Os atletas recebem o arquivo oficial de cada etapa para navegação por GPS. O trajeto não depende de uma sequência contínua de placas: atenção, leitura do percurso e autonomia fazem parte do desafio.</p>
          <p>Cada participante deve largar preparado para cuidar da própria estratégia de hidratação, alimentação, vestuário, ferramentas e reparos básicos, respeitando as orientações e os pontos de apoio definidos pela organização.</p>
        </div>
      </section>

      <section className="dailyJourney">
        <div className="shell">
          <div className="journeyHead"><p className="detailEyebrow">Como funciona</p><h2>Um dia de cada vez.<br /><em>Uma história contínua.</em></h2></div>
          <div className="journeyGrid">
            {journey.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="aboutAudience shell">
        <p className="detailEyebrow">Para quem é</p>
        <div>
          <h2>Para quem entende que<br /><em>chegar é parte da jornada.</em></h2>
          <p>A Legends foi criada para ciclistas de gravel e mountain bike com preparo para longas distâncias, que valorizam desafio, paisagem, cultura local e uma experiência esportiva premium. Não é necessário ser atleta profissional, mas treinamento, planejamento e autonomia são essenciais.</p>
          <a className="button aboutButton" href="/#percurso">Conheça as etapas <span>→</span></a>
        </div>
      </section>

      <footer className="stageDetailFooter shell"><a href="/">← Voltar ao site</a><p>Legends Ultimate · Serra Gaúcha</p></footer>
    </main>
  );
}
