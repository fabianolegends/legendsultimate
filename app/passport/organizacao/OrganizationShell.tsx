"use client";

import type { ReactNode } from "react";
import {
  OrganizationEventProvider,
  useOrganizationEvent,
} from "./EventContext";

function ShellContent({ children }: { children: ReactNode }) {
  const { events, activeEventId, setActiveEventId, loading } =
    useOrganizationEvent();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/passport/organizacao-acesso";
  }
  return (
    <div className="org-shell">
      <style>{`
      .org-shell{min-height:100vh;background:#0d100d}.org-nav{min-height:82px;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 4vw;border-bottom:1px solid #353a33;background:#111410;color:#f3eee5;font-family:Arial,sans-serif;position:relative;z-index:1000}.org-nav img{width:142px}.org-nav-right{display:flex;align-items:center;gap:18px;min-width:0}.org-event{display:grid;gap:4px;min-width:220px}.org-event label{font-size:8px;font-weight:900;letter-spacing:.17em;color:#d8792d;text-transform:uppercase}.org-event select{width:100%;background:#0d100d;color:#f3eee5;border:1px solid #41463e;padding:9px 30px 9px 10px;font-size:12px}.org-links{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end}.org-links a,.org-links button{color:#d7d3ca;background:transparent;border:0;text-decoration:none;text-transform:uppercase;font-size:9px;font-weight:900;letter-spacing:.05em;cursor:pointer;white-space:nowrap}.org-links a:hover{color:#e86619}
      @media(max-width:1180px){.org-nav{padding:13px 18px;align-items:flex-start}.org-nav-right{display:grid;flex:1}.org-event{max-width:360px}.org-links{justify-content:flex-start}}
      @media(max-width:680px){.org-nav{display:block}.org-nav img{width:125px;margin-bottom:12px}.org-event{max-width:none}.org-links{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.org-links a,.org-links button{text-align:left}}
    `}</style>
      <header className="org-nav">
        <a href="/passport/organizacao">
          <img src="/legends-logo-official.png" alt="Legends" />
        </a>
        <div className="org-nav-right">
          <div className="org-event">
            <label>Evento ativo</label>
            <select
              aria-label="Evento ativo"
              value={activeEventId}
              disabled={loading || !events.length}
              onChange={(event) => setActiveEventId(event.target.value)}
            >
              <option value="">
                {loading ? "Carregando eventos..." : "Selecione um evento"}
              </option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.is_test ? "[TESTE] " : ""}
                  {event.name}
                </option>
              ))}
            </select>
          </div>
          <nav className="org-links">
            <a href="/passport/organizacao">Resumo</a>
            <a href="/passport/organizacao/eventos">Eventos</a>
            <a href="/passport/organizacao/inscritos">Inscritos</a>
            <a href="/passport/organizacao/revisoes">Revisões</a>
            <a href="/passport/organizacao/validacao">Validar</a>
            <a href="/passport/organizacao/rotas">Rotas</a>
            <a href="/passport/organizacao/checkpoints">Checkpoints</a>
            <a href="/passport/organizacao/rankings">Trechos</a>
            <a href="/passport/organizacao/classificacao">Classificação</a>
            <a href="/passport/organizacao/apuracao">Central de apuração</a>
            <a href="/passport/organizacao/impressao">Impressão</a>
            <a href="/passport/organizacao/seguranca">Segurança</a>
            <button onClick={logout}>Sair</button>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

export default function OrganizationShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OrganizationEventProvider>
      <ShellContent>{children}</ShellContent>
    </OrganizationEventProvider>
  );
}
