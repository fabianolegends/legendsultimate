type MedicalDocumentsPageProps = {
  locale: "es" | "en";
  homeHref: string;
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  backLabel: string;
  certificateTitle: string;
  certificateDescription: string;
  certificateCta: string;
  declarationTitle: string;
  declarationDescription: string;
  declarationCta: string;
  onlineLabel: string;
  conditionEyebrow: string;
  conditionTitle: string;
  certificateRuleTitle: string;
  certificateRuleText: string;
  declarationRuleTitle: string;
  declarationRuleText: string;
  deadlineRuleTitle: string;
  deadlineRuleText: string;
  privacyEyebrow: string;
  privacyTitle: string;
  privacyText: string;
};

export default function MedicalDocumentsPage(props: MedicalDocumentsPageProps) {
  const base = `/${props.locale}/documentos-medicos`;
  return <main className="medicalPage" lang={props.locale}>
    <style>{`
      .medicalPage{--paper:#f4f0db;--ink:#10120f;--copper:#c67a3b;--line:rgba(198,122,59,.34);background:#0b0d0c;color:#f1ece3;min-height:100vh}.medicalPage .shell{width:min(1080px,calc(100% - 48px));margin:auto}.medicalPage .top{height:96px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.medicalPage .top img{height:68px}.medicalPage .top a{color:var(--copper);font:600 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.1em}.medicalPage .hero{min-height:430px;display:flex;align-items:center;background:linear-gradient(90deg,rgba(7,9,8,.94) 0%,rgba(7,9,8,.78) 38%,rgba(7,9,8,.18) 75%),linear-gradient(0deg,rgba(7,9,8,.34),rgba(7,9,8,.05)),url('https://images.pexels.com/photos/18674757/pexels-photo-18674757.jpeg?auto=compress&cs=tinysrgb&w=1800') center 57%/cover no-repeat}.medicalPage .heroInner{width:min(1080px,calc(100% - 48px));margin:0 auto}.medicalPage .eyebrow{color:var(--copper);font:600 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.2em}.medicalPage .hero h1{font:700 clamp(36.4px,4.34vw,61.6px) 'Barlow Condensed';line-height:.88;text-transform:uppercase;margin:14px 0;max-width:680px}.medicalPage .hero p{max-width:680px;color:#d0d0cb;line-height:1.65;font-size:17px;margin:0}.medicalPage .cards{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:42px 0 80px}.medicalPage .card{border:1px solid var(--line);padding:34px;background:#111411;display:flex;flex-direction:column;min-height:300px}.medicalPage .card>span{color:var(--copper);font:600 12px 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase}.medicalPage .card h2{font:700 38px 'Barlow Condensed';text-transform:uppercase;margin:13px 0}.medicalPage .card p{color:#aeb3aa;line-height:1.7;font-size:17px;max-width:470px}.medicalPage .card a{display:flex;justify-content:space-between;align-items:center;background:var(--copper);color:#fff;padding:17px 18px;margin-top:auto;font:700 14px 'Barlow Condensed';letter-spacing:.11em;text-transform:uppercase}.medicalPage .onlineTag{display:inline-flex!important;width:max-content;background:rgba(198,122,59,.15);border:1px solid rgba(198,122,59,.45);padding:7px 9px;margin-top:4px}.medicalPage .rules{background:var(--paper);color:var(--ink);padding:75px 0}.medicalPage .rules h2{font:700 48px 'Barlow Condensed';text-transform:uppercase;margin:0 0 22px}.medicalPage .rulesGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.medicalPage .rule{border-top:2px solid var(--copper);padding-top:18px}.medicalPage .rule strong{font:700 26px 'Barlow Condensed';text-transform:uppercase}.medicalPage .rule p{line-height:1.6;color:#4d504b}.medicalPage .privacy{padding:65px 0}.medicalPage .privacy h2{font:700 42px 'Barlow Condensed';text-transform:uppercase}.medicalPage .privacy p{max-width:800px;color:#aeb3aa;line-height:1.7}@media(max-width:760px){.medicalPage .shell,.medicalPage .heroInner{width:calc(100% - 30px)}.medicalPage .hero{min-height:350px;background-position:58% center}.medicalPage .hero h1{font-size:37.8px}.medicalPage .hero p{font-size:15px}.medicalPage .cards,.medicalPage .rulesGrid{grid-template-columns:1fr}.medicalPage .card{min-height:260px}.medicalPage .top img{height:54px}}
    `}</style>
    <nav className="top shell"><a href={props.homeHref}>← {props.backLabel}</a><img src="/legends-logo-official.png" alt="Legends Bike Race" /></nav>
    <header className="hero"><div className="heroInner"><p className="eyebrow">{props.eyebrow}</p><h1>{props.title}</h1><p>{props.description}</p></div></header>
    <section className="cards shell">
      <article className="card"><span>Document 01</span><h2>{props.certificateTitle}</h2><p>{props.certificateDescription}</p><a href={`${base}/atestado`}><span>{props.certificateCta}</span><b>→</b></a></article>
      <article className="card"><span>Document 02</span><span className="onlineTag">{props.onlineLabel}</span><h2>{props.declarationTitle}</h2><p>{props.declarationDescription}</p><a href={`${base}/declaracao-saude`}><span>{props.declarationCta}</span><b>→</b></a></article>
    </section>
    <section className="rules"><div className="shell"><p className="eyebrow">{props.conditionEyebrow}</p><h2>{props.conditionTitle}</h2><div className="rulesGrid"><div className="rule"><strong>{props.certificateRuleTitle}</strong><p>{props.certificateRuleText}</p></div><div className="rule"><strong>{props.declarationRuleTitle}</strong><p>{props.declarationRuleText}</p></div><div className="rule"><strong>{props.deadlineRuleTitle}</strong><p>{props.deadlineRuleText}</p></div></div></div></section>
    <section className="privacy shell"><p className="eyebrow">{props.privacyEyebrow}</p><h2>{props.privacyTitle}</h2><p>{props.privacyText}</p></section>
  </main>;
}
