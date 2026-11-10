"use client";

import { useEffect, useRef, useState } from "react";

const media = "https://fwexmctrrhavnksunxer.supabase.co/storage/v1/object/public/legends-athlete-cards/";

const athletes = [
  { name: "André Ferreira", location: "Brasília, DF · Brasil", image: `${media}andre-ferreira.jpg` },
  { name: "Charles Grutzmann", location: "Itapiranga, SC · Brasil", image: `${media}CHARLES%20GRUTZMANN-%20Legends%202027%20.jpg` },
  { name: "Fabiano Pellenz", location: "Palhoça, SC · Brasil", image: `${media}FABIANO%20PELLENZ%20-%20Legends%202027%20.jpg` },
  { name: "Jeison Reis", location: "Caxias do Sul, RS · Brasil", image: `${media}JEISON%20REIS%20-%20Legends%202027%20.jpg` },
  { name: "Luis Cândido de Azevedo", location: "Osório, RS · Brasil", image: `${media}LUIS%20CANDIDO%20DE%20AZEVEDO%20-%20Legends%202027%20.jpg` },
  { name: "Thiago de Aguiar Leão", location: "Porto Alegre, RS · Brasil", image: `${media}thiago-de-aguiar-leao.jpg` },
  { name: "Auri De Bortoli", image: `${media}Auri%20De%20Bortoli%20%20-%20Legends%202027%20.jpg` },
  { name: "Claiton Bittencourt", image: `${media}CLAITON%20BITTENCOURT%20%20-%20Legends%202027%20.jpg` },
  { name: "Iveraldo Zampieron", image: `${media}Iveraldo%20Zampieron%20-%20Legends%202027%20.jpg` },
  { name: "Santuzza Andrade", image: `${media}Santuzza%20Andrade%20-%20Legends%202027%20.jpg` },
];

export default function LegendsAthleteCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  function move(direction: 1 | -1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (direction === 1 && viewport.scrollLeft >= maxScroll - 8) {
      viewport.scrollLeft = 0;
      return;
    }
    if (direction === -1 && viewport.scrollLeft <= 8) {
      viewport.scrollLeft = maxScroll;
      return;
    }
    viewport.scrollLeft += direction * viewport.clientWidth * 0.86;
  }

  useEffect(() => {
    if (isPaused) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const speed = 40;
    const timer = window.setInterval(() => {
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      if (maxScroll <= 0) return;
      const nextScroll = viewport.scrollLeft + speed * 0.032;
      viewport.scrollLeft = nextScroll >= maxScroll ? 0 : nextScroll;
    }, 32);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section className="legendsAthletes" aria-labelledby="legends-athletes-title">
      <style>{`
        .legendsAthletes{padding:28px 0 96px;background:#0e110f;color:#f1ece3;overflow:hidden}
        .legendsAthletesHead{display:flex;align-items:end;justify-content:space-between;gap:36px;margin-bottom:30px}
        .legendsAthletesHead .kicker{margin:0 0 10px;color:#c67a3b;font:700 13px 'Barlow Condensed';letter-spacing:.22em;text-transform:uppercase}
        .legendsAthletes h2{margin:0;font:700 clamp(46px,5vw,72px)/.9 'Barlow Condensed';letter-spacing:-.025em;text-transform:uppercase}
        .legendsAthletes h2 em{font-style:normal;color:#c67a3b}
        .legendsAthletesHead>p{max-width:430px;margin:0;color:#aeb3aa;font-size:16px;line-height:1.6}
        .legendsAthleteControls{display:flex;gap:8px}
        .legendsAthleteControls button{display:grid;place-items:center;width:48px;height:48px;border:1px solid rgba(198,122,59,.55);background:transparent;color:#f1ece3;font-size:24px;cursor:pointer;transition:.2s}
        .legendsAthleteControls button:hover,.legendsAthleteControls button:focus-visible{background:#c67a3b;color:#111411;outline:0}
        .legendsAthleteViewport{overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none}
        .legendsAthleteViewport::-webkit-scrollbar{display:none}
        .legendsAthleteTrack{display:flex;gap:16px}
        .legendsAthleteCard{position:relative;isolation:isolate;flex:0 0 calc((100% - 64px)/5);aspect-ratio:3/4;overflow:hidden;background:#191d19;scroll-snap-align:start}
        .legendsAthleteCard img{width:100%;height:100%;object-fit:cover;transition:transform .45s ease}
        .legendsAthleteCard:hover img{transform:scale(1.045)}
                @media(max-width:760px){.legendsAthletes{padding:68px 0}.legendsAthletesHead{display:grid;grid-template-columns:1fr auto;gap:18px;margin-bottom:24px}.legendsAthletesHead>p{display:none}.legendsAthletes h2{font-size:42px}.legendsAthleteControls button{width:42px;height:42px}.legendsAthleteTrack{gap:12px}.legendsAthleteCard{flex-basis:calc((100% - 12px)/2)}}
      `}</style>
      <div className="wide">
        <header className="legendsAthletesHead">
          <div><p className="kicker">Legends 2027</p><h2 id="legends-athletes-title">Quem <em>aceitou</em><br />o desafio.</h2></div>
          <p>Conheça os atletas confirmados que já escolheram viver a Legends Bike Race.</p>
          <nav className="legendsAthleteControls" aria-label="Navegação dos atletas confirmados">
            <button type="button" onClick={() => move(-1)} aria-label="Ver atletas anteriores">←</button>
            <button type="button" onClick={() => setIsPaused((value) => !value)} aria-pressed={isPaused} aria-label={isPaused ? "Retomar rolagem automática" : "Pausar rolagem automática"}>{isPaused ? "▶" : "Ⅱ"}</button>
            <button type="button" onClick={() => move(1)} aria-label="Ver próximos atletas">→</button>
          </nav>
        </header>
        <div className="legendsAthleteViewport" ref={viewportRef}>
          <div className="legendsAthleteTrack">{athletes.map((athlete) => <article className="legendsAthleteCard" key={athlete.name}>
            <img src={athlete.image} alt={`Card de ${athlete.name}`} />
            
          </article>)}</div>
        </div>
      </div>
    </section>
  );
}
