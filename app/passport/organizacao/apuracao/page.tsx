"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganizationEvent } from "../EventContext";

type Stage = {
  id: string;
  stage_number: number;
  name: string;
  results_published: boolean;
  results_locked: boolean;
  results_published_at: string | null;
};
type Result = {
  id: string;
  stage_id: string;
  full_name: string;
  bib_number: string | null;
  category: string;
  official_time_s: number;
  time_penalty_s: number;
  points_penalty: number;
  final_time_s: number;
  position: number | null;
  weighted_points: number;
  status: string;
  integrity_status: string;
  admin_note: string | null;
  activity?: {
    source: string;
    source_activity_id: string;
    track_fingerprint: string | null;
  } | null;
};
type Audit = {
  id: string;
  stage_id: string;
  result_id: string | null;
  action: string;
  note: string;
  created_at: string;
};
type Payload = {
  module_ready: boolean;
  message?: string;
  stages: Stage[];
  results: Result[];
  duplicate_groups: Array<{
    stage_id: string;
    results: Array<{
      id: string;
      full_name: string;
      bib_number: string | null;
    }>;
  }>;
  audit: Audit[];
  generated_at?: string;
  pipeline?: {
    registrations: number;
    eligible_registrations: number;
    linked_registrations: number;
    activities: number;
    unprocessed_activities: number;
    validations: number;
    validated: number;
    review: number;
    rejected: number;
    pending_validation: number;
    results: number;
    pending_decisions: number;
    published_stages: number;
    total_stages: number;
  };
  stage_pipeline?: Array<{
    stage_id: string;
    route_ready: boolean;
    activities: number;
    unprocessed: number;
    validated: number;
    review: number;
    rejected: number;
    pending_validation: number;
    results: number;
    pending_decisions: number;
    duplicates: number;
    published: boolean;
    locked: boolean;
  }>;
};
type SyncStatus = {
  module_ready: boolean;
  message?: string;
  connections?: { total: number; active: number; error: number };
  latest_run?: {
    status: string;
    activities_imported: number;
    activities_skipped: number;
    errors_count: number;
    started_at: string;
    finished_at: string | null;
  } | null;
};
function duration(value: number) {
  const total = Math.max(0, Math.round(Number(value)));
  return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function StewardingPage() {
  const { activeEventId, activeEvent } = useOrganizationEvent();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [stageId, setStageId] = useState("");
  const [selected, setSelected] = useState<Result | null>(null);
  const [status, setStatus] = useState("provisional");
  const [timePenalty, setTimePenalty] = useState(0);
  const [pointsPenalty, setPointsPenalty] = useState(0);
  const [acceptDuplicate, setAcceptDuplicate] = useState(false);
  const [note, setNote] = useState("");
  const [stageNote, setStageNote] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  async function load() {
    if (!activeEventId) {
      setPayload(null);
      return;
    }
    setRefreshing(true);
    try {
      const [response, syncResponse] = await Promise.all([
        fetch(`/api/admin/stewarding?eventId=${encodeURIComponent(activeEventId)}`, { cache: "no-store" }),
        fetch("/api/admin/activity-sync", { cache: "no-store" }),
      ]);
      const [data, syncData] = await Promise.all([response.json(), syncResponse.json()]);
      if (!response.ok)
        throw new Error(data.error ?? "Falha ao carregar apuração.");
      setPayload(data);
      if (syncResponse.ok) setSyncStatus(syncData);
      setStageId((current) =>
        data.stages?.some((stage: Stage) => stage.id === current)
          ? current
          : (data.stages?.[0]?.id ?? ""),
      );
    } finally {
      setRefreshing(false);
    }
  }
  async function synchronizeActivities() {
    setSyncing(true);
    setMessage("Buscando novas atividades no Ride with GPS...");
    try {
      const response = await fetch("/api/admin/activity-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxConnections: 20 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao sincronizar atividades.");
      setMessage(`${data.activities_imported} atividade(s) importada(s), ${data.activities_skipped} ignorada(s) e ${data.errors_count} erro(s).`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao sincronizar atividades.");
    } finally {
      setSyncing(false);
    }
  }
  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, [activeEventId]);
  useEffect(() => {
    if (!activeEventId) return;
    const timer = window.setInterval(() => {
      if (!selected && !saving) load().catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [activeEventId, selected, saving]);
  const stage = payload?.stages.find((item) => item.id === stageId) ?? null;
  const results = useMemo(
    () => (payload?.results ?? []).filter((item) => item.stage_id === stageId),
    [payload, stageId],
  );
  const audit = useMemo(
    () => (payload?.audit ?? []).filter((item) => item.stage_id === stageId),
    [payload, stageId],
  );
  const pipeline = payload?.pipeline;
  const attention = [
    syncStatus?.connections?.error
      ? { text: `${syncStatus.connections.error} conexão(ões) Ride with GPS precisam ser refeitas`, href: "/passport/organizacao/inscritos" }
      : null,
    syncStatus?.latest_run?.errors_count
      ? { text: `${syncStatus.latest_run.errors_count} falha(s) na última sincronização automática`, href: "#sincronizacao" }
      : null,
    pipeline?.unprocessed_activities
      ? { text: `${pipeline.unprocessed_activities} atividade(s) aguardando processamento`, href: "/passport/organizacao/validacao" }
      : null,
    pipeline?.pending_validation
      ? { text: `${pipeline.pending_validation} validação(ões) pendente(s)`, href: "/passport/organizacao/validacao" }
      : null,
    pipeline?.review
      ? { text: `${pipeline.review} atividade(s) na fila de revisão`, href: "/passport/organizacao/revisoes" }
      : null,
    pipeline?.pending_decisions
      ? { text: `${pipeline.pending_decisions} resultado(s) aguardando decisão`, href: "#resultados" }
      : null,
  ].filter(Boolean) as Array<{ text: string; href: string }>;
  function edit(result: Result) {
    setSelected(result);
    setStatus(result.status === "official" ? "provisional" : result.status);
    setTimePenalty(result.time_penalty_s);
    setPointsPenalty(result.points_penalty);
    setAcceptDuplicate(result.integrity_status === "reviewed");
    setNote(
      result.admin_note === "Resultado conferido e aprovado sem ressalvas."
        ? ""
        : (result.admin_note ?? ""),
    );
  }
  async function save() {
    if (!selected) return;
    setSaving(true);
    setMessage("Salvando decisão...");
    try {
      const response = await fetch("/api/admin/stewarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId: selected.id,
          status,
          timePenaltyS: timePenalty,
          pointsPenalty,
          acceptDuplicate,
          note,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Falha ao salvar decisão.");
      const recalc = await fetch("/api/admin/classification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: activeEventId }),
      });
      const recalcData = await recalc.json();
      if (!recalc.ok)
        throw new Error(
          recalcData.error ?? "Decisão salva, mas o recálculo falhou.",
        );
      setMessage("Decisão registrada e classificação recalculada.");
      setSelected(null);
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao salvar decisão.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function stageAction(action: "publish" | "reopen") {
    if (!stage) return;
    setSaving(true);
    setMessage(
      action === "publish"
        ? "Publicando resultados..."
        : "Reabrindo apuração...",
    );
    try {
      const response = await fetch("/api/admin/stewarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: stage.id, action, note: stageNote }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Falha ao atualizar etapa.");
      setStageNote("");
      setMessage(
        action === "publish"
          ? "Resultados publicados e etapa bloqueada."
          : "Apuração reaberta para ajustes.",
      );
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao atualizar etapa.",
      );
    } finally {
      setSaving(false);
    }
  }
  const requiresNote =
    status !== "provisional" ||
    timePenalty > 0 ||
    pointsPenalty > 0 ||
    (selected?.integrity_status === "duplicate" && acceptDuplicate);
  return (
    <main className="steward">
      <style>{`
    .steward{min-height:calc(100vh - 80px);background:#0d100d;color:#f2ede4;padding:44px 4vw 80px;font-family:Arial,sans-serif}.shell{max-width:1500px;margin:auto}.kicker{color:#d47b2d;letter-spacing:.2em;font-size:12px;font-weight:900;text-transform:uppercase}.head{display:flex;justify-content:space-between;align-items:end;gap:24px}.head h1{font-size:clamp(42px,6vw,78px);line-height:.9;text-transform:uppercase;margin:12px 0}.head p{max-width:620px;color:#aeb2aa;line-height:1.7}.updated{display:flex;align-items:center;justify-content:flex-end;gap:12px;color:#8e948b;font-size:12px;margin-top:16px}.updated button{padding:8px 12px}.toolbar{display:grid;grid-template-columns:1fr 1.1fr repeat(3,auto);gap:12px;margin:18px 0 28px}.toolbar select,.toolbar input,.panel input,.panel select,.panel textarea{padding:14px;background:#171a16;color:#f4eee5;border:1px solid #4b5048}.stage-state{padding:14px;border:1px solid #4b5048;font-weight:900}.published{color:#70c78d}.draft{color:#efaa69}.primary,.secondary,.danger{padding:14px 18px;border:0;font-weight:900;cursor:pointer}.primary{background:#e86619;color:white}.secondary{background:transparent;color:#eee;border:1px solid #66584c}.danger{background:#9c3d35;color:white}.message{padding:14px;border:1px solid #76502d;background:#281b10;color:#efaa69;margin:14px 0}.sync-note{padding:12px 14px;border:1px solid #393e36;color:#9ca198;font-size:12px;margin:14px 0}.sync-note strong{color:#70c78d}.flow{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#393e36;border:1px solid #393e36;margin:24px 0}.flow-card{background:#151914;color:#f2ede4;text-decoration:none;padding:20px;min-height:108px;display:flex;flex-direction:column;justify-content:space-between}.flow-card:hover{background:#1c211b}.flow-card small{color:#d47b2d;font-weight:900;letter-spacing:.12em}.flow-card strong{font-size:28px}.flow-card span{font-size:12px;color:#9ca198}.attention{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}.attention a{color:#efaa69;border:1px solid #76502d;background:#281b10;text-decoration:none;padding:11px 14px;font-size:12px;font-weight:800}.attention-ok{color:#70c78d;border:1px solid #31543b;padding:12px 14px;margin:14px 0}.stage-board{border:1px solid #393e36;margin:24px 0}.stage-board h2{padding:0 18px}.stage-row{display:grid;grid-template-columns:1.4fr repeat(6,minmax(90px,1fr));border-top:1px solid #343931}.stage-row>div{padding:13px 16px;border-right:1px solid #343931}.stage-row small{display:block;color:#858b82;text-transform:uppercase;font-size:9px;margin-bottom:5px}.stage-row strong{font-size:14px}.stage-row.active{background:#24190f}.ok{color:#70c78d}.warn{color:#efaa69}.bad{color:#ef7c67}.summary{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #393e36}.summary div{padding:18px;border-right:1px solid #393e36}.summary strong{display:block;font-size:26px}.summary span{color:#989d95;font-size:11px;text-transform:uppercase}.table-wrap{margin-top:18px;overflow:auto;border:1px solid #393e36}.table{width:100%;border-collapse:collapse;min-width:1240px;background:#171a16}.table th,.table td{padding:14px;border-bottom:1px solid #353a33;text-align:left}.table th{color:#d47b2d;font-size:11px;letter-spacing:.1em}.penalty strong,.penalty span{display:block}.penalty span{max-width:230px;color:#efaa69;font-size:12px;line-height:1.35;margin-top:5px}.flag{font-weight:900}.duplicate{color:#ef7c67}.reviewed{color:#70c78d}.clean{color:#9fa49c}.panel{position:fixed;top:0;right:0;height:100vh;width:min(520px,100%);z-index:2000;background:#151914;border-left:1px solid #5a5f55;padding:28px;box-sizing:border-box;overflow:auto}.panel label{display:block;margin:16px 0 7px;font-weight:800}.panel input,.panel select,.panel textarea{width:100%;box-sizing:border-box}.panel textarea{min-height:120px}.panel-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}.publish-box,.audit{margin-top:24px;border:1px solid #393e36;padding:20px}.publish-box input{width:100%;box-sizing:border-box;padding:13px;background:#171a16;color:#fff;border:1px solid #4b5048;margin:10px 0}.audit-row{padding:12px 0;border-top:1px solid #343931}.audit-row span{display:block;color:#949990;font-size:12px;margin-top:4px}@media(max-width:1050px){.flow{grid-template-columns:1fr 1fr}.stage-row{grid-template-columns:1.4fr repeat(3,1fr)}.stage-row>div:nth-child(n+5){display:none}}@media(max-width:850px){.head{display:block}.updated{align-items:stretch;flex-direction:column}.toolbar{grid-template-columns:1fr}.summary{grid-template-columns:1fr 1fr}.flow{grid-template-columns:1fr}.stage-board{overflow:auto}.stage-row{min-width:720px}}
  `}</style>
      <div className="shell">
        <section className="head">
          <div>
            <p className="kicker">Legends Core · Controle esportivo</p>
            <h1>Central de apuração</h1>
          </div>
          <p>
            <strong>{activeEvent?.name ?? "Selecione um evento"}</strong>
            <br />
            Acompanhe a operação da entrada da atividade até a publicação. Resolva
            pendências e bloqueie o resultado somente quando toda a etapa estiver pronta.
          </p>
        </section>
        <div className="updated">
          <span>
            {payload?.generated_at
              ? `Atualizado às ${new Date(payload.generated_at).toLocaleTimeString("pt-BR")}`
              : "Aguardando atualização"}
          </span>
          <button className="secondary" disabled={refreshing} onClick={() => load().catch((error) => setMessage(error.message))}>
            {refreshing ? "ATUALIZANDO..." : "ATUALIZAR AGORA"}
          </button>
          <button className="primary" disabled={syncing || syncStatus?.module_ready === false} onClick={synchronizeActivities}>
            {syncing ? "SINCRONIZANDO..." : "SINCRONIZAR RIDE WITH GPS"}
          </button>
        </div>
        {payload && !payload.module_ready ? (
          <div className="message">{payload.message}</div>
        ) : null}
        {syncStatus?.module_ready === false ? <div className="message">{syncStatus.message}</div> : null}
        {syncStatus?.module_ready ? (
          <div className="sync-note" id="sincronizacao">
            <strong>{syncStatus.connections?.active ?? 0} conexão(ões) automática(s) ativa(s).</strong>{" "}
            {syncStatus.latest_run
              ? `Última execução: ${new Date(syncStatus.latest_run.started_at).toLocaleString("pt-BR")} · ${syncStatus.latest_run.activities_imported} importada(s) · ${syncStatus.latest_run.errors_count} erro(s).`
              : "Nenhuma sincronização executada ainda."}
          </div>
        ) : null}
        <section className="flow" aria-label="Fluxo operacional da prova">
          <a className="flow-card" href="/passport/organizacao/inscritos">
            <small>01 · INSCRITOS</small><strong>{pipeline?.eligible_registrations ?? 0}</strong>
            <span>{pipeline?.linked_registrations ?? 0} com Passport vinculado</span>
          </a>
          <a className="flow-card" href="/passport/organizacao/validacao">
            <small>02 · ENTRADA</small><strong>{pipeline?.activities ?? 0}</strong>
            <span>{pipeline?.unprocessed_activities ?? 0} sem processamento</span>
          </a>
          <a className="flow-card" href="/passport/organizacao/revisoes">
            <small>03 · VALIDAÇÃO</small><strong>{pipeline?.validated ?? 0}</strong>
            <span>{pipeline?.review ?? 0} em revisão · {pipeline?.rejected ?? 0} rejeitadas</span>
          </a>
          <a className="flow-card" href="#resultados">
            <small>04 · APURAÇÃO</small><strong>{pipeline?.results ?? 0}</strong>
            <span>{pipeline?.pending_decisions ?? 0} decisões pendentes</span>
          </a>
          <a className="flow-card" href="#publicacao">
            <small>05 · PUBLICAÇÃO</small><strong>{pipeline?.published_stages ?? 0}/{pipeline?.total_stages ?? 0}</strong>
            <span>etapas publicadas e bloqueadas</span>
          </a>
        </section>
        {attention.length ? (
          <div className="attention">
            {attention.map((item) => <a key={item.text} href={item.href}>ATENÇÃO · {item.text}</a>)}
          </div>
        ) : payload ? <div className="attention-ok">✓ Nenhuma pendência operacional detectada.</div> : null}
        <section className="stage-board">
          <h2>Situação por etapa</h2>
          {(payload?.stages ?? []).map((item) => {
            const state = payload?.stage_pipeline?.find((value) => value.stage_id === item.id);
            return (
              <div className={`stage-row ${item.id === stageId ? "active" : ""}`} key={item.id} onClick={() => setStageId(item.id)}>
                <div><small>Etapa</small><strong>Stage {item.stage_number} · {item.name}</strong></div>
                <div><small>Rota</small><strong className={state?.route_ready ? "ok" : "bad"}>{state?.route_ready ? "PRONTA" : "AUSENTE"}</strong></div>
                <div><small>Atividades</small><strong>{state?.activities ?? 0}</strong></div>
                <div><small>Validadas</small><strong className="ok">{state?.validated ?? 0}</strong></div>
                <div><small>Revisão</small><strong className={state?.review ? "warn" : "ok"}>{state?.review ?? 0}</strong></div>
                <div><small>Decisões</small><strong className={state?.pending_decisions ? "warn" : "ok"}>{state?.pending_decisions ?? 0} pendentes</strong></div>
                <div><small>Publicação</small><strong className={state?.published ? "ok" : "warn"}>{state?.published ? "PUBLICADA" : "ABERTA"}</strong></div>
              </div>
            );
          })}
        </section>
        <div className="toolbar">
          <select
            value={stageId}
            onChange={(event) => setStageId(event.target.value)}
          >
            {payload?.stages.map((item) => (
              <option key={item.id} value={item.id}>
                Stage {item.stage_number} · {item.name}
              </option>
            ))}
          </select>
          <div
            className={`stage-state ${stage?.results_locked ? "published" : "draft"}`}
          >
            {stage?.results_locked
              ? "PUBLICADA E BLOQUEADA"
              : "APURAÇÃO ABERTA"}
          </div>
          <a
            className="secondary"
            href="/passport/organizacao/classificacao"
            style={{ textDecoration: "none", textAlign: "center" }}
          >
            VER CLASSIFICAÇÃO
          </a>
          <a
            className="secondary"
            href="/passport/organizacao/impressao"
            style={{ textDecoration: "none", textAlign: "center" }}
          >
            IMPRIMIR RESULTADOS
          </a>
          {activeEvent?.slug ? <a
            className="secondary"
            href={`/resultados/${activeEvent.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none", textAlign: "center" }}
          >
            RESULTADO AO VIVO ↗
          </a> : null}
        </div>
        {message ? <div className="message">{message}</div> : null}
        <section className="summary" id="resultados">
          <div>
            <strong>{results.length}</strong>
            <span>Resultados</span>
          </div>
          <div>
            <strong>
              {
                results.filter((item) => item.integrity_status === "duplicate")
                  .length
              }
            </strong>
            <span>Duplicidades pendentes</span>
          </div>
          <div>
            <strong>
              {results.filter((item) => item.status === "review").length}
            </strong>
            <span>Em revisão</span>
          </div>
          <div>
            <strong>
              {
                results.filter(
                  (item) =>
                    item.status === "disqualified" || item.status === "dnf",
                ).length
              }
            </strong>
            <span>DSQ / DNF</span>
          </div>
        </section>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Nº</th>
                <th>Atleta</th>
                <th>Categoria</th>
                <th>Tempo</th>
                <th>Penalidade</th>
                <th>Pontos</th>
                <th>Integridade</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td>{result.position ?? "—"}</td>
                  <td>{result.bib_number ?? "—"}</td>
                  <td>
                    <strong>{result.full_name}</strong>
                  </td>
                  <td>{result.category}</td>
                  <td>{duration(result.final_time_s)}</td>
                  <td className="penalty">
                    {result.time_penalty_s || result.points_penalty ? (
                      <>
                        <strong>
                          {[
                            result.time_penalty_s
                              ? `Tempo +${duration(result.time_penalty_s)}`
                              : "",
                            result.points_penalty
                              ? `${result.points_penalty} ponto(s)`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </strong>
                        <span>
                          Motivo: {result.admin_note || "Não informado"}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{result.weighted_points}</td>
                  <td className={`flag ${result.integrity_status}`}>
                    {result.integrity_status === "duplicate"
                      ? "DUPLICADO"
                      : result.integrity_status === "reviewed"
                        ? "REVISADO"
                        : "OK"}
                  </td>
                  <td>{result.status.toUpperCase()}</td>
                  <td>
                    <button
                      className="secondary"
                      disabled={Boolean(stage?.results_locked)}
                      onClick={() => edit(result)}
                    >
                      DECIDIR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="publish-box" id="publicacao">
          <h2>
            {stage?.results_locked ? "Etapa publicada" : "Publicação oficial"}
          </h2>
          <p>
            {stage?.results_locked
              ? "Os resultados estão bloqueados. Reabra somente se precisar corrigir uma decisão."
              : "Resultados em revisão ou duplicidades pendentes impedem a publicação."}
          </p>
          <input
            value={stageNote}
            onChange={(event) => setStageNote(event.target.value)}
            placeholder={
              stage?.results_locked
                ? "Motivo obrigatório para reabrir"
                : "Observação da publicação (opcional)"
            }
          />
          {stage?.results_locked ? (
            <button
              className="danger"
              disabled={saving}
              onClick={() => stageAction("reopen")}
            >
              REABRIR APURAÇÃO
            </button>
          ) : (
            <button
              className="primary"
              disabled={saving}
              onClick={() => stageAction("publish")}
            >
              PUBLICAR E BLOQUEAR ETAPA
            </button>
          )}
        </section>
        <section className="audit">
          <h2>Histórico de decisões</h2>
          {audit.length ? (
            audit.map((item) => (
              <div className="audit-row" key={item.id}>
                <strong>
                  {item.action === "adjust_result"
                    ? "Ajuste de resultado"
                    : item.action === "publish_stage"
                      ? "Publicação da etapa"
                      : "Reabertura da etapa"}
                </strong>
                <span>
                  {new Date(item.created_at).toLocaleString("pt-BR")} ·{" "}
                  {item.note}
                </span>
              </div>
            ))
          ) : (
            <p>Nenhuma decisão administrativa registrada.</p>
          )}
        </section>
      </div>
      {selected ? (
        <aside className="panel">
          <p className="kicker">Decisão esportiva</p>
          <h2>
            #{selected.bib_number ?? "—"} · {selected.full_name}
          </h2>
          <label>Decisão</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="provisional">Aprovado</option>
            <option value="review">Em revisão</option>
            <option value="dnf">DNF</option>
            <option value="disqualified">Desclassificado</option>
          </select>
          <label>Penalidade de tempo (segundos)</label>
          <input
            type="number"
            min="0"
            value={timePenalty}
            onChange={(event) => setTimePenalty(Number(event.target.value))}
          />
          <label>Penalidade de pontos</label>
          <input
            type="number"
            min="0"
            value={pointsPenalty}
            onChange={(event) => setPointsPenalty(Number(event.target.value))}
          />
          {selected.integrity_status !== "clean" ? (
            <label>
              <input
                type="checkbox"
                checked={acceptDuplicate}
                onChange={(event) => setAcceptDuplicate(event.target.checked)}
                style={{ width: "auto", marginRight: 8 }}
              />
              Duplicidade analisada e aceita pela organização
            </label>
          ) : null}
          <label>
            {requiresNote
              ? "Justificativa obrigatória"
              : "Observação (opcional)"}
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              requiresNote
                ? "Explique a revisão, penalidade ou exceção."
                : "Resultado normal: pode deixar em branco."
            }
          />
          <div className="panel-actions">
            <button className="secondary" onClick={() => setSelected(null)}>
              CANCELAR
            </button>
            <button className="primary" disabled={saving} onClick={save}>
              {status === "provisional" && !requiresNote
                ? "APROVAR E SALVAR"
                : "SALVAR DECISÃO"}
            </button>
          </div>
        </aside>
      ) : null}
    </main>
  );
}
