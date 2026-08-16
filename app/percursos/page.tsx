import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Percursos",
  description:
    "Conheça os percursos da Legends Ultimate e da Legends Short pelas quatro cidades-base da Serra Gaúcha.",
  alternates: { canonical: "/percursos" },
  openGraph: {
    url: "/percursos",
    title: "Percursos | Legends Bike Race",
    description:
      "Quatro etapas na Ultimate e as duas etapas finais na Short, em uma travessia de gravel pela Serra Gaúcha.",
  },
};

const stages = [
  {
    number: "Stage 01",
    city: "Canela → São Francisco de Paula",
    stats: "111,9 km · 1.684 m+",
    route: "/stage-route-1.png",
    href: "/percursos/stage-1",
    formats: "Somente Ultimate",
  },
  {
    number: "Stage 02",
    city: "São Francisco de Paula → Gramado",
    stats: "89,1 km · 1.520 m+",
    route: "/stage-route-2.png",
    href: "/percursos/stage-2",
    formats: "Somente Ultimate",
  },
  {
    number: "Stage 03",
    city: "Gramado → Nova Petrópolis",
    stats: "99,3 km · 1.522 m+",
    route: "/stage-route-3.png",
    href: "/percursos/stage-3",
    formats: "Ultimate + Short",
  },
  {
    number: "Stage 04",
    city: "Nova Petrópolis → Canela",
    stats: "70,0 km · 1.576 m+",
    route: "/stage-route-4.png",
    href: "/percursos/stage-4",
    formats: "Ultimate + Short",
  },
];

const breadcrumbData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Legends Bike Race",
      item: "https://www.legendsbikerace.com.br",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Percursos",
      item: "https://www.legendsbikerace.com.br/percursos",
    },
  ],
};

export default function RoutesIndex() {
  return (
    <main className="aboutRacePage routesIndexPage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <header className="stageDetailNav shell">
        <a href="/" className="backLink">← Voltar à home</a>
        <img
          src="/legends-logo-official.png"
          alt="Legends Bike Race"
          className="detailLogo"
        />
      </header>

      <section className="aboutHero">
        <div className="shell">
          <p className="aboutKicker">Dois formatos · Serra Gaúcha</p>
          <h1>Uma história contínua.<br /><em>Quatro destinos.</em></h1>
          <p className="aboutLead">
            A Ultimate percorre as quatro etapas; a Short entra na jornada nas Stages 03 e 04. Os percursos compartilhados são os mesmos para ambos os formatos.
          </p>
          <div className="aboutNumbers">
            <div><strong>4 ou 2</strong><span>etapas</span></div>
            <div><strong>370,3 km</strong><span>distância total</span></div>
            <div><strong>6.302 m+</strong><span>ascensão total</span></div>
            <div><strong>2</strong><span>formatos</span></div>
          </div>
        </div>
      </section>

      <section className="routePreview" id="percurso">
        <div className="wide">
          <div className="sectionHead">
            <div>
              <p className="kicker">Percursos oficiais</p>
              <h2>Conheça cada<br /><em>capítulo da jornada.</em></h2>
            </div>
            <p>
              Distância, altimetria, composição do terreno, mapa e perfil de cada
              etapa reunidos em páginas próprias.
            </p>
          </div>
          <div className="stageGridNew">
            {stages.map((stage) => (
              <a className="stageNew" href={stage.href} key={stage.number}>
                <small>{stage.number} · {stage.formats}</small>
                <img src={stage.route} alt="" />
                <div>
                  <h3>{stage.city}</h3>
                  <p>{stage.stats}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
