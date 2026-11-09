"use client";

import { useEffect, useRef, useState } from "react";

type AthleteCard = {
  id: string;
  athlete_name: string;
  location: string | null;
  image_url: string;
};

export default function LegendsAthleteCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<AthleteCard[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch("/api/legends/cards")
      .then((response) => response.ok ? response.json() : { cards: [] })
      .then((payload) => setCards(payload.cards ?? []))
      .catch(() => setCards([]));
  }, []);

  function move(direction: 1 | -1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const edge = direction === 1 && viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 8;
    if (edge) {
      viewport.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    viewport.scrollBy({ left: direction * viewport.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    if (paused || cards.length < 2) return;
    const timer = window.setInterval(() => move(1), 5200);
    return () => window.clearInterval(timer);
  }, [paused, cards.length]);

  if (!cards.length) return null;

  return (
    <section className="legendsAthletes" aria-labelledby="legends-athletes-title">
      <style>{`
        .legendsAthletes{padding:96px 0;background:#0e110f;color:#f1ece3;overflow:hidden}
        .legendsAthletesHead{display:flex;align-items:end;justify-content:space-between;gap:36px;margin-bottom:30px}
        .legendsAthletesHead .kicker{margin:0 0 10px;color:#c67a3b;font:700 13px 'Barlow Condensed';letter-spacing:.22em;text-transform:uppercase}
        .legendsAthletes h2{margin:0;font:700 clamp(46px,5vw,72px)/.9 'Barlow Condensed';letter-spacing:-.025em;text-transform:uppercase}
        .legendsAthletes h2 em{font-style:normal;color:#c67a3b}
        .legendsAthletesHead>p{max-width:430px;margin:0;color:#aeb3aa;font-size:16px;line-height:1.6}
        .legendsAthleteControls{display:flex;gap:8px}
        .legendsAthleteControls button{display:grid;place-items:center;width:48px;height:48px;border:1px solid rgba(198,122,59,.55);background:transparent;color:#f1ece3;font-size:24px;cursor:pointer;transition:.2s}
        .legendsAthleteControls button:hover,.legendsAthleteControls button:focus-visible{background:#c67a3b;color:#111411;outline:0}
        .legendsAthleteViewport{overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}
        .legendsAthleteViewport::-webkit-scrollbar{display:none}
        .legendsAthleteTrack{display:flex;gap:16px}
        .legendsAthleteCard{position:relative;isolation:isolate;flex:0 0 calc((100% - 64px)/5);aspect-ratio:3/4;overflow:hidden;background:#191d19;scroll-snap-align:start}
        .legendsAthleteCard img{width:100%;height:100%;object-fit:cover;transition:transform .45s ease}
        .legendsAthleteCard:hover img{transform:scale(1.045)}
        .legendsAthleteCard:after{content:"";position:absolute;z-index:1;inset:40% 0 0;background:linear-gradient(transparent,rgba(0,0,0,.88));pointer-events:none}
        .legendsAthleteCaption{position:absolute;z-index:2;right:0;bottom:0;left:0;padding:18px;color:#f1ece3}
        .legendsAthleteCaption strong{display:block;font:700 clamp(20px,1.7vw,28px)/.94 'Barlow Condensed';letter-spacing:.02em;text-transform:uppercase}
        .legendsAthleteCaption span{display:block;margin-top:7px;color:#e3a16a;font:700 10px 'Barlow Condensed';letter-spacing:.15em;text-transform:uppercase}
        @media(max-width:760px){.legendsAthletes{padding:68px 0}.legendsAthletesHead{display:grid;grid-template-columns:1fr auto;gap:18px;margin-bottom:24px}.legendsAthletesHead>p{display:none}.legendsAthletes h2{font-size:42px}.legendsAthleteControls button{width:42px;height:42px}.legendsAthleteTrack{gap:12px}.legendsAthleteCard{flex-basis:calc((100% - 12px)/2)}.legendsAthleteCaption{padding:14px}.legendsAthleteCaption strong{font-size:22px}}
      `}</style>
      <div className="wide">
        <header className="legendsAthletesHead">
          <div>
            <p className="kicker">Legends 2027</p>
            <h2 id="legends-athletes-title">Quem <em>aceitou</em><br />o desafio.</h2>
          </div>
          <p>Conheça os atletas confirmados que já escolheram viver a Legends Bike Race.</p>
          <nav className="legendsAthleteControls" aria-label="Navegação dos atletas confirmados">
            <button type="button" onClick={() => move(-1)} aria-label="Ver atletas anteriores">←</button>
            <button type="button" onClick={() => move(1)} aria-label="Ver próximos atletas">→</button>
          </nav>
        </header>
        <div
          className="legendsAthleteViewport"
          ref={viewportRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="legendsAthleteTrack">
            {cards.map((card) => (
              <article className="legendsAthleteCard" key={card.id}>
                <img src={card.image_url} alt={`Card de ${card.athlete_name}`} />
                <div className="legendsAthleteCaption">
                  <strong>{card.athlete_name}</strong>
                  {card.location ? <span>{card.location}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
