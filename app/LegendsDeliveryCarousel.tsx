"use client";

import { useEffect, useRef, useState } from "react";

type DeliveryCarouselProps = {
  eyebrow: string;
  title: string;
  description: string;
  products: string[];
  services: string[];
  registerHref: string;
  registerLabel: string;
};

const productImages = [
  "/images/kit/camiseta-casual.webp",
  "/images/kit/bag-50-litros.webp",
  "/images/kit/cap-ciclismo.webp",
  "/images/kit/placa-gravel.webp",
];

export default function LegendsDeliveryCarousel({
  eyebrow,
  title,
  description,
  products,
  services,
  registerHref,
  registerLabel,
}: DeliveryCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const cards = [
    ...products.map((name, index) => ({ name, kind: "kit" as const, image: productImages[index] })),
    ...services.map((name) => ({ name, kind: "service" as const })),
  ];

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

    viewport.scrollLeft += direction * viewport.clientWidth * 0.78;
  }

  useEffect(() => {
    if (isPaused) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const timer = window.setInterval(() => {
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      if (maxScroll <= 0) return;
      const nextScroll = viewport.scrollLeft + 1.1;
      viewport.scrollLeft = nextScroll >= maxScroll ? 0 : nextScroll;
    }, 32);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section className="legendsDeliveries" aria-labelledby="legends-deliveries-title">
      <style>{`
        .legendsDeliveries{padding:92px 0;background:#f4f0db;color:#111411;overflow:hidden}
        .legendsDeliveriesHead{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.56fr) auto;gap:32px;align-items:end;margin-bottom:36px}
        .legendsDeliveries .kicker{margin:0 0 13px;color:#c67a3b;font:700 13px 'Barlow Condensed';letter-spacing:.22em;text-transform:uppercase}
        .legendsDeliveries h2{max-width:780px;margin:0;font:700 clamp(46px,5.3vw,78px)/.9 'Barlow Condensed';letter-spacing:-.03em;text-transform:uppercase}
        .legendsDeliveriesHead>p{margin:0 0 4px;color:#555952;font-size:16px;line-height:1.62}
        .legendsDeliveryControls{display:flex;gap:8px;align-self:end}
        .legendsDeliveryControls button{display:grid;place-items:center;width:48px;height:48px;border:1px solid rgba(17,20,17,.34);background:transparent;color:#111411;font-size:23px;cursor:pointer;transition:.2s}
        .legendsDeliveryControls button:hover,.legendsDeliveryControls button:focus-visible{background:#c67a3b;border-color:#c67a3b;color:#fff;outline:0}
        .legendsDeliveryViewport{overflow-x:auto;scrollbar-width:none}
        .legendsDeliveryViewport::-webkit-scrollbar{display:none}
        .legendsDeliveryTrack{display:flex;gap:16px}
        .legendsDeliveryCard{position:relative;isolation:isolate;display:flex;flex:0 0 calc((100% - 48px)/4);min-height:390px;flex-direction:column;justify-content:space-between;padding:22px;border:1px solid rgba(17,20,17,.2);background:#e9e3d6;overflow:hidden}
        .legendsDeliveryCard.isKit{padding:0;background:#121511;color:#f1ece3}
        .legendsDeliveryCard.isKit:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,13,11,0) 32%,rgba(10,13,11,.78) 100%);pointer-events:none}
        .legendsDeliveryCard img{width:100%;height:100%;position:absolute;inset:0;object-fit:contain;padding:20px;transition:transform .45s ease}
        .legendsDeliveryCard:hover img{transform:scale(1.05)}
        .legendsDeliveryCard .cardMeta,.legendsDeliveryCard h3{position:relative;z-index:1}
        .legendsDeliveryCard .cardMeta{font:700 11px 'Barlow Condensed';letter-spacing:.16em;text-transform:uppercase}
        .legendsDeliveryCard.isKit .cardMeta{padding:20px 20px 0;color:#d4c7b5}
        .legendsDeliveryCard h3{margin:0;font:700 clamp(25px,2vw,34px)/.95 'Barlow Condensed';letter-spacing:-.01em;text-transform:uppercase}
        .legendsDeliveryCard.isKit h3{padding:0 20px 23px;color:#fff}
        .legendsDeliveryCard.isService{background:linear-gradient(145deg,#f0eadf,#e1dacb)}
        .legendsDeliveryCard.isService .cardMeta{display:grid;place-items:center;width:42px;height:42px;border:1px solid #c67a3b;color:#c67a3b;font-size:22px}
        .legendsDeliveryCard.isService h3{max-width:250px}
        .legendsDeliveryCard.isService:after{content:'LEGENDS';position:absolute;right:-8px;bottom:4px;color:rgba(198,122,59,.12);font:700 68px/.8 'Barlow Condensed';letter-spacing:-.06em}
        .legendsDeliveryFooter{display:flex;align-items:center;justify-content:space-between;gap:28px;margin-top:30px;padding-top:24px;border-top:1px solid rgba(17,20,17,.2)}
        .legendsDeliveryFooter p{margin:0;color:#5d615b;font-size:13px;line-height:1.55}
        .legendsDeliveryFooter a{display:inline-flex;align-items:center;gap:28px;padding:16px 21px;background:#c67a3b;color:#fff;font:700 14px 'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;transition:.2s}
        .legendsDeliveryFooter a:hover{background:#111411;transform:translateY(-2px)}
        @media(max-width:900px){.legendsDeliveriesHead{grid-template-columns:1fr auto}.legendsDeliveriesHead>p{grid-column:1/-1;max-width:620px;order:3}.legendsDeliveryCard{flex-basis:calc((100% - 32px)/3)}}
        @media(max-width:640px){.legendsDeliveries{padding:68px 0}.legendsDeliveriesHead{gap:18px;margin-bottom:24px}.legendsDeliveries h2{font-size:43px}.legendsDeliveriesHead>p{display:none}.legendsDeliveryControls button{width:42px;height:42px}.legendsDeliveryTrack{gap:12px}.legendsDeliveryCard{flex-basis:calc((100% - 12px)/2);min-height:286px;padding:16px}.legendsDeliveryCard.isKit h3{padding:0 16px 16px;font-size:26px}.legendsDeliveryCard.isKit .cardMeta{padding:15px 16px 0}.legendsDeliveryCard img{padding:12px}.legendsDeliveryCard.isService h3{font-size:27px}.legendsDeliveryFooter{align-items:flex-start;flex-direction:column;margin-top:22px;padding-top:20px}.legendsDeliveryFooter a{width:100%;justify-content:space-between}}
      `}</style>
      <div className="wide">
        <header className="legendsDeliveriesHead">
          <div>
            <p className="kicker">{eyebrow}</p>
            <h2 id="legends-deliveries-title">{title}</h2>
          </div>
          <p>{description}</p>
          <nav className="legendsDeliveryControls" aria-label="Navegação das entregas da inscrição">
            <button type="button" onClick={() => move(-1)} aria-label="Ver entregas anteriores">←</button>
            <button type="button" onClick={() => setIsPaused((value) => !value)} aria-pressed={isPaused} aria-label={isPaused ? "Retomar rolagem automática" : "Pausar rolagem automática"}>{isPaused ? "▶" : "Ⅱ"}</button>
            <button type="button" onClick={() => move(1)} aria-label="Ver próximas entregas">→</button>
          </nav>
        </header>

        <div className="legendsDeliveryViewport" ref={viewportRef}>
          <div className="legendsDeliveryTrack">
            {cards.map((card, index) => (
              <article className={`legendsDeliveryCard ${card.kind === "kit" ? "isKit" : "isService"}`} key={card.name}>
                {card.kind === "kit" && <img src={card.image} alt={card.name} />}
                <span className="cardMeta">{card.kind === "kit" ? "Kit oficial" : String(index - products.length + 1).padStart(2, "0")}</span>
                <h3>{card.name}</h3>
              </article>
            ))}
          </div>
        </div>

        <footer className="legendsDeliveryFooter">
          <p>Itens que acompanham sua jornada — da largada à última cidade-base.</p>
          <a href={registerHref}>{registerLabel}<span>→</span></a>
        </footer>
      </div>
    </section>
  );
}
