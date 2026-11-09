"use client";

import { FormEvent, useState } from "react";

export default function AthleteAccessPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/athlete/photo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível entrar.");
      window.location.href = payload.redirect ?? "/passport/fotos";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="athlete-access">
      <style>{`
        .athlete-access{position:relative;min-height:100vh;background:linear-gradient(100deg,rgba(7,9,8,.98),rgba(7,9,8,.73)),url('/hero-production.jpg') center/cover;color:#f4eee4;display:grid;place-items:center;padding:88px 24px 32px;font-family:Arial,sans-serif}.athlete-home{position:absolute;top:28px;left:clamp(24px,5vw,72px);color:#d47b2d;text-decoration:none;font:900 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}.athlete-box{width:min(590px,100%);border:1px solid rgba(212,123,45,.48);background:rgba(15,18,15,.95);padding:44px;box-sizing:border-box}.athlete-logo{display:block;width:180px;margin:0 auto 34px}.kicker{color:#d47b2d;letter-spacing:.2em;text-transform:uppercase;font-size:11px;font-weight:900;text-align:center}.athlete-box h1{font:700 clamp(42px,7vw,60px)/.9 'Barlow Condensed',Arial;text-transform:uppercase;margin:15px 0 17px;text-align:center}.intro{color:#b9bdb7;line-height:1.65;margin:0 auto 26px;max-width:470px;text-align:center}.how{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#373d35;border:1px solid #373d35;margin-bottom:24px}.how div{background:#171b17;padding:14px}.how span,.how strong{display:block}.how span{color:#858b82;font-size:9px;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px}.how strong{font-size:13px}.login-form{display:grid;gap:15px}.field{display:grid;gap:7px}.field label{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#d4d7d0}.field input{width:100%;box-sizing:border-box;background:#0b0e0b;border:1px solid #4a5147;color:#fff;padding:15px;font-size:16px}.field small{color:#858b82;font-size:10px;line-height:1.45}.submit{border:0;background:#d47b2d;color:white;padding:17px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;cursor:pointer;margin-top:3px}.submit:disabled{opacity:.55}.message{border:1px solid #7b5632;background:#251a10;color:#efbd8f;padding:14px;font-size:13px;line-height:1.5}.security{border-top:1px solid #363b34;margin-top:24px;padding-top:18px;color:#838980;font-size:10px;line-height:1.55;text-align:center}@media(max-width:560px){.athlete-box{padding:32px 23px}.athlete-logo{width:150px;margin-bottom:28px}.how{grid-template-columns:1fr}.athlete-access{padding-left:16px;padding-right:16px}}
      `}</style>
      <a className="athlete-home" href="/">← Voltar à home</a>
      <section className="athlete-box">
        <a href="/"><img className="athlete-logo" src="/legends-logo-official.png" alt="Legends Bike Race" /></a>
        <p className="kicker">Área do atleta · Legends Bike Race</p>
        <h1>Seu card começa aqui.</h1>
        <p className="intro">Entre com os mesmos dados da inscrição para enviar as duas fotos que serão usadas no seu card de participante.</p>
        <div className="how"><div><span>Usuário</span><strong>E-mail cadastrado</strong></div><div><span>Senha inicial</span><strong>5 primeiros números do documento</strong></div></div>
        <form className="login-form" onSubmit={submit}>
          <div className="field"><label htmlFor="athlete-email">E-mail da inscrição</label><input id="athlete-email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" /></div>
          <div className="field"><label htmlFor="athlete-password">Senha</label><input id="athlete-password" type="password" autoComplete="current-password" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} required value={password} onChange={(event) => setPassword(event.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="•••••" /><small>Digite somente os cinco primeiros números do CPF ou documento informado na inscrição.</small></div>
          <button className="submit" disabled={loading}>{loading ? "VERIFICANDO..." : "ENTRAR E ENVIAR FOTOS"}</button>
          {message ? <div className="message">{message}</div> : null}
        </form>
        <p className="security">Para sua segurança, o acesso é bloqueado temporariamente após tentativas incorretas. As fotos enviadas ficam em armazenamento privado da organização.</p>
      </section>
    </main>
  );
}
