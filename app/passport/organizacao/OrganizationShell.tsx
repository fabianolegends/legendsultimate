"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  OrganizationEventProvider,
  useOrganizationEvent,
} from "./EventContext";

type Identity = { name: string; role: string };
type NavItem = { href: string; label: string; icon: string; exact?: boolean };

const groups: Array<{ label: string; items: NavItem[] }> = [
  { label: "Visão geral", items: [{ href: "/passport/organizacao", label: "Dashboard", icon: "⌂", exact: true }] },
  { label: "Preparação", items: [
    { href: "/passport/organizacao/eventos", label: "Eventos", icon: "◇" },
    { href: "/passport/organizacao/inscritos", label: "Inscritos", icon: "◎" },
    { href: "/passport/organizacao/rotas", label: "Percursos oficiais", icon: "↝" },
    { href: "/passport/organizacao/checkpoints", label: "Checkpoints", icon: "⌖" },
  ] },
  { label: "Operação", items: [
    { href: "/passport/organizacao/apuracao", label: "Central de apuração", icon: "◉" },
    { href: "/passport/organizacao/validacao", label: "Validar atividades", icon: "✓" },
    { href: "/passport/organizacao/revisoes", label: "Revisões", icon: "!" },
  ] },
  { label: "Resultados", items: [
    { href: "/passport/organizacao/classificacao", label: "Classificação", icon: "≡" },
    { href: "/passport/organizacao/rankings", label: "Rankings de trechos", icon: "↗" },
    { href: "/passport/organizacao/impressao", label: "Impressão e PDF", icon: "▤" },
  ] },
  { label: "Administração", items: [
    { href: "/passport/organizacao/seguranca", label: "Equipe e segurança", icon: "◫" },
  ] },
];

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  director: "Direção",
  steward: "Comissário",
  viewer: "Consulta",
};

