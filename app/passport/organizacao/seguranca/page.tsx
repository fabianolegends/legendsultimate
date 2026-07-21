"use client";

import { FormEvent, useEffect, useState } from "react";

type Session = { email: string; name: string; role: string; legacy?: boolean };
type User = { id: string; email: string; full_name: string; role: string; active: boolean; last_login_at: string | null };

const roleNames: Record<string, string> = { owner: "Proprietário", director: "Diretor", steward: "Comissário", viewer: "Consulta" };

export default function SecurityPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", role: "viewer", password: "" });
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});

  async function load() {
    const sessionResponse = await fetch("/api/admin/session", { cache: "no-store" });
    const sessionPayload = await sessionResponse.json();
    setSession(sessionPayload.session ?? null);
    if (sessionPayload.session?.role === "owner") {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) setUsers(payload.users ?? []); else setMessage(payload.error ?? "Falha ao carregar usuários.");
    }
  }
  useEffect(() => { void load(); }, []);

  async function createUser(event: FormEvent) {
    event.preventDefault(); setMessage("Criando usuário...");
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error ?? "Falha ao criar usuário.");
    setForm({ full_name: "", email: "", role: "viewer", password: "" }); setMessage("Usuário criado com sucesso."); await load();
  }
  async function updateUser(user: User, changes: Record<string, unknown>) {
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, ...changes }) });
    const payload = await response.json();
    setMessage(response.ok ? "Acesso atualizado." : payload.error ?? "Falha ao atualizar.");
    if (response.ok) await load();
  }
  async function resetPassword(user: User) {
    const password = newPasswords[user.id] ?? "";
    if (password.length < 10) return setMessage("A nova senha deve ter ao menos 10 caracteres.");
    setMessage(`Redefinindo a senha de ${user.full_name}...`);
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, password }),
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error ?? "Falha ao redefinir a senha.");
    setNewPasswords((current) => ({ ...current, [user.id]: "" }));
    setMessage("Senha redefinida. Saia do acesso de contingência e teste a conta individual.");
    await load();
  }
  async function backup() {
    setMessage("Preparando backup...");
    const response = await fetch("/api/admin/backups", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!response.ok) return setMessage((await response.json()).error ?? "Falha ao gerar backup.");
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `legends-backup-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url); setMessage("Backup gerado com sucesso."); await load();
  }

  return <main className="security"><style>{`
    .security{min-height:100vh;background:#0d100d;color:#f2ede4;padding:52px 4vw 90px;font-family:Arial,sans-serif}.wrap{max-width:1500px;margin:auto}.kicker{color:#d47b2d;letter-spacing:.2em;font-size:12px;font-weight:900}.security h1{font-size:clamp(46px,7vw,86px);line-height:.9;text-transform:uppercase;margin:14px 0}.lead{color:#aeb3ab;max-width:760px;line-height:1.7}.cards{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #3d423a;margin:28px 0}.card{padding:18px;border-right:1px solid #3d423a}.card:last-child{border-right:0}.card small{display:block;color:#92978e;margin-bottom:8px}.card strong{font-size:18px}.panel{border:1px solid #3d423a;padding:24px;margin-top:24px}.panel h2{margin-top:0}.form{display:grid;grid-template-columns:1.2fr 1.2fr .8fr 1fr auto;gap:10px}.form input,.form select,.users select,.users input{background:#151914;color:#fff;border:1px solid #4c5148;padding:12px}.primary,.secondary{border:1px solid #d47b2d;padding:12px 16px;font-weight:900;cursor:pointer}.primary{background:#e86619;color:white}.secondary{background:transparent;color:#eee}.user{display:grid;grid-template-columns:1.1fr 1.1fr .75fr .55fr 1fr auto auto;gap:10px;align-items:center;padding:13px 0;border-top:1px solid #343931}.user span{color:#9ca198}.message{padding:12px;border:1px solid #76502d;background:#281b10;color:#efaa69;margin:16px 0}@media(max-width:1100px){.user{grid-template-columns:1fr 1fr}.user strong,.user span{align-self:center}}@media(max-width:900px){.cards{grid-template-columns:1fr}.form,.user{grid-template-columns:1fr}.panel{overflow:auto}}
  `}</style><div className="wrap"><p className="kicker">LEGENDS CORE · GOVERNANÇA</p><h1>Segurança e acessos</h1><p className="lead">Acessos individuais, permissões por função e cópia independente dos dados operacionais.</p>{message?<div className="message">{message}</div>:null}<section className="cards"><div className="card"><small>Usuário atual</small><strong>{session?.name ?? "—"}</strong></div><div className="card"><small>Papel</small><strong>{roleNames[session?.role ?? ""] ?? "—"}</strong></div><div className="card"><small>Usuários ativos</small><strong>{users.filter(user=>user.active).length || "—"}</strong></div></section>
  {session?.role==="owner"?<section className="panel"><h2>Usuários e permissões</h2>{session.legacy?<p className="lead">Você entrou pelo acesso de contingência. Crie agora o primeiro proprietário individual ou redefina sua senha abaixo.</p>:null}<form className="form" onSubmit={createUser}><input placeholder="Nome completo" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required/><input type="email" placeholder="E-mail" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="owner">Proprietário</option><option value="director">Diretor</option><option value="steward">Comissário</option><option value="viewer">Consulta</option></select><input type="password" minLength={10} placeholder="Senha inicial" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/><button className="primary">CRIAR ACESSO</button></form><div className="users">{users.map(user=><div className="user" key={user.id}><strong>{user.full_name}</strong><span>{user.email}</span><select value={user.role} onChange={e=>void updateUser(user,{role:e.target.value})}><option value="owner">Proprietário</option><option value="director">Diretor</option><option value="steward">Comissário</option><option value="viewer">Consulta</option></select><span>{user.active?"ATIVO":"BLOQUEADO"}</span><input type="password" minLength={10} autoComplete="new-password" placeholder="Nova senha" value={newPasswords[user.id]??""} onChange={e=>setNewPasswords(current=>({...current,[user.id]:e.target.value}))}/><button className="secondary" type="button" onClick={()=>void resetPassword(user)}>REDEFINIR SENHA</button><button className="secondary" type="button" onClick={()=>void updateUser(user,{active:!user.active})}>{user.active?"BLOQUEAR":"REATIVAR"}</button></div>)}</div></section>:null}
  {session?.role==="owner"||session?.role==="director"?<section className="panel"><h2>Backup operacional</h2><p className="lead">Baixe uma cópia JSON completa dos dados e guarde o arquivo fora da Vercel e do Supabase.</p><button className="primary" onClick={()=>void backup()}>GERAR E BAIXAR BACKUP</button></section>:null}</div></main>;
}
