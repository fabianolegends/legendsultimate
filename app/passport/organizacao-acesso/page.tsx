"use client";

import { FormEvent, useState } from "react";

export default function OrganizationAccessPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSubmitting(true); setMessage("Validando acesso...");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível autenticar.");
      window.location.href = "/passport/organizacao";
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível autenticar."); setSubmitting(false); }
  }

  return <main className="org-access"><style>{`
    .org-access{min-height:100vh;background:linear-gradient(105deg,rgba(7,9,8,.98),rgba(7,9,8,.78)),url('/hero-production.jpg') center/cover;color:#f4eee4;display:grid;place-items:center;padding:20px;font-family:Arial,sans-serif}.org-box{width:min(470px,100%);border:1px solid #3a3d35;background:rgba(23,26,22,.96);padding:36px;box-sizing:border-box}.org-box img{width:180px;margin-bottom:34px}.org-box h1{font-size:44px;line-height:1;text-transform:uppercase;margin:12px 0 16px}.org-box p{color:#b8b5ad;line-height:1.65}.org-box label{display:block;margin:24px 0 8px;font-weight:800}.org-box input{width:100%;box-sizing:border-box;padding:15px;background:#0d100d;color:white;border:1px solid #5a5f54}.org-box button{width:100%;margin-top:18px;padding:16px;border:0;background:#e86619;color:white;font-weight:900;cursor:pointer}.back{display:block;text-align:center;margin-top:18px;color:#aaaFA7;font-size:13px;text-decoration:none}.kicker{color:#d47b2d!important;letter-spacing:.2em;text-transform:uppercase;font-size:12px;font-weight:900}
  `}</style><form className="org-box" onSubmit={submit}><a href="/"><img src="/legends-logo-official.png" alt="Legends" /></a><p className="kicker">Legends Core</p><h1>Acesso da organização</h1><p>Use sua conta individual. No primeiro acesso, o proprietário pode deixar o e-mail vazio e usar a senha de contingência.</p><label htmlFor="admin-email">E-mail</label><input id="admin-email" type="email" autoComplete="username" value={email} onChange={event=>setEmail(event.target.value)} placeholder="operador@legends.com.br"/><label htmlFor="admin-password">Senha</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} required/><button type="submit" disabled={submitting||!password}>{submitting?"ENTRANDO...":"ENTRAR NO PAINEL"}</button>{message?<p style={{color:"#efb078",marginBottom:0}}>{message}</p>:null}<a className="back" href="/acesso">Escolher outra área de acesso</a></form></main>;
}
