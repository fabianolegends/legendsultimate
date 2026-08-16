export default function AthleteAccessPage() {
  return (
    <main className="athlete-access">
      <style>{`
        .athlete-access{position:relative;min-height:100vh;background:linear-gradient(100deg,rgba(7,9,8,.98),rgba(7,9,8,.74)),url('/hero-production.jpg') center/cover;color:#f4eee4;display:grid;place-items:center;padding:88px 24px 24px;font-family:Arial,sans-serif}
        .athlete-home{position:absolute;top:28px;left:clamp(24px,5vw,72px);color:#d47b2d;text-decoration:none;font:900 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}
        .athlete-box{width:min(560px,100%);border:1px solid rgba(212,123,45,.48);background:rgba(15,18,15,.94);padding:42px;box-sizing:border-box;text-align:center}
        .athlete-box img{width:180px;margin-bottom:34px}.kicker{color:#d47b2d;letter-spacing:.2em;text-transform:uppercase;font-size:12px;font-weight:900}
        .athlete-box h1{font-size:clamp(42px,7vw,58px);line-height:.92;text-transform:uppercase;margin:15px 0 22px}.athlete-box p{color:#b9bdb7;line-height:1.7;margin:0 auto;max-width:450px}
        .status{margin:28px 0;border-top:1px solid #363b34;border-bottom:1px solid #363b34;padding:20px 0}.status strong{display:block;color:#f4eee4;text-transform:uppercase;font-size:15px;letter-spacing:.08em;margin-bottom:8px}
        .priority-button{display:block;text-align:center;padding:17px;background:#d47b2d;color:white;text-decoration:none;font-weight:900;text-transform:uppercase;margin-top:24px}
        @media(max-width:560px){.athlete-box{padding:30px 24px}.athlete-box img{width:150px;margin-bottom:28px}}
      `}</style>
      <a className="athlete-home" href="/">← Voltar à home</a>
      <section className="athlete-box">
        <a href="/"><img src="/legends-logo-official.png" alt="Legends Bike Race" /></a>
        <p className="kicker">Legends Passport</p>
        <h1>Área do atleta em preparação.</h1>
        <p>
          O acesso ao Legends Race Engine e a conexão com o Ride with GPS serão
          liberados aos participantes no momento adequado.
        </p>
        <div className="status">
          <strong>Ainda não é necessário conectar sua conta</strong>
          <p>Quem estiver na lista prioritária receberá o aviso quando a área for aberta.</p>
        </div>
        <a className="priority-button" href="/lista-prioritaria">Entrar para a lista prioritária →</a>
      </section>
    </main>
  );
}
