"use client";

import { FormEvent, useState } from "react";
import type { OrganizationEvent, OrganizationStage } from "../EventContext";

type StageForm = { name: string; route_label: string; stage_date: string; classification_weight: number; time_limit_hours: string };

function nextDate(event: OrganizationEvent) {
  const value = new Date(`${event.starts_on}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + (event.stages?.length ?? 0));
  return value.toISOString().slice(0, 10);
}

function newStage(event: OrganizationEvent): StageForm {
  const number = (event.stages?.length ?? 0) + 1;
  return { name: `Dia ${number}`, route_label: `Percurso ${number}`, stage_date: nextDate(event), classification_weight: 1, time_limit_hours: "" };
}

function fromStage(stage: OrganizationStage): StageForm {
  return { name: stage.name, route_label: stage.route_label ?? "", stage_date: stage.stage_date, classification_weight: Number(stage.classification_weight ?? 1), time_limit_hours: stage.time_limit_s ? String(Number((stage.time_limit_s / 3600).toFixed(2))) : "" };
}

export default function EventStagesEditor({ event, onChanged }: { event: OrganizationEvent; onChanged: (eventId: string) => Promise<void> }) {
  const [mode, setMode] = useState<"closed" | "new" | "edit">("closed");
  const [stageId, setStageId] = useState("");
  const [form, setForm] = useState<StageForm>(() => newStage(event));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function openNew() { setStageId(""); setForm(newStage(event)); setMessage(""); setMode("new"); }
  function openEdit(stage: OrganizationStage) { setStageId(stage.id); setForm(fromStage(stage)); setMessage(""); setMode("edit"); }
  function update<K extends keyof StageForm>(field: K, value: StageForm[K]) { setForm((current) => ({ ...current, [field]: value })); }

  async function save(submitEvent: FormEvent) {
    submitEvent.preventDefault(); setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/events/stages", { method: mode === "edit" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, event_id: event.id, stage_id: stageId || undefined }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível salvar a etapa.");
      await onChanged(event.id); setMode("closed"); setMessage(mode === "edit" ? "Etapa atualizada." : "Nova etapa adicionada.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar a etapa."); }
    finally { setSaving(false); }
  }

  return <section className="stage-editor wide">
    <div className="stage-title"><div><strong>Etapas e percursos</strong><small>Organize cada dia do evento antes de enviar os arquivos GPX.</small></div><button type="button" onClick={openNew}>+ Adicionar etapa</button></div>
    <div className="stage-list">{(event.stages ?? []).map((stage) => <button type="button" key={stage.id} onClick={() => openEdit(stage)}><b>Etapa {stage.stage_number}</b><span>{stage.name}</span><small>{new Date(`${stage.stage_date}T12:00:00`).toLocaleDateString("pt-BR")} · peso {Number(stage.classification_weight).toFixed(2).replace(".", ",")} · {stage.time_limit_s ? `${stage.time_limit_s / 3600} h` : "sem limite"}</small></button>)}</div>
    {mode !== "closed" && <form className="stage-form" onSubmit={save}>
      <div className="stage-form-head"><strong>{mode === "new" ? "Nova etapa" : "Editar etapa"}</strong><button type="button" onClick={() => setMode("closed")}>×</button></div>
      <label>Nome<input required value={form.name} onChange={(e) => update("name", e.target.value)}/></label>
      <label>Identificação do percurso<input value={form.route_label} onChange={(e) => update("route_label", e.target.value)} placeholder="Ex.: Porto Alegre → Gramado"/></label>
      <label>Data<input required type="date" value={form.stage_date} onChange={(e) => update("stage_date", e.target.value)}/></label>
      <label>Peso na classificação<input required min={.1} max={5} step={.05} type="number" value={form.classification_weight} onChange={(e) => update("classification_weight", Number(e.target.value))}/></label>
      <label>Tempo-limite em horas<input min={.25} step={.25} type="number" value={form.time_limit_hours} onChange={(e) => update("time_limit_hours", e.target.value)} placeholder="Sem limite"/></label>
      <button className="save-stage" disabled={saving}>{saving ? "Salvando..." : "Salvar etapa"}</button>
    </form>}
    {message && <p className="stage-message">{message}</p>}
    <style>{`
      .stage-editor{border-top:1px solid #41463e;padding-top:22px;margin-top:8px}.stage-title{display:flex;align-items:center;justify-content:space-between;gap:14px}.stage-title strong,.stage-title small{display:block}.stage-title small{color:#999;font-weight:400;margin-top:5px}.stage-title button{padding:10px 12px;border:1px solid #d76d20;background:transparent;color:#ef8a43;font-weight:900;cursor:pointer}.stage-list{display:grid;gap:8px;margin-top:15px}.stage-list>button{display:grid;grid-template-columns:90px 1fr auto;align-items:center;gap:10px;padding:13px;border:1px solid #454a42;background:#0f120f;color:#eee;text-align:left;cursor:pointer}.stage-list small{color:#999}.stage-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:15px;padding:18px;border:1px solid #6d4728;background:#21170f}.stage-form-head{grid-column:1/-1;display:flex;justify-content:space-between}.stage-form-head button{background:transparent;border:0;color:white;font-size:22px}.stage-form label{display:grid;gap:6px}.stage-form input{padding:11px;background:#0d100d;border:1px solid #4b5047;color:white}.save-stage{grid-column:1/-1;padding:13px;background:#e86619;border:0;color:white;font-weight:900}.stage-message{color:#efb078}@media(max-width:600px){.stage-title{display:grid}.stage-list>button{grid-template-columns:1fr}.stage-form{grid-template-columns:1fr}.stage-form-head,.save-stage{grid-column:auto}}
    `}</style>
  </section>;
}
