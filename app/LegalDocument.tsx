type RegulationSection = readonly [string, string, readonly string[]];

type LegalDocumentProps = {
  locale: "es" | "en";
  eyebrow: string;
  title: string;
  description: string;
  backLabel: string;
  indexLabel: string;
  medicalEyebrow: string;
  medicalTitle: string;
  medicalText: string;
  medicalCta: string;
  medicalHref: string;
  sections: readonly RegulationSection[];
};

export default function LegalDocument({ locale, eyebrow, title, description, backLabel, indexLabel, medicalEyebrow, medicalTitle, medicalText, medicalCta, medicalHref, sections }: LegalDocumentProps) {
  return (
    <main className="rulesPage" lang={locale}>
      <style>{`
        .rulesPage{--paper:#f4f0db;--ink:#10120f;--copper:#c67a3b;--line:rgba(198,122,59,.34);background:#0b0d0c;color:#f1ece3;min-height:100vh}.rulesPage .shell{width:min(1120px,calc(100% - 56px));margin:auto}.rulesPage .top{height:96px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.rulesPage .top img{height:68px}.rulesPage .top a{color:var(--copper);font:600 13px 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase}.rulesPage .hero{padding:90px 0 72px}.rulesPage .eyebrow{color:var(--copper);font:600 13px 'Barlow Condensed';letter-spacing:.2em;text-transform:uppercase}.rulesPage .hero h1{font:700 clamp(44.8px,5.6vw,78.4px) 'Barlow Condensed';line-height:.86;text-transform:uppercase;margin:18px 0}.rulesPage .hero p{max-width:820px;color:#aeb3aa;line-height:1.7}.rulesPage .meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.rulesPage .meta span{padding:10px 13px;border:1px solid var(--line);font:600 12px 'Barlow Condensed';letter-spacing:.09em;text-transform:uppercase}.rulesPage .navGrid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);margin-bottom:70px}.rulesPage .navGrid a{padding:13px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);color:#d7d2c8;font:600 12px 'Barlow Condensed';text-transform:uppercase}.rulesPage .rules{padding-bottom:100px}.rulesPage .rule{display:grid;grid-template-columns:90px 1fr;gap:32px;padding:34px 0;border-top:1px solid rgba(198,122,59,.22)}.rulesPage .num{font:700 36px 'Barlow Condensed';color:var(--copper)}.rulesPage .rule h2{font:700 38px 'Barlow Condensed';text-transform:uppercase;margin:0 0 14px}.rulesPage .rule p{color:#b3b7af;line-height:1.75;margin:8px 0}.rulesPage .notice{background:var(--paper);color:var(--ink);padding:55px 0}.rulesPage .notice h2{font:700 44px 'Barlow Condensed';text-transform:uppercase;margin:0 0 14px}.rulesPage .notice p{max-width:820px;line-height:1.7}.rulesPage .notice a{display:inline-block;margin-top:14px;background:var(--copper);color:#fff;padding:15px 20px;font:700 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.08em}@media(max-width:760px){.rulesPage .shell{width:calc(100% - 30px)}.rulesPage .navGrid{grid-template-columns:1fr 1fr}.rulesPage .rule{grid-template-columns:50px 1fr;gap:15px}.rulesPage .rule h2{font-size:30px}.rulesPage .top img{height:54px}}
      `}</style>
      <nav className="top shell"><a href={locale === "es" ? "/es" : "/en"}>← {backLabel}</a><img src="/legends-logo-official.png" alt="Legends Bike Race" /></nav>
      <header className="hero shell"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p><div className="meta"><span>Ultimate: 4 stages</span><span>Short: 2 stages</span><span>100 + 50 spots</span><span>2 formats</span></div></header>
      <nav className="navGrid shell" aria-label={indexLabel}>{sections.map(([n, sectionTitle]) => <a key={n} href={`#rule-${n}`}>{n}. {sectionTitle}</a>)}</nav>
      <section className="rules shell">{sections.map(([n, sectionTitle, paragraphs]) => <article className="rule" id={`rule-${n}`} key={n}><div className="num">{n}</div><div><h2>{sectionTitle}</h2>{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article>)}</section>
      <section className="notice"><div className="shell"><p className="eyebrow">{medicalEyebrow}</p><h2>{medicalTitle}</h2><p>{medicalText}</p><a href={medicalHref}>{medicalCta} →</a></div></section>
    </main>
  );
}
