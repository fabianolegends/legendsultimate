export type RouteStage = {
  n: string;
  city: string;
  stats: string;
  distance: string;
  elevation: string;
  eligibility: string;
  route: string;
  arrival: string;
  href: string;
};

export default function RouteExplorer({ stages }: { stages: RouteStage[] }) {
  return (
    <div className="routeCardGrid" aria-label="Etapas da Legends Bike Race">
      {stages.map((stage) => (
        <a className="routeStageCard" href={stage.href} key={stage.n}>
          <img className="routeStageCardMap" src={stage.route} alt={`Traçado da ${stage.n}`} />
          <span className="routeStageCardCopy">
            <small>{stage.n} · {stage.eligibility}</small>
            <strong>{stage.city} <i aria-hidden="true">→</i> {stage.arrival}</strong>
            <span>{stage.stats}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
