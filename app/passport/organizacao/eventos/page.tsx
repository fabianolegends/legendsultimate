"use client";

import { FormEvent, useMemo, useState } from "react";
import { OrganizationEvent, useOrganizationEvent } from "../EventContext";
import EventStagesEditor from "./EventStagesEditor";
import TestEventCleanup from "./TestEventCleanup";

type CertificateSettings = { enabled: boolean; template_url: string | null; text_color: string };
const emptyCertificate: CertificateSettings = { enabled: false, template_url: null, text_color: "#171a16" };

type LotForm = {
  name: string;
  starts_at: string;
  ends_at: string;
  registration_fee: string;
};

type EventForm = {
  name: string; slug: string; starts_on: string; ends_on: string; stage_count: number;
  location: string; description: string; participant_limit: string; event_type: string;
  scoring_mode: string; access_mode: string; status: string; is_test: boolean;
  registration_open: boolean; registration_closes_at: string; windfit_registration_url: string; terms_url: string;
  registration_fee: string; experience_fee: string;
  premium_kit_enabled: boolean; premium_kit_fee: string; casual_shirt_required: boolean;
  senior_discount_enabled: boolean; senior_discount_percent: string; regulation_version: string;
  registration_lots: LotForm[];
};

const initialForm: EventForm = {
  name: "", slug: "", starts_on: "", ends_on: "", stage_count: 2, location: "", description: "",
  participant_limit: "10", event_type: "adventure", scoring_mode: "weighted_points",
  access_mode: "invite", status: "draft", is_test: true,
  registration_open: false, registration_closes_at: "", windfit_registration_url: "", terms_url: "",
  registration_fee: "", experience_fee: "",
  premium_kit_enabled: false, premium_kit_fee: "", casual_shirt_required: false,
  senior_discount_enabled: false, senior_discount_percent: "50", regulation_version: "",
  registration_lots: [],
};

function centsToInput(value: number | null | undefined) {
  return value == null ? "" : (value / 100).toFixed(2);
}

function inputToCents(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null;
}

function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return local.toISOString().slice(0, 16);
}

function eventToForm(event: OrganizationEvent): EventForm {
  return {
    name: event.name, slug: event.slug, starts_on: event.starts_on ?? "", ends_on: event.ends_on ?? "",
    stage_count: event.stage_count ?? 1, location: event.location ?? "", description: event.description ?? "",
    participant_limit: event.participant_limit ? String(event.participant_limit) : "", event_type: event.event_type ?? "adventure",
    scoring_mode: event.scoring_mode ?? "weighted_points",
    access_mode: event.access_mode ?? "invite", status: event.status, is_test: event.is_test === true,
    registration_open: event.registration_open === true, registration_closes_at: toLocalDateTimeInput(event.registration_closes_at),
    windfit_registration_url: event.windfit_registration_url ?? "", terms_url: event.terms_url ?? "",
    registration_fee: centsToInput(event.registration_fee_cents),
    experience_fee: centsToInput(event.experience_fee_cents),
    premium_kit_enabled: event.premium_kit_enabled === true,
    premium_kit_fee: centsToInput(event.premium_kit_fee_cents),
    casual_shirt_required: event.casual_shirt_required === true,
    senior_discount_enabled: event.senior_discount_enabled === true,
    senior_discount_percent: String(event.senior_discount_percent ?? 50),
    regulation_version: event.regulation_version ?? "",
    registration_lots: (event.registration_lots ?? []).map((lot) => ({
      name: lot.name,
      starts_at: toLocalDateTimeInput(lot.starts_at),
      ends_at: toLocalDateTimeInput(lot.ends_at),
      registration_fee: centsToInput(lot.registration_fee_cents),
    })),
  };
}

