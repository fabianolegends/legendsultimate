import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentação Médica 2027",
  description: "Atestado Médico e Declaração de Saúde obrigatórios para a Legends Bike Race 2027.",
  alternates: { canonical: "/documentos-medicos" },
};

export default function DocumentosMedicosPage() {
  return (
    <main className="medicalPage">
      <style>{`
        .medicalPage{--paper:#f4f0db;--ink:#10120f;--copper:#c67a3b;--line:rgba(198,122,59,.34);background:#0b0d0c;color:#f1ece3;min-height:100vh}
        .medicalPage .shell{width:min(1080px,calc(100% - 48px));margin:auto}
        .medicalPage .top{height:96px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
        .medicalPage .top img{height:68px}.medicalPage .top a{color:var(--copper);font:600 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.1em}
        .medicalPage .hero{min-height:430px!important;height:430px!important;padding:0!important;display:flex;align-items:center;background:linear-gradient(90deg,rgba(7,9,8,.94) 0%,rgba(7,9,8,.78) 38%,rgba(7,9,8,.18) 75%),linear-gradient(0deg,rgba(7,9,8,.34),rgba(7,9,8,.05)),url('https://images.pexels.com/photos/18674757/pexels-photo-18674757.jpeg?auto=compress&cs=tinysrgb&w=1800') center 57%/cover no-repeat!important}
        .medicalPage .heroInner{width:100%}
        .medicalPage .eyebrow{color:var(--copper);font:600 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.2em}
        .medicalPage .hero h1{font:700 clamp(52px,6.2vw,88px) 'Barlow Condensed';line-height:.88;text-transform:uppercase;margin:14px 0;max-width:680px}
        .medicalPage .hero p{max-width:680px;color:#d0d0cb;line-height:1.65;font-size:17px;margin:0}
        .medicalPage .cards{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:42px 0 80px}.medicalPage .card{border:1px solid var(--line);padding:34px;background:#111411;display:flex;flex-direction:column;min-height:300px}.medicalPage .card>span{color:var(--copper);font:600 12px 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase}.medicalPage .card h2{font:700 38px 'Barlow Condensed';text-transform:uppercase;margin:13px 0}.medicalPage .card p{color:#aeb3aa;line-height:1.7;font-size:17px;max-width:470px}.medicalPage .card a{display:flex;justify-content:space-between;align-items:center;background:var(--copper);color:#fff;padding:17px 18px;margin-top:auto;font:700 14px 'Barlow Condensed';letter-spacing:.11em;text-transform:uppercase}.medicalPage .card a span{color:#fff}.medicalPage .onlineTag{display:inline-flex!important;width:max-content;background:rgba(198,122,59,.15);border:1px solid rgba(198,122,59,.45);padding:7px 9px;margin-top:4px}.medicalPage .rules{background:var(--paper);color:var(--ink);padding:75px 0}.medicalPage .rules h2{font:700 48px 'Barlow Condensed';text-transform:uppercase;margin:0 0 22px}.medicalPage .rulesGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.medicalPage .rule{border-top:2px solid var(--copper);padding-top:18px}.medicalPage .rule strong{font:700 26px 'Barlow Condensed';text-transform:uppercase}.medicalPage .rule p{line-height:1.6;color:#4d504b}.medicalPage .privacy{padding:65px 0}.medicalPage .privacy h2{font:700 42px 'Barlow Condensed';text-transform:uppercase}.medicalPage .privacy p{max-width:800px;color:#aeb3aa;line-height:1.7}
        @media(max-width:760px){.medicalPage .shell{width:calc(100% - 30px)}.medicalPage .hero{height:350px!important;min-height:350px!important;background-position:58% center!important}.medicalPage .hero h1{font-size:54px}.medicalPage .hero p{font-size:15px}.medicalPage .cards,.medicalPage .rulesGrid{grid-template-columns:1fr}.medicalPage .card{min-height:260px}.medicalPage .top img{height:54px}}
      `}</style>
      <nav className="top shell"><a href="/">← Voltar ao site</a><img src="/legends-logo-official.png" alt="Legends Bike Race" /></nav>
      <header className="hero">
        <div className="heroInner shell">
          <p className="eyebrow">Documentação obrigatória · 2027</p>
          <h1>Saúde antes<br />da largada.</h1>
          <p>Para a liberação do participante são obrigatórios o <strong>Atestado Médico</strong> e a <strong>Declaração de Saúde online</strong>.</p>
        </div>
      </header>
      <section className="cards shell">
        <article className="card"><span>Documento 01</span><h2>Atestado Médico</h2><p>Documento oficial em formato A4 retrato, preenchido e assinado pelo médico após avaliação do participante.</p><a href="/documentos-medicos/atestado"><span>IMPRIMIR</span><b>→</b></a></article>
        <article className="card"><span>Documento 02</span><span className="onlineTag">Preenchimento online</span><h2>Declaração de Saúde</h2><p>Preenchida pelo próprio participante e enviada diretamente para a área restrita da Organização.</p><a href="/documentos-medicos/declaracao-saude"><span>PREENCHER ONLINE</span><b>→</b></a></article>
      </section>
      <section className="rules"><div className="shell"><p className="eyebrow">Condição de participação</p><h2>Os dois documentos são obrigatórios.</h2><div className="rulesGrid"><div className="rule"><strong>Atestado</strong><p>Imprima o modelo A4, realize a avaliação médica e mantenha o documento devidamente assinado.</p></div><div className="rule"><strong>Declaração online</strong><p>Preencha no site. Após o envio, as informações ficam disponíveis para a Organização na área administrativa.</p></div><div className="rule"><strong>Dentro do prazo</strong><p>O prazo operacional final para regularização da documentação será informado antes do evento.</p></div></div></div></section>
      <section className="privacy shell"><p className="eyebrow">Privacidade</p><h2>Informação sensível. Uso restrito.</h2><p>As informações de saúde fornecidas pelo participante não ficam disponíveis publicamente. O armazenamento é associado à inscrição e o acesso é restrito à área da Organização para finalidades relacionadas à segurança, atendimento médico e de emergência, seguro e operação da prova.</p></section>
    </main>
  );
}
