"use client";

import { useState } from "react";
import { OrganizationEvent } from "../EventContext";

type CleanupPreview = {
  event_id: string;
  event_name: string;
  required_confirmation: string;
  removed: Record<string, number>;
  preserved: Record<string, number>;
};

const removedLabels: Record<string, string> = {
  registrations: "Inscrições",
  linked_registrations: "Vínculos com atletas",
  activities: "Atividades",
  validation_results: "Validações",
  checkpoint_passages: "Passagens em checkpoints",
  segment_results: "Resultados de segmentos",
  stage_results: "Resultados de etapas",
  decision_history: "Decisões da apuração",
  identity_history: "Histórico de vínculos",
};

const preservedLabels: Record<string, string> = {
  events: "Evento",
  stages: "Etapas",
  routes: "Versões de GPX",
  checkpoints: "Checkpoints",
  timed_segments: "Segmentos cronometrados",
  bib_sequences: "Faixas de numeração",
  athlete_accounts: "Contas de atletas",
};

export default function TestEventCleanup({ event, onCleaned }: { event: OrganizationEvent; onCleaned: (eventId: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<CleanupPreview | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function prepare() {
    setOpen(true); setLoading(true); setError(""); setSuccess(""); setConfirmation(""); setPreview(null);
    try {
      const response = await fetch(`/api/admin/events/cleanup?eventId=${encodeURIComponent(event.id)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível calcular a prévia da limpeza.");
      setPreview(payload.preview);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível calcular a prévia da limpeza.");
    } finally { setLoading(false); }
  }

  async function clean() {
    if (!preview || confirmation !== preview.required_confirmation) return;
    setExecuting(true); setError("");
    try {
      const response = await fetch("/api/admin/events/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.id, confirmation }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível limpar os dados de teste.");
      await onCleaned(event.id);
      setOpen(false); setPreview(null); setConfirmation("");
      setSuccess("Dados de teste removidos. O evento foi preservado, voltou para rascunho e as inscrições foram fechadas.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível limpar os dados de teste.");
    } finally { setExecuting(false); }
  }

  return <section className="test-cleanup-zone">
    <style>{`
      .test-cleanup-zone{margin-top:30px;border:1px solid #713429;background:#211411;padding:22px}.test-cleanup-zone h3{margin:0 0 8px;color:#ff8b63;font-size:17px;letter-spacing:.1em}.test-cleanup-zone p{color:#c8b7af;line-height:1.5}.cleanup-trigger{width:100%;padding:15px;border:1px solid #d04d32;background:transparent;color:#ff8b63;font-weight:900;cursor:pointer}.cleanup-success{margin-top:14px;border:1px solid #456649;background:#142318;color:#8fd09a;padding:13px}.cleanup-modal-backdrop{position:fixed;inset:0;background:#000d;z-index:2200;display:grid;place-items:center;padding:20px}.cleanup-modal{width:min(760px,100%);max-height:92vh;overflow:auto;background:#171a16;border:1px solid #773b2c;color:#f3eee5;padding:28px;box-shadow:0 30px 90px #000}.cleanup-modal-head{display:flex;align-items:start;justify-content:space-between;gap:20px}.cleanup-modal h2{font-size:31px;font-weight:400;margin:6px 0 8px}.cleanup-close{border:0;background:transparent;color:#fff;font-size:28px;cursor:pointer}.cleanup-warning{border:1px solid #86402e;background:#2c1712;color:#ffb28e;padding:14px;line-height:1.5}.cleanup-columns{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:18px 0}.cleanup-list{border:1px solid #41463e;padding:16px}.cleanup-list h3{margin:0 0 12px;font-size:13px;letter-spacing:.12em}.cleanup-list.remove h3{color:#ff8b63}.cleanup-list.keep h3{color:#7fc98d}.cleanup-row{display:flex;justify-content:space-between;gap:16px;border-top:1px solid #30352f;padding:9px 0;color:#bbb}.cleanup-row strong{color:#fff}.cleanup-confirm{display:grid;gap:8px;font-size:12px;font-weight:800}.cleanup-confirm code{color:#ff9c69;font-size:13px}.cleanup-confirm input{padding:14px;background:#0d100d;border:1px solid #62534c;color:#fff;font:inherit}.cleanup-actions{display:flex;gap:12px;margin-top:20px}.cleanup-actions button{flex:1;padding:15px;font-weight:900;cursor:pointer}.cleanup-cancel{background:transparent;color:#eee;border:1px solid #555}.cleanup-execute{background:#d94d2d;color:#fff;border:1px solid #d94d2d}.cleanup-execute:disabled{opacity:.35;cursor:not-allowed}.cleanup-error{border:1px solid #85402d;color:#ffad88;padding:13px;margin:14px 0}@media(max-width:650px){.cleanup-columns{grid-template-columns:1fr}.cleanup-actions{display:grid}.cleanup-modal{padding:20px}}
    `}</style>
    <h3>ZONA DE TESTES</h3>
    <p>Reinicie este evento sem perder etapas, percursos, checkpoints, regras ou configuração de numeração.</p>
    <button type="button" className="cleanup-trigger" onClick={prepare}>LIMPAR DADOS DE TESTE</button>
    {success && <div className="cleanup-success">{success}</div>}

    {open && <div className="cleanup-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cleanup-title">
      <div className="cleanup-modal">
        <div className="cleanup-modal-head"><div><div style={{color:"#dd7728",fontSize:11,fontWeight:900,letterSpacing:".18em"}}>OPERAÇÃO PROTEGIDA</div><h2 id="cleanup-title">Limpar {event.name}</h2></div><button className="cleanup-close" onClick={() => !executing && setOpen(false)} aria-label="Fechar">×</button></div>
        <div className="cleanup-warning">Esta ação é permanente. Antes da remoção, o evento será fechado para novas inscrições e voltará ao estado de rascunho. Contas Ride with GPS e dados de outros eventos não serão afetados.</div>
        {loading && <p>Calculando exatamente o que será removido...</p>}
        {error && <div className="cleanup-error">{error}</div>}
        {preview && <>
          <div className="cleanup-columns">
            <div className="cleanup-list remove"><h3>SERÁ REMOVIDO</h3>{Object.entries(preview.removed).map(([key, value]) => <div className="cleanup-row" key={key}><span>{removedLabels[key] ?? key}</span><strong>{value}</strong></div>)}</div>
            <div className="cleanup-list keep"><h3>SERÁ PRESERVADO</h3>{Object.entries(preview.preserved).map(([key, value]) => <div className="cleanup-row" key={key}><span>{preservedLabels[key] ?? key}</span><strong>{value}</strong></div>)}</div>
          </div>
          <label className="cleanup-confirm">Para confirmar, digite exatamente <code>{preview.required_confirmation}</code><input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" spellCheck={false}/></label>
          <div className="cleanup-actions"><button type="button" className="cleanup-cancel" disabled={executing} onClick={() => setOpen(false)}>Cancelar</button><button type="button" className="cleanup-execute" disabled={executing || confirmation !== preview.required_confirmation} onClick={clean}>{executing ? "Limpando com segurança..." : "Confirmar limpeza permanente"}</button></div>
        </>}
      </div>
    </div>}
  </section>;
}
