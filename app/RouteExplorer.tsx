"use client";

import { useState } from "react";

export type RouteStage = {
  n: string;
  city: string;
  stats: string;
  distance: string;
  elevation: string;
  eligibility: string;
  route: string;
  href: string;
};

export default function RouteExplorer({ stages }: { stages: RouteStage[] }) {
  const [selectedIndex, setSelectedIndex] = useState(2);
  const selected = stages[selectedIndex];

  return (
    <div className="routeExplorer">
      <div className="routeStageNav" role="tablist" aria-label="Selecione uma etapa">
        {stages.map((stage, index) => {
          const isSelected = selectedIndex === index;
          return (
            <button
              className={`routeStageTab${isSelected ? " isSelected" : ""}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls="route-stage-detail"
              id={`route-stage-tab-${index + 1}`}
              onClick={() => setSelectedIndex(index)}
              key={stage.n}
            >
              <span className="routeStageMarker" aria-hidden="true" />
              <span className="routeStageCopy">
                <small>{stage.n}</small>
                <strong>{stage.city}</strong>
                <span>{stage.stats}</span>
                <em>{stage.eligibility}</em>
              </span>
            </button>
          );
        })}
      </div>

      <article
        className="routeStageDetail"
        id="route-stage-detail"
        role="tabpanel"
        aria-labelledby={`route-stage-tab-${selectedIndex + 1}`}
      >
        <div className="routeDetailCopy">
          <small>{selected.n}</small>
          <h3>{selected.city}</h3>
          <div className="routeDetailStats">
            <span><strong>{selected.distance}</strong><small>Distância</small></span>
            <span><strong>{selected.elevation}</strong><small>Ganho de elevação</small></span>
          </div>
          <span className="routeEligibility">{selected.eligibility}</span>
        </div>
        <img className="routeDetailMap" src={selected.route} alt={`Traçado da etapa ${selected.n.replace("STAGE ", "")} em ${selected.city}`} />
        <a className="routeDetailLink" href={selected.href}>Ver detalhes da etapa <span>→</span></a>
      </article>
    </div>
  );
}
