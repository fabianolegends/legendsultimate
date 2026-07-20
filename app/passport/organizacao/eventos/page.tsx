"use client";

import { FormEvent, useMemo, useState } from "react";
import { OrganizationEvent, useOrganizationEvent } from "../EventContext";
import EventStagesEditor from "./EventStagesEditor";
import TestEventCleanup from "./TestEventCleanup";

type EventForm = {
  name: string; slug: string; starts_on: string; ends_on: string; stage_count: number;
  location: string; description: string; participant_limit: string; event_type: string;
  scoring_mode: string; registration_source: string; access_mode: string; status: string; is_test: boolean;
  registration_open: boolean; registration_closes_at: string; windfit_registration_url: string; terms_url: string;
};

const initialForm: EventForm = {
  name: "", slug: "", starts_on: "", ends_on: "", stage_count: 2, location: "", description: "",
  participant_limit: "10", event_type: "adventure", scoring_mode: "weighted_points", registration_source: "mixed",
  access_mode: "invite", status: "draft", is_test: true,
  registration_open: false, registration_closes_at: "", windfit_registration_url: "", terms_url: "",
};

function eventToForm(event: OrganizationEvent): EventForm {
  return {
    name: event.name, slug: event.slug, starts_on: event.starts_on ?? "", ends_on: event.ends_on ?? "",
    stage_count: event.stage_count ?? 1, location: event.location ?? "", description: event.description ?? "",
    participant_limit: event.participant_limit ? String(event.participant_limit) : "", event_type: event.event_type ?? "adventure",
    scoring_mode: event.scoring_mode ?? "weighted_points", registration_source: event.registration_source ?? "mixed",
    access_mode: event.access_mode ?? "invite", status: event.status, is_test: event.is_test === true,
    registration_open: event.registration_open === true, registration_closes_at: event.registration_closes_at?.slice(0,16) ?? "",
    windfit_registration_url: event.windfit_registration_url ?? "", terms_url: event.terms_url ?? "",
  };
}

