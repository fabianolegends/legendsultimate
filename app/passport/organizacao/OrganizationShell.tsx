"use client";

import type { ReactNode } from "react";

export default function OrganizationShell({children}:{children:ReactNode}){
  async function logout(){await fetch("/api/admin/logout",{method:"POST"});window.location.href="/passport/organizacao-acesso";}
  return <div className="org-shell">
    <style>{`
      .org-shell{min-height:100vh;background:#0d100d}.org-nav{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 4vw;border-bottom:1px solid #353a33;background:#111410;color:#f3eee5;font-family:Arial,sans-serif;position:relative;z-index:1000}.org-nav img{width:150px}.org-links{display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:flex-end}.org-links a,.org-links button{color:#d7d3ca;background:transparent;border:0;text-decoration:none;text-transform:uppercase;font-size:10px;font-weight:900;letter-spacing:.06em;cursor:pointer}.org-links a:hover{color:#e86619}.org-mobile{display:none;color:#d47b2d;font-weight:900;text-transform:uppercase;font-size:12px}
      @media(max-width:900px){.org-nav{padding:14px 18px;align-items:flex-start}.org-nav img{width:130px}.org-links{display:grid;grid-template-columns:repeat(2,1fr);gap:8px 14px}.org-links a,.org-links button{text-align:left}.org-mobile{display:block}}
    `}</style>
    <header className="org-nav"><a href="/passport/organizacao"><img src="/legends-logo-official.png" alt="Legends" /></a><nav className="org-links"><a href="/passport/organizacao">Resumo</a><a href="/passport/organizacao/revisoes">Revisões</a><a href="/passport/organizacao/validacao">Validar</a><a href="/passport/organizacao/rotas">Rotas</a><a href="/passport/organizacao/checkpoints">Checkpoints</a><a href="/passport/organizacao/rankings">Rankings</a><button onClick={logout}>Sair</button></nav></header>
    {children}
  </div>;
}