export default function EventsPage() {
  const { events, activeEventId, setActiveEventId, reloadEvents, moduleReady, loading } = useOrganizationEvent();
  const [drawer, setDrawer] = useState<"new" | "edit" | null>(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<EventForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [certificate, setCertificate] = useState<CertificateSettings>(emptyCertificate);
  const [certificateReady, setCertificateReady] = useState(true);
  const [certificateSaving, setCertificateSaving] = useState(false);
  const [message, setMessage] = useState("");
  const editing = useMemo(() => events.find((event) => event.id === editingId) ?? null, [editingId, events]);

  function openNew() { setEditingId(""); setForm(initialForm); setCertificate(emptyCertificate); setMessage(""); setDrawer("new"); }
  function openEdit(event: OrganizationEvent) { setEditingId(event.id); setForm(eventToForm(event)); setCertificate(emptyCertificate); setMessage(""); setDrawer("edit"); void loadCertificate(event.id); }
  function update<K extends keyof EventForm>(field: K, value: EventForm[K]) { setForm((current) => ({ ...current, [field]: value })); }
  function updateLot(index: number, field: keyof LotForm, value: string) {
    setForm((current) => ({
      ...current,
      registration_lots: current.registration_lots.map((lot, lotIndex) =>
        lotIndex === index ? { ...lot, [field]: value } : lot,
      ),
    }));
  }
  function addLot() {
    setForm((current) => ({
      ...current,
      registration_lots: [
        ...current.registration_lots,
        {
          name: `Lote ${String(current.registration_lots.length + 1).padStart(2, "0")}`,
          starts_at: "",
          ends_at: "",
          registration_fee: "",
        },
      ],
    }));
  }
  function removeLot(index: number) {
    setForm((current) => ({
      ...current,
      registration_lots: current.registration_lots.filter(
        (_, lotIndex) => lotIndex !== index,
      ),
    }));
  }

  async function loadCertificate(eventId: string) {
    try {
      const response = await fetch(`/api/admin/events/certificate?eventId=${encodeURIComponent(eventId)}`, { cache: "no-store" });
      const payload = await response.json();
      setCertificateReady(payload.module_ready !== false);
      if (!response.ok) throw new Error(payload.error ?? "Certificados ainda não configurados.");
      setCertificate(payload.settings ?? emptyCertificate);
    } catch (error) {
      setCertificateReady(false);
      setMessage(error instanceof Error ? error.message : "Certificados ainda não configurados.");
    }
  }

  async function uploadCertificate(file: File) {
    if (!editingId) return;
    setCertificateSaving(true); setMessage("");
    try {
      const data = new FormData(); data.set("eventId", editingId); data.set("file", file);
      const response = await fetch("/api/admin/events/certificate", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar a arte.");
      setCertificate(payload.settings); setCertificateReady(true); setMessage("Arte-base carregada e emissão de certificados ativada.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível carregar a arte."); }
    finally { setCertificateSaving(false); }
  }

  async function saveCertificate() {
    if (!editingId) return;
    setCertificateSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/events/certificate", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_id: editingId, enabled: certificate.enabled, text_color: certificate.text_color }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível salvar o certificado.");
      setCertificate(payload.settings); setMessage("Configuração do certificado salva.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar o certificado."); }
    finally { setCertificateSaving(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/events", {
        method: drawer === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, event_id: editingId || undefined, participant_limit: form.participant_limit ? Number(form.participant_limit) : null,
          registration_fee_cents: inputToCents(form.registration_fee), experience_fee_cents: inputToCents(form.experience_fee),
          premium_kit_fee_cents: form.premium_kit_enabled ? inputToCents(form.premium_kit_fee) : null,
          registration_source: form.is_test ? "manual" : "windfit",
          senior_discount_percent: Number(form.senior_discount_percent),
          registration_lots: form.registration_lots.map((lot) => ({
            name: lot.name,
            starts_at: new Date(lot.starts_at).toISOString(),
            ends_at: new Date(lot.ends_at).toISOString(),
            registration_fee_cents: inputToCents(lot.registration_fee),
          })),
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

  async function createSimulation() {
    if (!window.confirm("Criar um evento de TESTE com 10 atletas fictícios, dois GPX, checkpoints, atividades e resultados?")) return;
    setSimulating(true); setMessage("Montando a simulação completa...");
    try {
      const response = await fetch("/api/admin/simulations", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível criar a simulação.");
      await reloadEvents(payload.event.id);
      setActiveEventId(payload.event.id);
      setMessage(`Simulação criada e selecionada: ${payload.summary.athletes} atletas, ${payload.summary.activities} atividades e ${payload.summary.checkpoints} checkpoints.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar a simulação.");
    } finally { setSimulating(false); }
  }

  async function deleteTestEvent(event: OrganizationEvent) {
    const required = `EXCLUIR ${event.name}`;
    const confirmation = window.prompt(`Esta ação remove permanentemente o evento e todos os dados da simulação.\n\nDigite exatamente:\n${required}`);
    if (confirmation === null) return;
    if (confirmation !== required) { setMessage("Confirmação incorreta. O evento não foi excluído."); return; }
    setDeleting(true); setMessage("");
    try {
      const response = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.id, confirmation }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível excluir o evento.");
      setDrawer(null); setEditingId("");
      await reloadEvents();
      setMessage(`Evento de teste “${event.name}” excluído permanentemente.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o evento.");
    } finally { setDeleting(false); }
  }

  return <main className="events-page">
    <style>{`
      .events-page{min-height:100vh;background:#0d100d;color:#f3eee5;padding:58px 4vw 90px;font-family:Arial,sans-serif}.events-wrap{max-width:1500px;margin:auto}.events-head{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:34px}.events-kicker{color:#dd7728;font-size:12px;font-weight:900;letter-spacing:.22em}.events-head h1{font-size:clamp(38px,5vw,62px);font-weight:300;line-height:.95;margin:12px 0}.events-head p{color:#a8aaa4;max-width:690px;font-size:16px;line-height:1.5}.head-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.primary,.secondary{padding:17px 24px;border:1px solid #d76d20;font-weight:900;cursor:pointer;text-transform:uppercase}.primary{background:#ef6814;color:#fff}.secondary{background:transparent;color:#f3eee5}.event-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.event-card{border:1px solid #373c35;background:#151814;padding:24px;display:flex;flex-direction:column;min-height:310px}.event-card.active{border-color:#ef6814;box-shadow:inset 0 3px #ef6814}.event-meta{display:flex;justify-content:space-between;gap:12px;color:#c16c2b;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.event-card h2{font-size:30px;font-weight:400;margin:20px 0 8px}.event-card p{color:#a7aaa2;line-height:1.5}.event-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:#363a34;margin-top:auto}.event-stats div{background:#111410;padding:14px}.event-stats strong{display:block;font-size:23px}.event-stats span{font-size:9px;letter-spacing:.12em;color:#8f928b;text-transform:uppercase}.event-actions{display:flex;gap:10px;margin-top:16px}.event-actions button{flex:1;padding:12px;border:1px solid #464b43;background:transparent;color:#e9e4da;font-weight:800;cursor:pointer}.event-actions .use{background:#e86619;border-color:#e86619}.notice{border:1px solid #70451f;background:#271b11;color:#efb078;padding:16px;margin:0 0 24px}.empty{border:1px dashed #494d46;padding:70px;text-align:center;color:#aaa}.drawer-backdrop{position:fixed;inset:0;background:#000b;z-index:2000}.drawer{position:fixed;right:0;top:0;bottom:0;width:min(620px,100%);background:#171a16;color:#f3eee5;padding:34px;overflow:auto;z-index:2001;box-shadow:-18px 0 60px #0008}.drawer-head{display:flex;justify-content:space-between;gap:20px;align-items:start}.drawer h2{font-size:38px;font-weight:400;margin:0}.drawer-close{background:transparent;border:0;color:white;font-size:28px;cursor:pointer}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px}.form-grid label{display:grid;gap:7px;font-size:12px;font-weight:800;color:#c7c5be}.form-grid .wide{grid-column:1/-1}.form-grid input,.form-grid select,.form-grid textarea{width:100%;box-sizing:border-box;padding:13px;background:#0d100d;border:1px solid #4b5047;color:white;font:inherit}.check{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center}.check input{width:auto}.drawer-actions{display:flex;gap:12px;margin-top:26px}.drawer-actions button{flex:1}.delete-event-zone{margin-top:16px;border:1px solid #713429;background:#211411;padding:22px}.delete-event-zone h3{margin:0 0 8px;color:#ff8b63;font-size:17px;letter-spacing:.1em}.delete-event-zone p{color:#c8b7af;line-height:1.5}.delete-event-button{width:100%;padding:15px;border:1px solid #d04d32;background:#d04d32;color:#fff;font-weight:900;cursor:pointer}.delete-event-button:disabled{opacity:.45;cursor:not-allowed}.certificate-config{border-top:1px solid #41463e;margin-top:8px;padding-top:20px;display:grid;gap:13px}.certificate-config h3{margin:0;color:#ef8a43;font-size:16px;letter-spacing:.08em}.certificate-upload{border:1px dashed #6d563f;padding:16px;cursor:pointer}.certificate-upload input{margin-top:8px}.certificate-preview{width:100%;max-height:210px;object-fit:contain;background:#eee5d8;border:1px solid #4b5047}.certificate-save{padding:13px;border:1px solid #d76d20;background:transparent;color:#f3eee5;font-weight:900;cursor:pointer}.certificate-save:disabled{opacity:.5}.muted{color:#999;font-size:12px}.status-pill{padding:5px 8px;border:1px solid #4c5149}.status-pill.test{color:#ef9a59;border-color:#8a4a20}@media(max-width:1000px){.event-grid{grid-template-columns:1fr 1fr}.events-head{align-items:start}}@media(max-width:680px){.events-page{padding:35px 18px 70px}.events-head{display:block}.head-actions{display:grid;margin-top:18px}.events-head button{width:100%}.event-grid{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.drawer{padding:24px}.event-card{min-height:auto}}
    `}</style>
    <div className="events-wrap">
      <header className="events-head"><div><div className="events-kicker">LEGENDS CORE · MULTI-EVENTO</div><h1>Eventos</h1><p>Crie ambientes independentes para testes, aventuras e provas oficiais. Rotas, atletas, validações e classificações ficam isolados dentro do evento selecionado.</p></div><div className="head-actions"><button className="secondary" disabled={simulating} onClick={()=>void createSimulation()}>{simulating?"CRIANDO SIMULAÇÃO...":"SIMULAÇÃO COMPLETA"}</button><button className="primary" onClick={openNew}>Novo evento</button></div></header>
      {!moduleReady && <div className="notice">Execute as migrations pendentes do Supabase para liberar o cadastro completo.</div>}
      {message && <div className="notice">{message}</div>}
      {loading && !events.length ? <div className="empty">Carregando eventos...</div> : events.length ? <div className="event-grid">
        {events.map((event) => <article className={`event-card ${event.id === activeEventId ? "active" : ""}`} key={event.id}>
          <div className="event-meta"><span className={`status-pill ${event.is_test ? "test" : ""}`}>{event.is_test ? "Teste" : event.status}</span><span>{event.starts_on || "Sem data"}</span></div>
          <h2>{event.name}</h2><p>{event.location || "Local a definir"}</p><p>{event.description || "Evento pronto para receber percursos, inscritos e regras próprias."}</p>
          <div className="event-stats"><div><strong>{event.stage_count ?? 0}</strong><span>Etapas</span></div><div><strong>{event.registration_count ?? 0}</strong><span>Inscritos</span></div><div><strong>{event.participant_limit ?? "∞"}</strong><span>Limite</span></div></div>
          <div className="event-actions"><button onClick={() => openEdit(event)}>Editar</button>{event.id === activeEventId ? <button disabled>Em uso</button> : <button className="use" onClick={() => setActiveEventId(event.id)}>Usar evento</button>}</div>
          {event.is_test && <a href={`/eventos/${event.slug}?modo=teste`} target="_blank" rel="noreferrer" style={{marginTop:10,padding:12,background:"#e86619",border:"1px solid #e86619",color:"#fff",textAlign:"center",textDecoration:"none",fontWeight:900}}>VISUALIZAR EVENTO DE TESTE ↗</a>}
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
        <label>Origem das inscrições<input readOnly value={form.is_test ? "Manual (evento de teste)" : "Windfit"}/></label>
        <label>Acesso<select value={form.access_mode} onChange={(e) => update("access_mode", e.target.value)}><option value="invite">Somente convidados</option><option value="public">Público</option></select></label>
        <label>Status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
        <label className="check"><input type="checkbox" checked={form.is_test} onChange={(e) => update("is_test", e.target.checked)}/><span>Este é um evento de teste</span></label>
        <div className="wide" style={{borderTop:"1px solid #41463e",paddingTop:18,marginTop:6}}><strong style={{color:"#ef8a43"}}>INSCRIÇÃO ONLINE</strong><p className="muted">Para exibir o botão público, deixe o evento Publicado, o acesso Público e ative as inscrições.</p></div>
        <label className="check wide"><input type="checkbox" checked={form.registration_open} onChange={(e) => update("registration_open", e.target.checked)}/><span>Inscrições abertas neste evento</span></label>
        <label>Encerramento das inscrições<input type="datetime-local" value={form.registration_closes_at} onChange={(e) => update("registration_closes_at", e.target.value)}/></label>
        <label>Link da Windfit<input required={form.registration_open && !form.is_test} type="url" value={form.windfit_registration_url} onChange={(e) => update("windfit_registration_url", e.target.value)} placeholder={form.is_test ? "Não usado em testes manuais" : "https://..."}/></label>
        <>
          <div className="wide" style={{borderTop:"1px solid #41463e",paddingTop:18,marginTop:6}}><strong style={{color:"#ef8a43"}}>REFERÊNCIA COMERCIAL DA WINDFIT</strong><p className="muted">Os valores abaixo servem para conferência da organização. A venda e o pagamento acontecem exclusivamente na Windfit.</p></div>
          <label>Valor de referência (R$)<input min="0.01" step="0.01" type="number" value={form.registration_fee} onChange={(e) => update("registration_fee", e.target.value)} placeholder="999,00"/></label>
          <label>Valor Experience (R$)<input min="0.01" step="0.01" type="number" value={form.experience_fee} onChange={(e) => update("experience_fee", e.target.value)} placeholder="Opcional — usa o valor principal"/></label>
          <div className="wide" style={{borderTop:"1px solid #41463e",paddingTop:18,marginTop:6,display:"grid",gap:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
              <div><strong style={{color:"#ef8a43"}}>LOTES DE REFERÊNCIA</strong><p className="muted">Use os mesmos períodos e valores configurados na Windfit para facilitar a conferência.</p></div>
              <button type="button" className="secondary" onClick={addLot}>Adicionar lote</button>
            </div>
            {form.registration_lots.map((lot, index) => <div key={`${lot.name}-${index}`} style={{border:"1px solid #41463e",padding:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <label>Nome<input required value={lot.name} onChange={(e)=>updateLot(index,"name",e.target.value)}/></label>
              <label>Valor (R$)<input required min="0.01" step="0.01" type="number" value={lot.registration_fee} onChange={(e)=>updateLot(index,"registration_fee",e.target.value)}/></label>
              <label>Início<input required type="datetime-local" value={lot.starts_at} onChange={(e)=>updateLot(index,"starts_at",e.target.value)}/></label>
              <label>Fim<input required type="datetime-local" value={lot.ends_at} onChange={(e)=>updateLot(index,"ends_at",e.target.value)}/></label>
              <button type="button" className="secondary" style={{gridColumn:"1/-1"}} onClick={()=>removeLot(index)}>Remover lote</button>
            </div>)}
          </div>
          <div className="wide" style={{borderTop:"1px solid #41463e",paddingTop:18,marginTop:6}}><strong style={{color:"#ef8a43"}}>BENEFÍCIO 60+ E VESTUÁRIO</strong></div>
          <label className="check wide"><input type="checkbox" checked={form.senior_discount_enabled} onChange={(e)=>update("senior_discount_enabled",e.target.checked)}/><span>Aplicar desconto para atletas com 60 anos ou mais</span></label>
          {form.senior_discount_enabled && <label>Desconto sobre a inscrição (%)<input required min={50} max={100} type="number" value={form.senior_discount_percent} onChange={(e)=>update("senior_discount_percent",e.target.value)}/></label>}
          <label className="check wide"><input type="checkbox" checked={form.casual_shirt_required} onChange={(e)=>update("casual_shirt_required",e.target.checked)}/><span>Exigir tamanho da camiseta casual inclusa</span></label>
          <label className="check wide"><input type="checkbox" checked={form.premium_kit_enabled} onChange={(e)=>update("premium_kit_enabled",e.target.checked)}/><span>Oferecer Kit Premium como compra adicional</span></label>
          {form.premium_kit_enabled && <label>Valor do Kit Premium (R$)<input required min="0.01" step="0.01" type="number" value={form.premium_kit_fee} onChange={(e)=>update("premium_kit_fee",e.target.value)}/></label>}
        </>
        <label className="wide">Link do regulamento/termo<input type="url" value={form.terms_url} onChange={(e) => update("terms_url", e.target.value)} placeholder="Opcional"/></label>
        <label>Versão do regulamento<input value={form.regulation_version} onChange={(e)=>update("regulation_version",e.target.value)} placeholder="Ex.: 2027-v1"/></label>
        <label className="wide">Descrição<textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Objetivo, regras gerais e observações do evento."/></label>
        {drawer === "edit" && <section className="wide certificate-config">
          <h3>CERTIFICADO DO ATLETA</h3>
          <p className="muted">Carregue uma arte PNG horizontal, preferencialmente 3508 × 2480 px. Deixe livre a região central: o Passport preencherá nome, evento, categoria, tempo e colocação após a publicação oficial.</p>
          {!certificateReady && <div className="notice">Execute a migration 021_event_certificates.sql no Supabase para ativar este recurso.</div>}
          <label className="certificate-upload">Arte-base PNG<input type="file" accept="image/png,.png" disabled={certificateSaving || !certificateReady} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadCertificate(file); e.currentTarget.value = ""; }}/></label>
          {certificate.template_url && <img className="certificate-preview" src={certificate.template_url} alt="Prévia da arte-base do certificado"/>}
          <label>Cor dos dados variáveis<input type="color" value={certificate.text_color} disabled={!certificateReady} onChange={(e) => setCertificate((current) => ({ ...current, text_color: e.target.value }))}/></label>
          <label className="check"><input type="checkbox" checked={certificate.enabled} disabled={!certificateReady || !certificate.template_url} onChange={(e) => setCertificate((current) => ({ ...current, enabled: e.target.checked }))}/><span>Emitir certificado após o resultado oficial completo</span></label>
          <button type="button" className="certificate-save" disabled={certificateSaving || !certificateReady} onClick={() => void saveCertificate()}>{certificateSaving ? "SALVANDO..." : "SALVAR CONFIGURAÇÃO DO CERTIFICADO"}</button>
        </section>}
        <div className="wide muted">Ao criar, o sistema prepara automaticamente as etapas. Depois, envie um GPX diferente para cada uma em Percursos oficiais.</div>
        {message && drawer && <div className="wide notice">{message}</div>}
        <div className="wide drawer-actions"><button type="button" className="secondary" onClick={() => setDrawer(null)}>Cancelar</button><button className="primary" disabled={saving}>{saving ? "Salvando..." : "Salvar evento"}</button></div>
      </form>
      {drawer === "edit" && editing && <>
        <EventStagesEditor event={editing} onChanged={reloadEvents}/>
        {editing.is_test && <TestEventCleanup event={editing} onCleaned={reloadEvents}/>}
        {editing.is_test && <section className="delete-event-zone"><h3>EXCLUIR EVENTO</h3><p>Remove o evento, etapas, percursos, checkpoints, inscrições, atividades e resultados. Esta operação não pode ser desfeita.</p><button type="button" className="delete-event-button" disabled={deleting} onClick={() => void deleteTestEvent(editing)}>{deleting ? "EXCLUINDO..." : "EXCLUIR EVENTO DE TESTE"}</button></section>}
      </>}
    </aside></>}
  </main>;
}