function ShellContent({ children, identity }: { children: ReactNode; identity: Identity }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { events, activeEventId, activeEvent, setActiveEventId, loading } = useOrganizationEvent();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/passport/organizacao-acesso";
  }

  function active(item: NavItem) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <div className={`org-shell ${collapsed ? "is-collapsed" : ""} ${open ? "menu-open" : ""}`}>
      <style>{`
        .org-shell{--side:276px;min-height:100vh;background:#0d100d;color:#f3eee5;font-family:Arial,sans-serif}.org-sidebar{position:fixed;inset:0 auto 0 0;width:var(--side);box-sizing:border-box;background:#111410;border-right:1px solid #343a32;z-index:1200;display:flex;flex-direction:column;transition:width .2s ease,transform .2s ease}.org-brand{height:72px;display:flex;align-items:center;justify-content:space-between;padding:8px 20px;border-bottom:1px solid #343a32;box-sizing:border-box;overflow:hidden}.org-brand a{display:flex;align-items:center;height:100%;min-width:0}.org-brand img{display:block;width:112px;max-width:100%;max-height:48px;object-fit:contain;object-position:left center}.org-collapse{width:30px;height:30px;border:1px solid #41473e;background:transparent;color:#aaa;font-size:18px;cursor:pointer}.org-menu{padding:18px 12px 24px;overflow:auto;flex:1}.org-group{margin-bottom:20px}.org-group-title{margin:0 12px 8px;color:#777e75;font-size:9px;line-height:1;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.org-menu-link{display:flex;align-items:center;gap:12px;min-height:42px;padding:0 12px;color:#bbbfb7;text-decoration:none;border-left:2px solid transparent;font-size:13px;font-weight:700}.org-menu-link:hover{background:#181c17;color:#fff}.org-menu-link.active{background:#21180f;border-left-color:#e86619;color:#fff}.org-menu-icon{display:grid;place-items:center;width:22px;height:22px;color:#df7b32;font-size:16px;flex:0 0 auto}.org-user{padding:16px 20px 20px;border-top:1px solid #343a32}.org-user strong,.org-user span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.org-user strong{font-size:12px}.org-user span{font-size:10px;color:#858c82;margin-top:4px}.org-logout{margin-top:13px;padding:0;border:0;background:transparent;color:#d47b2d;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;cursor:pointer}.org-main{min-height:100vh;margin-left:var(--side);transition:margin-left .2s ease}.org-topbar{height:72px;padding:0 32px;box-sizing:border-box;border-bottom:1px solid #343a32;background:rgba(13,16,13,.96);display:flex;align-items:center;justify-content:space-between;gap:24px;position:sticky;top:0;z-index:1000;backdrop-filter:blur(12px)}.org-top-left{display:flex;align-items:center;gap:16px;min-width:0}.org-mobile-toggle{display:none;width:42px;height:42px;border:1px solid #464c43;background:transparent;color:#eee;font-size:20px;cursor:pointer}.org-event{display:grid;gap:5px;min-width:290px}.org-event label{font-size:8px;font-weight:900;letter-spacing:.17em;color:#d8792d;text-transform:uppercase}.org-event select{width:100%;background:#151914;color:#f3eee5;border:1px solid #41463e;padding:10px 34px 10px 12px;font-size:13px}.org-event-meta{display:flex;align-items:center;gap:10px}.org-status{border:1px solid #50564d;padding:6px 9px;color:#aaa;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.org-status.published{border-color:#31543b;color:#70c78d}.org-status.test{border-color:#76502d;color:#efaa69}.org-public{color:#d6d8d2;font-size:11px;font-weight:800;text-decoration:none}.org-public:hover{color:#ef8b39}.org-overlay{display:none}.org-page{min-width:0}.is-collapsed{--side:78px}.is-collapsed .org-brand{padding:0 13px}.is-collapsed .org-brand img{width:0;opacity:0}.is-collapsed .org-menu{padding-left:8px;padding-right:8px}.is-collapsed .org-group-title,.is-collapsed .org-menu-link span:last-child,.is-collapsed .org-user strong,.is-collapsed .org-user span,.is-collapsed .org-logout{display:none}.is-collapsed .org-menu-link{justify-content:center;padding:0}.is-collapsed .org-menu-icon{font-size:18px}.is-collapsed .org-user{height:58px;padding:0}.is-collapsed .org-collapse{transform:rotate(180deg)}
        @media(max-width:900px){.org-shell{--side:276px}.org-sidebar{transform:translateX(-100%);box-shadow:18px 0 50px rgba(0,0,0,.4)}.menu-open .org-sidebar{transform:translateX(0)}.org-main,.is-collapsed .org-main{margin-left:0}.org-collapse{display:none}.org-mobile-toggle{display:block}.org-topbar{height:72px;padding:0 18px}.org-event{min-width:0;width:min(68vw,420px)}.org-event-meta{display:none}.org-overlay{display:block;position:fixed;inset:0;background:rgba(0,0,0,.64);z-index:1100;opacity:0;pointer-events:none;transition:opacity .2s}.menu-open .org-overlay{opacity:1;pointer-events:auto}.is-collapsed .org-brand img{width:112px;opacity:1}.is-collapsed .org-group-title,.is-collapsed .org-menu-link span:last-child,.is-collapsed .org-user strong,.is-collapsed .org-user span,.is-collapsed .org-logout{display:block}.is-collapsed .org-menu-link{justify-content:flex-start;padding:0 12px}}
      `}</style>
      <button className="org-overlay" aria-label="Fechar menu" onClick={() => setOpen(false)} />
      <aside className="org-sidebar">
        <div className="org-brand">
          <a href="/passport/organizacao"><img src="/legends-logo-official.png" alt="Legends" /></a>
          <button className="org-collapse" onClick={() => setCollapsed((value) => !value)} aria-label="Recolher menu">‹</button>
        </div>
        <nav className="org-menu" aria-label="Navegação da organização">
          {groups.map((group) => <section className="org-group" key={group.label}>
            <p className="org-group-title">{group.label}</p>
            {group.items.map((item) => <a key={item.href} href={item.href} title={item.label} className={`org-menu-link ${active(item) ? "active" : ""}`} onClick={() => setOpen(false)}>
              <span className="org-menu-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
            </a>)}
            {group.label === "Resultados" && activeEvent?.slug ? <a href={`/resultados/${activeEvent.slug}`} className="org-menu-link" target="_blank" rel="noreferrer">
              <span className="org-menu-icon" aria-hidden="true">↗</span><span>Resultado público</span>
            </a> : null}
          </section>)}
        </nav>
        <div className="org-user"><strong>{identity.name}</strong><span>{roleLabels[identity.role] ?? identity.role}</span><button className="org-logout" onClick={logout}>Sair com segurança</button></div>
      </aside>
      <div className="org-main">
        <header className="org-topbar">
          <div className="org-top-left"><button className="org-mobile-toggle" onClick={() => setOpen(true)} aria-label="Abrir menu">☰</button>
            <div className="org-event"><label>Evento em operação</label><select aria-label="Evento ativo" value={activeEventId} disabled={loading || !events.length} onChange={(event) => setActiveEventId(event.target.value)}><option value="">{loading ? "Carregando eventos..." : "Selecione um evento"}</option>{events.map((event) => <option key={event.id} value={event.id}>{event.is_test ? "[TESTE] " : ""}{event.name}</option>)}</select></div>
          </div>
          <div className="org-event-meta"><span className={`org-status ${activeEvent?.is_test ? "test" : activeEvent?.status === "published" ? "published" : ""}`}>{activeEvent?.is_test ? "Evento teste" : activeEvent?.status === "published" ? "Publicado" : "Rascunho"}</span>{activeEvent?.slug ? <a className="org-public" href={`/resultados/${activeEvent.slug}`} target="_blank" rel="noreferrer">Ver página pública ↗</a> : null}</div>
        </header>
        <div className="org-page">{children}</div>
      </div>
    </div>
  );
}

export default function OrganizationShell({ children, identity }: { children: ReactNode; identity: Identity }) {
  return <OrganizationEventProvider><ShellContent identity={identity}>{children}</ShellContent></OrganizationEventProvider>;
}
