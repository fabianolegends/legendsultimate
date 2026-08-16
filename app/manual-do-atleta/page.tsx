import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manual do Atleta — Em breve",
  description: "O Manual do Atleta da Legends Bike Race 2027 será publicado em breve.",
  alternates: { canonical: "/manual-do-atleta" },
};

export default function ManualAtletaPage() {
  return (
    <main className="manualSoonPage">
      <style>{`
        .manualSoonPage{min-height:100vh;background:#090c0b linear-gradient(rgba(9,12,11,.8),rgba(9,12,11,.9)),url('/contour-lines-legends.png') center/cover;color:#f1ece3}.manualSoonPage *{box-sizing:border-box}.manualSoonPage .shell{width:min(1120px,calc(100% - 50px));margin:auto}.manualSoonPage .top{height:96px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(186,112,73,.34)}.manualSoonPage .top img{height:68px}.manualSoonPage .top a{color:#ba7049;font:700 13px 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase}.manualSoonPage .soonHero{min-height:620px;display:grid;align-content:center;padding:90px 0 120px}.manualSoonPage .eyebrow{margin:0 0 20px;color:#ba7049;font:700 13px 'Barlow Condensed';letter-spacing:.22em;text-transform:uppercase}.manualSoonPage h1{max-width:900px;margin:0;font:700 clamp(70px,10vw,138px)/.82 'Barlow Condensed';letter-spacing:-.035em;text-transform:uppercase}.manualSoonPage h1 em{display:block;color:#ba7049;font-style:normal}.manualSoonPage .lead{max-width:720px;margin:32px 0 0;color:#c6c7c2;font-size:18px;line-height:1.7}.manualSoonPage .notice{display:inline-flex;align-items:center;gap:12px;justify-self:start;margin-top:30px;padding:13px 17px;border:1px solid rgba(186,112,73,.55);color:#f1ece3;font:700 12px 'Barlow Condensed';letter-spacing:.13em;text-transform:uppercase}.manualSoonPage .notice:before{content:'';width:7px;height:7px;border-radius:50%;background:#ba7049;box-shadow:0 0 0 5px rgba(186,112,73,.14)}@media(max-width:700px){.manualSoonPage .shell{width:calc(100% - 30px)}.manualSoonPage .top{height:82px}.manualSoonPage .top img{height:54px}.manualSoonPage .soonHero{min-height:560px;padding:70px 0 95px}.manualSoonPage h1{font-size:72px}.manualSoonPage .lead{font-size:16px}}
      `}</style>
      <nav className="top shell">
        <a href="/">← Voltar à home</a>
        <img src="/legends-logo-official.png" alt="Legends Bike Race" />
      </nav>
      <section className="soonHero shell">
        <p className="eyebrow">Legends Bike Race 2027</p>
        <h1>Manual do atleta.<em>Em breve.</em></h1>
        <p className="lead">O documento completo, com logística, horários, equipamentos obrigatórios e orientações para as etapas, será publicado mais próximo do evento.</p>
        <span className="notice">Publicação futura</span>
      </section>
    </main>
  );
}
