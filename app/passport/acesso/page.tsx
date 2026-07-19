"use client";

import { useEffect, useState } from "react";

type StravaState = {
  configured: boolean;
  connected: boolean;
  athlete: { firstname?: string; lastname?: string; profile?: string } | null;
};

export default function AthleteAccessPage() {
  const [state, setState] = useState<StravaState | null>(null);

  useEffect(() => {
    fetch("/api/strava/activities", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setState(payload))
      .catch(() => setState({ configured: false, connected: false, athlete: null }));
  }, []);

  const name = `${state?.athlete?.firstname ?? ""} ${state?.athlete?.lastname ?? ""}`.trim();

  return (
    <main className="athlete-access">
      <style>{`
        .athlete-access{min-height:100vh;background:linear-gradient(100deg,rgba(7,9,8,.98),rgba(7,9,8,.74)),url('/hero-production.jpg') center/cover;color:#f4eee4;display:grid;place-items:center;padding:24px;font-family:Arial,sans-serif}
        .athlete-box{width:min(520px,100%);border:1px solid rgba(212,123,45,.48);background:rgba(15,18,15,.94);padding:38px;box-sizing:border-box}.athlete-box img{width:180px;margin-bottom:34px}.kicker{color:#d47b2d;letter-spacing:.2em;text-transform:uppercase;font-size:12px;font-weight:900}.athlete-box h1{font-size:48px;line-height:.95;text-transform:uppercase;margin:15px 0 20px}.athlete-box p{color:#b9bdb7;line-height:1.7}.steps{display:grid;gap:10px;margin:26px 0}.step{border-top:1px solid #363b34;padding-top:12px;color:#d9d4cb}.step strong{color:#d47b2d;margin-right:10px}.strava-button,.passport-button{display:block;text-align:center;padding:17px;color:white;text-decoration:none;font-weight:900;text-transform:uppercase;margin-top:20px}.strava-button{background:#fc4c02}.passport-button{background:#e86619}.secondary{display:block;text-align:center;margin-top:18px;color:#b8bdb5;font-size:13px}.athlete-profile{display:flex;gap:14px;align-items:center;border:1px solid #41473e;padding:14px;margin:24px 0}.athlete-profile img{width:48px;height:48px;border-radius:50%;margin:0;object-fit:cover}.athlete-profile strong,.athlete-profile span{display:block}.athlete-profile span{font-size:12px;color:#9da39a;margin-top:4px}
        @media(max-width:560px){.athlete-box{padding:28px}.athlete-box h1{font-size:39px}}
      `}</style>
      <section className="athlete-box">
        <a href="/"><img src="/legends-logo-official.png" alt="Legends Bike Race" /></a>
        <p className="kicker">Legends Passport</p>
        <h1>Acesso do atleta</h1>
        <p>Use sua conta do Strava para entrar. A Legends acessará apenas os dados necessários para localizar e homologar suas atividades.</p>
        <div className="steps"><div className="step"><strong>01</strong>Conecte sua conta.</div><div className="step"><strong>02</strong>Escolha a atividade do dia.</div><div className="step"><strong>03</strong>Acompanhe o resultado.</div></div>

        {!state ? <p>Verificando sua conexão...</p> : state.connected ? (
          <>
            <div className="athlete-profile">
              {state.athlete?.profile ? <img src={state.athlete.profile} alt="" /> : null}
              <div><strong>{name || "Atleta conectado"}</strong><span>Conta Strava conectada</span></div>
            </div>
            <a className="passport-button" href="/passport/atleta">Entrar no Passport</a>
          </>
        ) : state.configured ? (
          <a className="strava-button" href="/api/strava/connect">Conectar com Strava</a>
        ) : (
          <p style={{ color: "#efb078" }}>A integração com o Strava ainda não está configurada.</p>
        )}
        <a className="secondary" href="/acesso">Escolher outra área de acesso</a>
      </section>
    </main>
  );
}
