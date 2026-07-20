"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type EventRow = { id: string; name: string; status: string; starts_on: string | null; ends_on: string | null };
type Registration = {
  id: string; event_id: string; athlete_id: string | null; registration_code: string; bib_number: string | null;
  full_name: string; email: string; birth_date: string | null; gender: string | null; category: string | null;
  modality: string; country_code: string | null; city: string | null; status: string; claimed_at: string | null;
  source: "windfit" | "manual"; external_registration_id: string | null; payment_status: string;
  imported_at: string | null; last_synced_at: string | null; athlete?: { ride_with_gps_user_id?: number } | null;
};
type Summary = { total: number; eligible: number; paid: number; payment_pending: number; refunded: number; cancelled: number; linked: number; last_sync: string | null };
type FormState = {
  event_id: string; registration_code: string; bib_number: string; full_name: string; email: string;
  birth_date: string; gender: string; category: string; modality: string; country_code: string; city: string;
  status: string; payment_status: string; external_registration_id: string;
};

const categories = ["Masculino Open 18–35", "Masculino Master 36–49", "Masculino Sênior 50+", "Feminino 18–40", "Feminino 41+", "Feminino única", "Experience"];
const emptyForm: FormState = { event_id: "", registration_code: "", bib_number: "", full_name: "", email: "", birth_date: "", gender: "", category: "", modality: "gravel_race", country_code: "BR", city: "", status: "confirmed", payment_status: "courtesy", external_registration_id: "" };

function csvLine(line: string, separator: string) {
  const cells: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') { if (quoted && line[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted; }
    else if (char === separator && !quoted) { cells.push(value.trim()); value = ""; } else value += char;
  }
  cells.push(value.trim()); return cells;
}
function normalizeHeader(value: string) { return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_"); }
function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("O CSV da Windfit precisa ter cabeçalho e ao menos um atleta.");
  const separator = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const headers = csvLine(lines[0], separator).map(normalizeHeader);
  const aliases: Record<string, string[]> = {
    full_name: ["nome", "nome_completo", "atleta", "participante", "full_name"], email: ["email", "e_mail", "email_do_atleta"],
    bib_number: ["numero", "numero_atleta", "numero_do_atleta", "bib", "bib_number"], birth_date: ["nascimento", "data_nascimento", "data_de_nascimento", "birth_date"],
    gender: ["sexo", "genero", "gender"], category: ["categoria", "category"], modality: ["modalidade", "produto", "prova", "modality"],
    country_code: ["pais", "country", "country_code"], city: ["cidade", "city"], status: ["status", "situacao", "situacao_inscricao"],
    registration_code: ["codigo", "codigo_inscricao", "codigo_de_inscricao", "registration_code"],
    external_registration_id: ["id", "id_inscricao", "id_da_inscricao", "inscricao_id", "pedido", "numero_pedido"],
    payment_status: ["pagamento", "status_pagamento", "situacao_pagamento", "payment_status", "financeiro"],
  };
  const indexOf = (field: string) => headers.findIndex((header) => aliases[field].includes(header));
  return lines.slice(1).map((line) => {
    const values = csvLine(line, separator); const read = (field: string) => { const index = indexOf(field); return index >= 0 ? values[index] ?? "" : ""; };
    const modalityText = read("modality").toLowerCase();
    return { full_name: read("full_name"), email: read("email").toLowerCase(), bib_number: read("bib_number") || null, birth_date: read("birth_date") || null,
      gender: read("gender") || null, category: read("category") || null, modality: modalityText.includes("experience") || modalityText.includes("turismo") ? "experience" : "gravel_race",
      country_code: read("country_code") || "BR", city: read("city") || null, status: read("status") || "confirmed", registration_code: read("registration_code") || undefined,
      external_registration_id: read("external_registration_id") || null, payment_status: read("payment_status") || undefined };
  }).filter((row) => row.full_name && row.email);
}
function formatDateTime(value?: string | null) { return value ? new Date(value).toLocaleString("pt-BR") : "—"; }
function paymentLabel(value: string) { return value === "paid" ? "Pago" : value === "pending" ? "Pendente" : value === "refunded" ? "Reembolsado" : value === "cancelled" ? "Cancelado" : "Cortesia"; }

