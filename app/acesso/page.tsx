export default function AccessPage() {
  return (
    <main className="access-page">
      <style>{`
        .access-page{min-height:100vh;background:#0b0d0c;color:#f3eee5;font-family:Arial,sans-serif;padding:32px}
        .access-shell{width:min(1120px,100%);margin:0 auto}.access-top{display:flex;align-items:center;justify-content:space-between;padding:18px 0 46px}.access-top img{width:190px}.access-top a{color:#d47b2d;text-transform:uppercase;font-weight:800;font-size:13px;letter-spacing:.08em}
        .access-hero{max-width:850px;margin-bottom:48px}.access-kicker{color:#d47b2d;letter-spacing:.22em;text-transform:uppercase;font-size:13px;font-weight:800}.access-hero h1{font-size:clamp(48px,7vw,88px);line-height:.9;text-transform:uppercase;margin:16px 0 22px}.access-hero p{font-size:19px;line-height:1.65;color:#b8bdb5;max-width:720px}
        .access-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.access-card{border:1px solid #3b4039;background:#151815;padding:34px;display:flex;min-height:330px;flex-direction:column}.access-card.light{background:#eee5d8;color:#171917;border-color:#eee5d8}.access-card small{color:#d47b2d;text-transform:uppercase;letter-spacing:.16em;font-weight:900}.access-card h2{font-size:42px;text-transform:uppercase;line-height:1;margin:20px 0}.access-card p{line-height:1.7;color:#aeb3ab}.access-card.light p{color:#575b55}.access-card ul{padding-left:19px;line-height:1.8;margin-bottom:30px}.access-card a{margin-top:auto;display:block;text-align:center;padding:16px;background:#e86619;color:white;font-weight:900;text-transform:uppercase;text-decoration:none}.access-card.light a{background:#151815}
        @media(max-width:760px){.access-page{padding:20px}.access-grid{grid-template-columns:1fr}.access-top img{width:150px}.access-card{min-height:auto;padding:27px}.access-card h2{font-size:35px}}
      `}</style>
      <div className="access-shell">
        <header className="access-top"><a href="/"><img src="/legends-logo-official.png" alt="Legends Bike Race" /></a><a href="/">Voltar ao site</a></header>
        <section className="access-hero">
          <p className="access-kicker">Legends Core</p>
          <h1>Escolha sua área de acesso.</h1>
          <p>O atleta envia sua atividade e acompanha a homologação. A organização administra rotas oficiais e analisa somente as exceções.</p>
        </section>
        <section className="access-grid">
          <article className="access-card">
            <small>Participantes</small><h2>Portal do atleta</h2>
            <p>Conecte o Strava, selecione a atividade do dia da etapa e acompanhe o resultado automático.</p>
            <ul><li>Homologação automática</li><li>Histórico por etapa</li><li>Mapa dos desvios</li><li>Solicitação de revisão</li></ul>
            <a href="/passport/acesso">Entrar como atleta</a>
          </article>
          <article className="access-card light">
            <small>Equipe oficial</small><h2>Organização</h2>
            <p>Área restrita para controle das rotas, fila de revisão, decisões manuais e auditoria das atividades.</p>
            <ul><li>Resumo operacional</li><li>Fila de exceções</li><li>Mapa comparativo</li><li>Gestão de GPXs oficiais</li></ul>
            <a href="/passport/organizacao-acesso">Entrar como organização</a>
          </article>
        </section>
      </div>
    </main>
  );
}