export default function EventsPage() {
  const { events, activeEventId, setActiveEventId, reloadEvents, moduleReady, loading } = useOrganizationEvent();
  const [drawer, setDrawer] = useState<"new" | "edit" | null>(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<EventForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const editing = useMemo(() => events.find((event) => event.id === editingId) ?? null, [editingId, events]);

  function openNew() { setEditingId(""); setForm(initialForm); setMessage(""); setDrawer("new"); }
  function openEdit(event: OrganizationEvent) { setEditingId(event.id); setForm(eventToForm(event)); setMessage(""); setDrawer("edit"); }
  function update<K extends keyof EventForm>(field: K, value: EventForm[K]) { setForm((current) => ({ ...current, [field]: value })); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/events", {
        method: drawer === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, event_id: editingId || undefined, participant_limit: form.participant_limit ? Number(form.participant_limit) : null,
          registration_closes_at: form.registration_closes_at ? new Date(form.registration_closes_at).toISOString() : null }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível salvar o evento.");
      const id = payload.event.id as string;
      await reloadEvents(id);
      setActiveEventId(id);
      setDrawer(null);
      setMessage(drawer === "edit" ? "Evento atualizado." : "Evento criado e selecionado. As etapas iniciais já estão prontas para receber os GPX.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o evento.");
    } finally { setSaving(false); }
  }

  return <main className="events-page">
    <style>{`
      .events-page{min-height:100vh;background:#0d100d;color:#f3eee5;padding:58px 4vw 90px;font-family:Arial,sans-serif}.events-wrap{max-width:1500px;margin:auto}.events-head{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:34px}.events-kicker{color:#dd7728;font-size:12px;font-weight:900;letter-spacing:.22em}.events-head h1{font-size:clamp(46px,7vw,96px);font-weight:300;line-height:.9;margin:14px 0}.events-head p{color:#a8aaa4;max-width:720px;font-size:18px;line-height:1.55}.primary,.secondary{padding:17px 24px;border:1px solid #d76d20;font-weight:900;cursor:pointer;text-transform:uppercase}.primary{background:#ef6814;color:#fff}.secondary{background:transparent;color:#f3eee5}.event-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.event-card{border:1px solid #373c35;background:#151814;padding:24px;display:flex;flex-direction:column;min-height:310px}.event-card.active{border-color:#ef6814;box-shadow:inset 0 3px #ef6814}.event-meta{display:flex;justify-content:space-between;gap:12px;color:#c16c2b;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.event-card h2{font-size:30px;font-weight:400;margin:20px 0 8px}.event-card p{color:#a7aaa2;line-height:1.5}.event-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:#363a34;margin-top:auto}.event-stats div{background:#111410;padding:14px}.event-stats strong{display:block;font-size:23px}.event-stats span{font-size:9px;letter-spacing:.12em;color:#8f928b;text-transform:uppercase}.event-actions{display:flex;gap:10px;margin-top:16px}.event-actions button{flex:1;padding:12px;border:1px solid #464b43;background:transparent;color:#e9e4da;font-weight:800;cursor:pointer}.event-actions .use{background:#e86619;border-color:#e86619}.notice{border:1px solid #70451f;background:#271b11;color:#efb078;padding:16px;margin:0 0 24px}.empty{border:1px dashed #494d46;padding:70px;text-align:center;color:#aaa}.drawer-backdrop{position:fixed;inset:0;background:#000b;z-index:2000}.drawer{position:fixed;right:0;top:0;bottom:0;width:min(620px,100%);background:#171a16;color:#f3eee5;padding:34px;overflow:auto;z-index:2001;box-shadow:-18px 0 60px #0008}.drawer-head{display:flex;justify-content:space-between;gap:20px;align-items:start}.drawer h2{font-size:38px;font-weight:400;margin:0}.drawer-close{background:transparent;border:0;color:white;font-size:28px;cursor:pointer}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px}.form-grid label{display:grid;gap:7px;font-size:12px;font-weight:800;color:#c7c5be}.form-grid .wide{grid-column:1/-1}.form-grid input,.form-grid select,.form-grid textarea{width:100%;box-sizing:border-box;padding:13px;background:#0d100d;border:1px solid #4b5047;color:white;font:inherit}.check{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center}.check input{width:auto}.drawer-actions{display:flex;gap:12px;margin-top:26px}.drawer-actions button{flex:1}.muted{color:#999;font-size:12px}.status-pill{padding:5px 8px;border:1px solid #4c5149}.status-pill.test{color:#ef9a59;border-color:#8a4a20}@media(max-width:1000px){.event-grid{grid-template-columns:1fr 1fr}.events-head{align-items:start}}@media(max-width:680px){.events-page{padding:35px 18px 70px}.events-head{display:block}.events-head button{width:100%;margin-top:18px}.event-grid{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.drawer{padding:24px}.event-card{min-height:auto}}
    `}</style>
    <div className="events-wrap">
      <header className="events-head"><div><div className="events-kicker">LEGENDS CORE · MULTI-EVENTO</div><h1>Eventos</h1><p>Crie ambientes independentes para testes, aventuras e provas oficiais. Rotas, atletas, validações e classificações ficam isolados dentro do evento selecionado.</p></div><button className="primary" onClick={openNew}>Novo evento</button></header>
      {!moduleReady && <div className="notice">Execute as migrations pendentes do Supabase para liberar o cadastro completo.</div>}
      {message && <div className="notice">{message}</div>}
      {loading && !events.length ? <div className="empty">Carregando eventos...</div> : events.length ? <div className="event-grid">
        {events.map((event) => <article className={`event-card ${event.id === activeEventId ? "active" : ""}`} key={event.id}>
          <div className="event-meta"><span className={`status-pill ${event.is_test ? "test" : ""}`}>{event.is_test ? "Teste" : event.status}</span><span>{event.starts_on || "Sem data"}</span></div>
          <h2>{event.name}</h2><p>{event.location || "Local a definir"}</p><p>{event.description || "Evento pronto para receber percursos, inscritos e regras próprias."}</p>
          <div className="event-stats"><div><strong>{event.stage_count ?? 0}</strong><span>Etapas</span></div><div><strong>{event.registration_count ?? 0}</strong><span>Inscritos</span></div><div><strong>{event.participant_limit ?? "∞"}</strong><span>Limite</span></div></div>
          <div className="event-actions"><button onClick={() => openEdit(event)}>Editar</button>{event.id === activeEventId ? <button disabled>Em uso</button> : <button className="use" onClick={() => setActiveEventId(event.id)}>Usar evento</button>}</div>
          {event.registration_open && event.access_mode === "public" && <a href={`/eventos/${event.slug}`} target="_blank" style={{marginTop:10,padding:12,border:"1px solid #d76d20",color:"#ef9a59",textAlign:"center",textDecoration:"none",fontWeight:900}}>ABRIR PÁGINA DE INSCRIÇÃO ↗</a>}
        </article>)}
      </div> : <div className="empty"><p>Nenhum evento cadastrado.</p><button className="primary" onClick={openNew}>Criar o primeiro evento</button></div>}
    </div>
    {drawer && <><div className="drawer-backdrop" onClick={() => setDrawer(null)}/><aside className="drawer">
      <div className="drawer-head"><div><div className="events-kicker">{drawer === "new" ? "NOVO AMBIENTE" : "CONFIGURAÇÃO"}</div><h2>{drawer === "new" ? "Criar evento" : editing?.name}</h2></div><button className="drawer-close" onClick={() => setDrawer(null)}>×</button></div>
      <form onSubmit={submit} className="form-grid">
        <label className="wide">Nome<input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="2 Dias de Aventura"/></label>
        <label>Data inicial<input required type="date" value={form.starts_on} onChange={(e) => update("starts_on", e.target.value)}/></label>
        <label>Data final<input required type="date" value={form.ends_on} onChange={(e) => update("ends_on", e.target.value)}/></label>
        {drawer === "new" && <label>Número de etapas<input min={1} max={20} type="number" value={form.stage_count} onChange={(e) => update("stage_count", Number(e.target.value))}/></label>}
        <label>Limite de participantes<input min={1} type="number" value={form.participant_limit} onChange={(e) => update("participant_limit", e.target.value)} placeholder="Sem limite"/></label>
        <label className="wide">Local<input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Cidade / Estado / País"/></label>
        <label>Formato<select value={form.event_type} onChange={(e) => update("event_type", e.target.value)}><option value="adventure">Aventura</option><option value="stage_race">Prova por etapas</option><option value="challenge">Desafio</option></select></label>
        <label>Classificação<select value={form.scoring_mode} onChange={(e) => update("scoring_mode", e.target.value)}><option value="weighted_points">Pontos ponderados</option><option value="elapsed_time">Menor tempo</option><option value="completion">Conclusão</option></select></label>
        <label>Inscrições<select value={form.registration_source} onChange={(e) => update("registration_source", e.target.value)}><option value="mixed">Windfit + manual</option><option value="windfit">Somente Windfit</option><option value="manual">Convite/manual</option></select></label>
        <label>Acesso<select value={form.access_mode} onChange={(e) => update("access_mode", e.target.value)}><option value="invite">Somente convidados</option><option value="public">Público</option></select></label>
        <label>Status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
        <label className="check"><input type="checkbox" checked={form.is_test} onChange={(e) => update("is_test", e.target.checked)}/><span>Este é um evento de teste</span></label>
        <div className="wide" style={{borderTop:"1px solid #41463e",paddingTop:18,marginTop:6}}><strong style={{color:"#ef8a43"}}>INSCRIÇÃO ONLINE</strong><p className="muted">Para exibir o botão público, deixe o evento Publicado, o acesso Público e ative as inscrições.</p></div>
        <label className="check wide"><input type="checkbox" checked={form.registration_open} onChange={(e) => update("registration_open", e.target.checked)}/><span>Inscrições abertas neste evento</span></label>
        <label>Encerramento das inscrições<input type="datetime-local" value={form.registration_closes_at} onChange={(e) => update("registration_closes_at", e.target.value)}/></label>
        <label>Link da Windfit<input type="url" value={form.windfit_registration_url} onChange={(e) => update("windfit_registration_url", e.target.value)} placeholder="Opcional"/></label>
        <label className="wide">Link do regulamento/termo<input type="url" value={form.terms_url} onChange={(e) => update("terms_url", e.target.value)} placeholder="Opcional"/></label>
        <label className="wide">Descrição<textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Objetivo, regras gerais e observações do evento."/></label>
        <div className="wide muted">Ao criar, o sistema prepara automaticamente as etapas. Depois, envie um GPX diferente para cada uma em Percursos oficiais.</div>
        {message && drawer && <div className="wide notice">{message}</div>}
        <div className="wide drawer-actions"><button type="button" className="secondary" onClick={() => setDrawer(null)}>Cancelar</button><button className="primary" disabled={saving}>{saving ? "Salvando..." : "Salvar evento"}</button></div>
      </form>
      {drawer === "edit" && editing && <>
        <EventStagesEditor event={editing} onChanged={reloadEvents}/>
        {editing.is_test && <TestEventCleanup event={editing} onCleaned={reloadEvents}/>}
      </>}
    </aside></>}
  </main>;
}