export default function RegistrationsPage() {
  const [events, setEvents] = useState<EventRow[]>([]); const [items, setItems] = useState<Registration[]>([]); const [summary, setSummary] = useState<Summary | null>(null);
  const [eventId, setEventId] = useState(""); const [search, setSearch] = useState(""); const [statusFilter, setStatusFilter] = useState("all"); const [paymentFilter, setPaymentFilter] = useState("all");
  const [editingId, setEditingId] = useState(""); const [form, setForm] = useState<FormState>(emptyForm); const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false);
  const [moduleReady, setModuleReady] = useState(true); const [windfitReady, setWindfitReady] = useState(true);

  async function load(preferredEvent?: string) {
    const selected = preferredEvent ?? eventId;
    const response = await fetch(`/api/admin/registrations${selected ? `?eventId=${encodeURIComponent(selected)}` : ""}`, { cache: "no-store" });
    const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Falha ao carregar inscritos Windfit.");
    setModuleReady(payload.module_ready !== false); setWindfitReady(payload.windfit_ready !== false); setEvents(payload.events ?? []);
    const nextEvent = selected || payload.events?.[0]?.id || ""; if (!selected && nextEvent) setEventId(nextEvent);
    setItems(payload.registrations ?? []); setSummary(payload.summary ?? null); setForm((current) => ({ ...current, event_id: current.event_id || nextEvent })); if (payload.message) setMessage(payload.message);
  }
  useEffect(() => { load().catch((error) => setMessage(error.message)); }, []);
  useEffect(() => { if (eventId) load(eventId).catch((error) => setMessage(error.message)); }, [eventId]);

  const filtered = useMemo(() => items.filter((item) => {
    const term = search.trim().toLowerCase();
    const matches = !term || [item.full_name, item.email, item.bib_number, item.registration_code, item.external_registration_id].some((value) => String(value ?? "").toLowerCase().includes(term));
    return matches && (statusFilter === "all" || item.status === statusFilter) && (paymentFilter === "all" || item.payment_status === paymentFilter);
  }), [items, search, statusFilter, paymentFilter]);

  function startNew() { setEditingId(""); setForm({ ...emptyForm, event_id: eventId }); }
  function edit(item: Registration) {
    setEditingId(item.id); setForm({ event_id: item.event_id, registration_code: item.registration_code, bib_number: item.bib_number ?? "", full_name: item.full_name, email: item.email,
      birth_date: item.birth_date ?? "", gender: item.gender ?? "", category: item.category ?? "", modality: item.modality, country_code: item.country_code ?? "", city: item.city ?? "",
      status: item.status, payment_status: item.payment_status, external_registration_id: item.external_registration_id ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage(editingId ? "Atualizando registro..." : "Criando exceção manual...");
    try {
      const response = await fetch("/api/admin/registrations", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingId ? { id: editingId, registration: form } : { registration: form }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Falha ao salvar registro.");
      setMessage(editingId ? "Registro atualizado." : `Exceção manual criada. Código: ${payload.registration.registration_code}`); startNew(); await load(eventId);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao salvar registro."); } finally { setSaving(false); }
  }
  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !eventId) return;
    setSaving(true); setMessage("Sincronizando lista exportada da Windfit...");
    try {
      const rows = parseCsv(await file.text()); if (!rows.length) throw new Error("Nenhum atleta válido foi encontrado no arquivo.");
      const response = await fetch("/api/admin/registrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import_windfit", eventId, rows }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Falha na sincronização.");
      setMessage(`${payload.imported} registros Windfit importados ou atualizados.`); await load(eventId);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha na sincronização."); } finally { setSaving(false); event.target.value = ""; }
  }

  return <main className="registrations-page"><style>{`
    .registrations-page{min-height:calc(100vh - 72px);overflow-x:hidden;background:#0d100d;color:#f2eee5;padding:42px 3vw 80px;font-family:Arial,sans-serif;box-sizing:border-box}.shell{width:min(1480px,100%);margin:auto;min-width:0}.kicker{color:#d47b2d;letter-spacing:.2em;text-transform:uppercase;font-size:12px;font-weight:900}.head{display:flex;align-items:end;justify-content:space-between;gap:25px}.head h1{font-size:clamp(42px,5vw,70px);line-height:.9;text-transform:uppercase;margin:13px 0}.head p{color:#aeb3ab;max-width:720px;line-height:1.7}.sync{margin-top:16px;color:#efb078;font-size:13px}.metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border:1px solid #3c4138;margin:28px 0}.metric{padding:17px;border-right:1px solid #3c4138;min-width:0}.metric:last-child{border:0}.metric strong{display:block;font-size:28px}.metric span{font-size:11px;color:#9fa49c;text-transform:uppercase}.workspace{display:grid;grid-template-columns:minmax(320px,420px) minmax(0,1fr);gap:20px;align-items:start}.panel{min-width:0;border:1px solid #373c35;background:#151815;padding:24px;box-sizing:border-box}.panel.light{background:#eee5d8;color:#171917;min-height:0}.panel h2{margin:0 0 12px;text-transform:uppercase}.panel-intro{color:#9fa49c;font-size:13px;line-height:1.55}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{display:grid;gap:6px;min-width:0}.field.wide{grid-column:1/-1}.field label{font-size:12px;font-weight:800}.field input,.field select{width:100%;min-width:0;box-sizing:border-box;padding:12px;background:#0d100d;color:#fff;border:1px solid #50564c}.primary{width:100%;margin-top:16px;padding:14px;border:0;background:#e86619;color:#fff;font-weight:900;cursor:pointer}.secondary{width:100%;margin-top:10px;padding:12px;border:1px solid #555b51;background:transparent;color:#ddd8cf;font-weight:800;cursor:pointer}.import{margin-top:20px;padding-top:18px;border-top:1px solid #3c4138}.import input{width:100%;box-sizing:border-box;padding:12px;border:1px dashed #d47b2d;color:#ddd8cf}.filters{display:grid;grid-template-columns:minmax(220px,1.3fr) minmax(150px,.8fr) minmax(150px,.8fr);gap:10px;margin-bottom:15px}.filters input,.filters select{width:100%;min-width:0;box-sizing:border-box;padding:12px;border:1px solid #bcae9d;background:#fffaf2}.table-wrap{max-width:100%;overflow:auto}.table{width:100%;border-collapse:collapse;min-width:1040px}.table th{text-align:left;color:#b65c17;font-size:11px;letter-spacing:.1em;padding:12px;border-bottom:1px solid #c6b9a9}.table td{padding:13px 12px;border-bottom:1px solid #d3c8b9;font-size:13px}.table strong,.table span{display:block}.table span{color:#6a6e67;margin-top:4px}.empty-state{display:grid;place-items:center;min-height:260px;padding:34px;text-align:center;border:1px dashed #c4b7a6;background:#f8f1e7}.empty-state strong{display:block;font-size:24px;margin-bottom:10px}.empty-state p{max-width:520px;color:#686c66;line-height:1.6;margin:0}.edit{border:0;background:#171917;color:#fff;padding:9px 12px;cursor:pointer}.linked{color:#28734a!important;font-weight:800}.unlinked{color:#a45e24!important}.message{margin:16px 0;color:#efb078}.not-ready{padding:22px;border:1px solid #9c5a22;background:#261b10}.code{font-family:monospace;font-weight:800}.paid{color:#28734a;font-weight:800}.pending{color:#a45e24;font-weight:800}.refunded,.cancelled{color:#a23d35;font-weight:800}.source{font-size:11px;text-transform:uppercase;font-weight:900}.windfit{color:#255f87}.manual{color:#7b5b2a}
    @media(max-width:1180px){.workspace{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.panel.light{order:-1}}@media(max-width:700px){.registrations-page{padding:28px 14px 60px}.head{display:block}.metrics{grid-template-columns:1fr 1fr}.form-grid,.filters{grid-template-columns:1fr}.field.wide{grid-column:auto}.panel{padding:18px}.table{min-width:900px}}
  `}</style><div className="shell">
    <section className="head"><div><p className="kicker">Windfit → Legends Core</p><h1>Inscritos Windfit</h1></div><div><p>A Windfit permanece responsável por inscrição e pagamento. Esta área funciona como espelho operacional para elegibilidade, categoria, número e vínculo com o Ride with GPS.</p><div className="sync">Última sincronização: <strong>{formatDateTime(summary?.last_sync)}</strong></div></div></section>
    {!moduleReady?<div className="not-ready">Execute a migration 006_registrations_eligibility.sql no Supabase.</div>:null}
    {moduleReady&&!windfitReady?<div className="not-ready">Execute a migration 007_windfit_source.sql para ativar pagamento e sincronização Windfit.</div>:null}
    <section className="metrics">{[[summary?.total,"registros"],[summary?.eligible,"elegíveis"],[summary?.paid,"pagos"],[summary?.linked,"Ride with GPS vinculado"],[summary?.payment_pending,"pagamento pendente"],[summary?.refunded,"reembolsados"]].map(([value,label])=><div className="metric" key={String(label)}><strong>{value??"—"}</strong><span>{label}</span></div>)}</section>
    {message?<p className="message">{message}</p>:null}
    <section className="workspace">
      <form className="panel" onSubmit={save}><h2>{editingId?"Editar registro":"Exceção manual"}</h2><p className="panel-intro">Use o cadastro manual somente para cortesia, convidado ou correção administrativa. Inscrições comerciais devem entrar pela importação Windfit.</p><div className="form-grid">
        <div className="field wide"><label>Evento</label><select value={form.event_id} onChange={(e)=>setForm({...form,event_id:e.target.value})}>{events.map((row)=><option key={row.id} value={row.id}>{row.name}</option>)}</select></div>
        <div className="field wide"><label>Nome completo</label><input required value={form.full_name} onChange={(e)=>setForm({...form,full_name:e.target.value})}/></div><div className="field wide"><label>E-mail da inscrição</label><input required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></div>
        <div className="field"><label>Número do atleta</label><input value={form.bib_number} onChange={(e)=>setForm({...form,bib_number:e.target.value})}/></div><div className="field"><label>ID Windfit</label><input value={form.external_registration_id} onChange={(e)=>setForm({...form,external_registration_id:e.target.value})}/></div>
        <div className="field"><label>Código de vínculo</label><input placeholder="Gerado automaticamente" value={form.registration_code} onChange={(e)=>setForm({...form,registration_code:e.target.value})}/></div><div className="field"><label>Nascimento</label><input type="date" value={form.birth_date} onChange={(e)=>setForm({...form,birth_date:e.target.value})}/></div>
        <div className="field"><label>Gênero</label><select value={form.gender} onChange={(e)=>setForm({...form,gender:e.target.value})}><option value="">Não informado</option><option value="male">Masculino</option><option value="female">Feminino</option><option value="other">Outro</option></select></div>
        <div className="field wide"><label>Categoria</label><select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}><option value="">Selecione</option>{categories.map((value)=><option key={value}>{value}</option>)}</select></div>
        <div className="field"><label>Modalidade</label><select value={form.modality} onChange={(e)=>setForm({...form,modality:e.target.value})}><option value="gravel_race">Legends Gravel Race</option><option value="experience">Legends Experience</option></select></div>
        <div className="field"><label>Pagamento</label><select value={form.payment_status} onChange={(e)=>setForm({...form,payment_status:e.target.value})}><option value="courtesy">Cortesia</option><option value="paid">Pago</option><option value="pending">Pendente</option><option value="refunded">Reembolsado</option><option value="cancelled">Cancelado</option></select></div>
        <div className="field"><label>Status esportivo</label><select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}><option value="confirmed">Confirmada</option><option value="pending">Pendente</option><option value="waitlist">Lista de espera</option><option value="cancelled">Cancelada</option></select></div>
        <div className="field"><label>País</label><input maxLength={2} value={form.country_code} onChange={(e)=>setForm({...form,country_code:e.target.value.toUpperCase()})}/></div><div className="field"><label>Cidade</label><input value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/></div>
      </div><button className="primary" disabled={saving}>{saving?"SALVANDO...":editingId?"ATUALIZAR REGISTRO":"CRIAR EXCEÇÃO MANUAL"}</button>{editingId?<button className="secondary" type="button" onClick={startNew}>CANCELAR EDIÇÃO</button>:null}
      <div className="import"><strong>Importar lista da Windfit</strong><p className="panel-intro">Exporte o CSV na Windfit e envie aqui. A sincronização atualiza o mesmo atleta pelo e-mail e não processa pagamentos no Legends.</p><p className="panel-intro">Campos reconhecidos: nome, email, número, categoria, modalidade, status, pagamento, ID da inscrição, país e cidade.</p><input type="file" accept=".csv,text/csv" onChange={importCsv}/></div></form>
      <section className="panel light"><div className="filters"><input placeholder="Buscar nome, e-mail, número, código ou ID Windfit" value={search} onChange={(e)=>setSearch(e.target.value)}/><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}><option value="all">Todos os status</option><option value="confirmed">Confirmados</option><option value="pending">Pendentes</option><option value="waitlist">Lista de espera</option><option value="cancelled">Cancelados</option></select><select value={paymentFilter} onChange={(e)=>setPaymentFilter(e.target.value)}><option value="all">Todos os pagamentos</option><option value="paid">Pagos</option><option value="pending">Pendentes</option><option value="refunded">Reembolsados</option><option value="cancelled">Cancelados</option><option value="courtesy">Cortesias</option></select></div>
      {filtered.length?<div className="table-wrap"><table className="table"><thead><tr><th>Nº</th><th>Atleta</th><th>Categoria</th><th>Pagamento</th><th>Origem</th><th>Código</th><th>Vínculo</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map((item)=><tr key={item.id}><td>{item.bib_number??"—"}</td><td><strong>{item.full_name}</strong><span>{item.email}</span>{item.external_registration_id?<span>ID Windfit: {item.external_registration_id}</span>:null}</td><td>{item.category??"—"}<span>{item.modality==="experience"?"Experience":"Gravel Race"}</span></td><td><span className={item.payment_status}>{paymentLabel(item.payment_status)}</span></td><td><span className={`source ${item.source}`}>{item.source==="windfit"?"Windfit":"Manual"}</span><span>{formatDateTime(item.last_synced_at)}</span></td><td className="code">{item.registration_code}</td><td><span className={item.athlete_id?"linked":"unlinked"}>{item.athlete_id?`✓ Ride with GPS ${item.athlete?.ride_with_gps_user_id??""}`:"Aguardando vínculo"}</span></td><td>{item.status}</td><td><button className="edit" onClick={()=>edit(item)}>EDITAR</button></td></tr>)}</tbody></table></div>:<div className="empty-state"><div><strong>Nenhum inscrito sincronizado</strong><p>Exporte a lista de participantes na Windfit e use o campo “Importar lista da Windfit”. Os atletas aparecerão aqui com pagamento, categoria, elegibilidade e vínculo com o Ride with GPS.</p></div></div>}
      </section>
    </section>
  </div></main>;
}
