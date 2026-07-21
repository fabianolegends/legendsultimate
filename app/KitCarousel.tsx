"use client";

import { useRef } from "react";

const products = [
  ["/images/kit/jersey-ciclismo.webp", "Performance", "Jersey de ciclismo", "Jersey de ciclismo oficial Legends Bike Race"],
  ["/images/kit/camiseta-casual.webp", "Identidade", "Camiseta casual", "Camiseta casual oficial Legends Bike Race"],
  ["/images/kit/bag-50-litros.webp", "Jornada", "Bag de 50 litros", "Bag oficial de 50 litros Legends Bike Race"],
  ["/images/kit/cap-ciclismo.webp", "Assinatura", "Cap de ciclismo", "Cap de ciclismo oficial Legends Bike Race"],
  ["/images/kit/par-de-meias.webp", "Conforto", "Par de meias", "Par de meias oficial Legends Bike Race"],
  ["/images/kit/placa-gravel.webp", "Número oficial", "Placa Gravel", "Placa Gravel oficial Legends Bike Race"],
];

export default function KitCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);

  function move(direction: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: direction * viewport.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="kitCarousel">
      <div className="kitCarouselControls" aria-label="Navegação do carrossel do kit">
        <button type="button" onClick={() => move(-1)} aria-label="Ver produtos anteriores">←</button>
        <button type="button" onClick={() => move(1)} aria-label="Ver próximos produtos">→</button>
      </div>
      <div className="kitCarouselViewport" ref={viewportRef}>
        <div className="kitDetailTrack">
          {products.map(([image, title, label, alt]) => (
            <figure className="kitDetailCard" key={label}>
              <div className="kitDetailMedia"><img className="kitDetailProduct" src={image} alt={alt} loading="lazy" /></div>
              <figcaption><strong>{title}</strong><span>{label}</span></figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
