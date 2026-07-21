"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { EditorCheckpoint, EditorPoint } from "./CheckpointEditorMap";
import { useOrganizationEvent } from "../EventContext";

const CheckpointEditorMap = dynamic(() => import("./CheckpointEditorMap"), {
  ssr: false,
});

type Stage = {
  id: string;
  name: string;
  route_label: string | null;
  stage_date: string;
};
type StoredCheckpoint = EditorCheckpoint & {
  id?: string;
  checkpoint_kind?: string;
  is_timing_point?: boolean;
};
type Segment = {
  id: string;
  name: string;
  segment_type: "climb" | "sprint" | "custom";
  start_checkpoint_id: string;
  finish_checkpoint_id: string;
};
type Payload = {
  module_ready: boolean;
  migration_required?: boolean;
  module_message?: string | null;
  stage: Stage;
  route: {
    id: string;
    version: number;
    file_name: string;
    route_points: Array<[number, number, number?]>;
  };
  checkpoints: StoredCheckpoint[];
  segments: Segment[];
};

function pointAtProgress(points: EditorPoint[], progress: number) {
  const index = Math.round(
    (Math.min(100, Math.max(0, progress)) / 100) *
      Math.max(0, points.length - 1),
  );
  return points[index] ?? points[0] ?? [-29.5, -50.8];
}

function generateUniform(
  points: EditorPoint[],
  intermediateCount: number,
): StoredCheckpoint[] {
  const total = Math.min(14, Math.max(3, intermediateCount + 2));
  return Array.from({ length: total }, (_, index) => {
    const progress = (index / (total - 1)) * 100;
    const point = pointAtProgress(points, progress);
    const isStart = index === 0;
    const isFinish = index === total - 1;
    return {
      sequence: index,
      label: isStart ? "Largada" : isFinish ? "Chegada" : `CP ${index}`,
      latitude: point[0],
      longitude: point[1],
      route_progress: Number(progress.toFixed(2)),
      radius_m: 120,
      checkpoint_kind: isStart ? "start" : isFinish ? "finish" : "control",
      is_timing_point: true,
    };
  });
}

function formatStageDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function CheckpointManagerPage() {
  const { activeEventId } = useOrganizationEvent();
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageId, setStageId] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [checkpoints, setCheckpoints] = useState<StoredCheckpoint[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(1);
  const [intermediateCount, setIntermediateCount] = useState(5);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [segmentType, setSegmentType] = useState<"climb" | "sprint" | "custom">(
    "climb",
  );
  const [segmentStart, setSegmentStart] = useState("");
  const [segmentFinish, setSegmentFinish] = useState("");

  const routePoints = useMemo<EditorPoint[]>(
    () =>
      (payload?.route.route_points ?? []).map((point) => [
        Number(point[0]),
        Number(point[1]),
      ]),
    [payload],
  );

  async function loadStages() {
    if (!activeEventId) {
      setStages([]);
      setStageId("");
      setLoading(false);
      return;
    }
    const response = await fetch(
      `/api/admin/routes?eventId=${encodeURIComponent(activeEventId)}`,
      { cache: "no-store" },
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error ?? "Falha ao carregar etapas.");
    const normalized = (data.stages ?? []).map((stage: any) => ({
      id: stage.id,
      name: stage.name,
      route_label: stage.route_label,
      stage_date: stage.stage_date,
    }));
    setStages(normalized);
    setStageId((current) =>
      normalized.some((stage: Stage) => stage.id === current)
        ? current
        : normalized[0]?.id || "",
    );
  }

  async function loadCheckpointData(currentStageId: string) {
    setLoading(true);
    setStatus("");
    const response = await fetch(
      `/api/admin/checkpoints?stageId=${encodeURIComponent(currentStageId)}`,
      { cache: "no-store" },
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error ?? "Falha ao carregar checkpoints.");
    const nextPayload = data as Payload;
    const points = (nextPayload.route.route_points ?? []).map(
      (point) => [Number(point[0]), Number(point[1])] as EditorPoint,
    );
    const saved = nextPayload.checkpoints?.length
      ? nextPayload.checkpoints
      : generateUniform(points, 5);
    setPayload(nextPayload);
    setCheckpoints(saved);
    setIntermediateCount(Math.max(1, saved.length - 2));
    setSelectedIndex(saved.length > 2 ? 1 : 0);
    const firstControl = saved.find(
      (checkpoint, index) => index > 0 && index < saved.length - 1,
    );
    setSegmentStart(firstControl?.id ?? saved[0]?.id ?? "");
    setSegmentFinish(
      saved[saved.length - 2]?.id ?? saved[saved.length - 1]?.id ?? "",
    );
    setLoading(false);
  }

  useEffect(() => {
    loadStages().catch((error) => {
      setStatus(error.message);
      setLoading(false);
    });
  }, [activeEventId]);

  useEffect(() => {
    if (!stageId) return;
    loadCheckpointData(stageId).catch((error) => {
      setStatus(error.message);
      setLoading(false);
    });
  }, [stageId]);

  function updateProgress(index: number, progress: number) {
    if (index === 0 || index === checkpoints.length - 1) return;
    const minimum = checkpoints[index - 1].route_progress + 0.01;
    const maximum = checkpoints[index + 1].route_progress - 0.01;
    const normalized = Math.min(maximum, Math.max(minimum, progress));
    const point = pointAtProgress(routePoints, normalized);
    setCheckpoints((current) =>
      current.map((checkpoint, checkpointIndex) =>
        checkpointIndex === index
          ? {
              ...checkpoint,
              route_progress: Number(normalized.toFixed(2)),
              latitude: point[0],
              longitude: point[1],
            }
          : checkpoint,
      ),
    );
  }

  function updateCheckpoint(index: number, patch: Partial<StoredCheckpoint>) {
    setCheckpoints((current) =>
      current.map((checkpoint, checkpointIndex) =>
        checkpointIndex === index ? { ...checkpoint, ...patch } : checkpoint,
      ),
    );
  }

  function regenerate() {
    const next = generateUniform(routePoints, intermediateCount);
    setCheckpoints(next);
    setSelectedIndex(next.length > 2 ? 1 : 0);
    setStatus(
      "Distribuição uniforme criada. Revise os pontos no mapa e clique em salvar.",
    );
  }

  async function saveCheckpoints() {
    if (!stageId) return;
    setSaving(true);
    setStatus("Salvando checkpoints...");
    try {
      const response = await fetch("/api/admin/checkpoints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId,
          checkpoints: checkpoints.map((checkpoint) => ({
            sequence: checkpoint.sequence,
            label: checkpoint.label,
            route_progress: checkpoint.route_progress,
            radius_m: checkpoint.radius_m,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Falha ao salvar checkpoints.");
      setStatus(
        `${data.checkpoints.length} pontos de controle salvos. Recalculando passagens existentes...`,
      );
      const reprocessStatus = await reprocessPassages(false);
      await loadCheckpointData(stageId);
      if (reprocessStatus) setStatus(reprocessStatus);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Falha ao salvar checkpoints.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function reprocessPassages(showConfirmation = true) {
    if (!stageId) return;
    if (
      showConfirmation &&
      !confirm(
        "Recalcular todas as passagens e a classificação desta etapa com os raios atuais?",
      )
    )
      return;
    setSaving(true);
    setStatus("Recalculando passagens, segmentos e classificação...");
    try {
      const response = await fetch("/api/admin/checkpoints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Falha ao recalcular passagens.");
      const classificationResponse = await fetch("/api/admin/classification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: activeEventId }),
      });
      const classification = await classificationResponse.json();
      if (!classificationResponse.ok)
        throw new Error(
          classification.error ??
            "Passagens atualizadas, mas a classificação não foi recalculada.",
        );
      const approximation = data.approximate_activities
        ? ` ${data.approximate_activities} atividade(s) antiga(s) sem cronologia completa usaram tempo proporcional.`
        : "";
      const successMessage = `${data.reprocessed} atividade(s), ${data.passages_saved} passagem(ns) e ${data.segments_saved} segmento(s) recalculados. ${classification.recalculated} resultado(s) atualizados.${approximation}`;
      setStatus(successMessage);
      return successMessage;
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Falha ao recalcular passagens.",
      );
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function createSegment(event: FormEvent) {
    event.preventDefault();
    if (!stageId || !segmentName || !segmentStart || !segmentFinish) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/checkpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId,
          name: segmentName,
          segmentType,
          startCheckpointId: segmentStart,
          finishCheckpointId: segmentFinish,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Falha ao criar segmento.");
      setSegmentName("");
      setStatus("Segmento cronometrado criado.");
      await loadCheckpointData(stageId);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Falha ao criar segmento.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteSegment(segmentId: string) {
    if (!confirm("Excluir este segmento e seus rankings calculados?")) return;
    const response = await fetch(
      `/api/admin/checkpoints?segmentId=${encodeURIComponent(segmentId)}`,
      { method: "DELETE" },
    );
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Falha ao excluir segmento.");
      return;
    }
    setStatus("Segmento excluído.");
    await loadCheckpointData(stageId);
  }

  const checkpointById = new Map(
    checkpoints
      .filter((checkpoint) => checkpoint.id)
      .map((checkpoint) => [checkpoint.id, checkpoint]),
  );

  return (
    <main className="checkpoint-page">
      <style>{`
        .checkpoint-page{min-height:100vh;background:#0d100d;color:#f4eee4;padding:44px 20px;font-family:Arial,sans-serif}.checkpoint-shell{max-width:1280px;margin:auto}.checkpoint-page h1{font-size:clamp(40px,6vw,72px);line-height:.92;margin:12px 0 16px}.eyebrow{color:#d47b2d;letter-spacing:.2em;text-transform:uppercase;font-size:12px;font-weight:900}.intro{max-width:820px;color:#b7bbb3;font-size:17px;line-height:1.65}.stage-select{margin-top:28px;width:min(560px,100%);padding:14px;background:#171a16;color:#fff;border:1px solid #555a50}.checkpoint-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(340px,.65fr);gap:22px;margin-top:24px}.map-card,.editor-card,.segment-card{border:1px solid #3b4037;background:#171a16;padding:22px}.editor-card{align-self:start}.editor-top{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end}.editor-top input,.checkpoint-row input,.checkpoint-row select,.segment-form input,.segment-form select{width:100%;box-sizing:border-box;padding:11px;background:#0d100d;color:#fff;border:1px solid #555a50}.secondary,.primary,.danger{border:0;padding:12px 15px;font-weight:900;cursor:pointer}.secondary{background:#31372f;color:#fff}.primary{background:#e86619;color:#fff}.danger{background:#762f2d;color:#fff}.checkpoint-list{display:grid;gap:10px;margin-top:18px;max-height:520px;overflow:auto;padding-right:4px}.checkpoint-row{border:1px solid #3d433a;padding:13px;background:#11140f}.checkpoint-row.active{border-color:#e86619}.checkpoint-row-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}.checkpoint-row-head button{background:transparent;border:0;color:#e9e3da;font-weight:900;cursor:pointer}.range{width:100%;accent-color:#e86619}.row-fields{display:grid;grid-template-columns:1fr 92px;gap:8px;margin-top:8px}.status{margin:16px 0 0;padding:13px;background:#242820;color:#efb078}.migration{margin-top:18px;border:1px solid #a96e2f;background:#2b2115;padding:15px;color:#f2c38f}.segment-card{margin-top:22px}.segment-form{display:grid;grid-template-columns:1.2fr .7fr 1fr 1fr auto;gap:9px;align-items:end}.segments{display:grid;gap:8px;margin-top:16px}.segment-item{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;border-top:1px solid #3c4138;padding-top:12px}.segment-item span{display:block;color:#9fa49b;font-size:13px;margin-top:4px}.empty{color:#8f948c}.hint{color:#9fa49b;font-size:13px;line-height:1.5;margin-top:12px}
        @media(max-width:940px){.checkpoint-grid{grid-template-columns:1fr}.segment-form{grid-template-columns:1fr 1fr}.segment-form .primary{grid-column:1/-1}.editor-card{order:-1}}@media(max-width:620px){.segment-form,.row-fields,.editor-top{grid-template-columns:1fr}.checkpoint-page{padding:30px 12px}.map-card,.editor-card,.segment-card{padding:14px}}
      `}</style>
      <div className="checkpoint-shell">
        <p className="eyebrow">Legends Core · Checkpoint Engine</p>
        <h1>Checkpoints e segmentos</h1>
        <p className="intro">
          Defina cinco pontos intermediários por etapa, ajuste cada posição
          sobre o GPX oficial e transforme pares de checkpoints em subidas,
          sprints ou trechos especiais.
        </p>
        <select
          className="stage-select"
          value={stageId}
          onChange={(event) => setStageId(event.target.value)}
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name} · {formatStageDate(stage.stage_date)}
            </option>
          ))}
        </select>

        {payload?.migration_required ? (
          <div className="migration">
            <strong>Módulo aguardando banco de dados.</strong>
            <br />
            {payload.module_message}
          </div>
        ) : null}

        <section className="checkpoint-grid">
          <div className="map-card">
            {loading ? (
              <p>Carregando rota...</p>
            ) : routePoints.length > 1 ? (
              <CheckpointEditorMap
                routePoints={routePoints}
                checkpoints={checkpoints}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                onMove={updateProgress}
              />
            ) : (
              <p className="empty">A etapa precisa ter uma rota GPX ativa.</p>
            )}
            <p className="hint">
              Selecione um checkpoint na lista ou no mapa. Depois clique sobre a
              linha laranja para reposicioná-lo no ponto oficial mais próximo.
            </p>
          </div>

          <aside className="editor-card">
            <div className="editor-top">
              <label>
                <span>Checkpoints intermediários</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={intermediateCount}
                  onChange={(event) =>
                    setIntermediateCount(Number(event.target.value))
                  }
                />
              </label>
              <button className="secondary" type="button" onClick={regenerate}>
                DISTRIBUIR
              </button>
            </div>
            <div className="checkpoint-list">
              {checkpoints.map((checkpoint, index) => (
                <div
                  className={`checkpoint-row ${selectedIndex === index ? "active" : ""}`}
                  key={`${index}-${checkpoint.route_progress}`}
                >
                  <div className="checkpoint-row-head">
                    <button
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                    >
                      {index === 0
                        ? "LARGADA"
                        : index === checkpoints.length - 1
                          ? "CHEGADA"
                          : `CP ${index}`}
                    </button>
                    <span>{checkpoint.route_progress.toFixed(2)}%</span>
                  </div>
                  <input
                    value={checkpoint.label}
                    disabled={index === 0 || index === checkpoints.length - 1}
                    onChange={(event) =>
                      updateCheckpoint(index, { label: event.target.value })
                    }
                  />
                  <input
                    className="range"
                    type="range"
                    min={0}
                    max={100}
                    step={0.05}
                    disabled={index === 0 || index === checkpoints.length - 1}
                    value={checkpoint.route_progress}
                    onChange={(event) =>
                      updateProgress(index, Number(event.target.value))
                    }
                  />
                  <div className="row-fields">
                    <span>Raio de detecção</span>
                    <input
                      type="number"
                      min={30}
                      max={500}
                      value={checkpoint.radius_m}
                      onChange={(event) =>
                        updateCheckpoint(index, {
                          radius_m: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              className="primary"
              type="button"
              disabled={saving || !payload?.module_ready}
              onClick={saveCheckpoints}
              style={{ width: "100%", marginTop: 16 }}
            >
              {saving ? "SALVANDO..." : "SALVAR CHECKPOINTS"}
            </button>
            <button
              className="secondary"
              type="button"
              disabled={saving || !payload?.module_ready}
              onClick={() => void reprocessPassages()}
              style={{ width: "100%", marginTop: 10 }}
            >
              RECALCULAR PASSAGENS EXISTENTES
            </button>
            {status ? <div className="status">{status}</div> : null}
          </aside>
        </section>

        <section className="segment-card">
          <p className="eyebrow">Rankings especiais</p>
          <h2>Segmentos cronometrados</h2>
          <form className="segment-form" onSubmit={createSegment}>
            <label>
              <span>Nome</span>
              <input
                value={segmentName}
                onChange={(event) => setSegmentName(event.target.value)}
                placeholder="Ex.: Subida do Morro"
              />
            </label>
            <label>
              <span>Tipo</span>
              <select
                value={segmentType}
                onChange={(event) =>
                  setSegmentType(event.target.value as typeof segmentType)
                }
              >
                <option value="climb">Subida</option>
                <option value="sprint">Sprint</option>
                <option value="custom">Especial</option>
              </select>
            </label>
            <label>
              <span>Início</span>
              <select
                value={segmentStart}
                onChange={(event) => setSegmentStart(event.target.value)}
              >
                <option value="">Selecione</option>
                {checkpoints
                  .filter((checkpoint) => checkpoint.id)
                  .map((checkpoint) => (
                    <option key={checkpoint.id} value={checkpoint.id}>
                      {checkpoint.label}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>Fim</span>
              <select
                value={segmentFinish}
                onChange={(event) => setSegmentFinish(event.target.value)}
              >
                <option value="">Selecione</option>
                {checkpoints
                  .filter((checkpoint) => checkpoint.id)
                  .map((checkpoint) => (
                    <option key={checkpoint.id} value={checkpoint.id}>
                      {checkpoint.label}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="primary"
              disabled={saving || !payload?.module_ready}
            >
              CRIAR
            </button>
          </form>
          <div className="segments">
            {payload?.segments?.length ? (
              payload.segments.map((segment) => {
                const start = checkpointById.get(segment.start_checkpoint_id);
                const finish = checkpointById.get(segment.finish_checkpoint_id);
                return (
                  <div className="segment-item" key={segment.id}>
                    <div>
                      <strong>{segment.name}</strong>
                      <span>
                        {segment.segment_type === "climb"
                          ? "Subida"
                          : segment.segment_type === "sprint"
                            ? "Sprint"
                            : "Especial"}{" "}
                        · {start?.label ?? "Início"} → {finish?.label ?? "Fim"}
                      </span>
                    </div>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => void deleteSegment(segment.id)}
                    >
                      EXCLUIR
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="empty">
                Nenhum segmento cronometrado criado nesta etapa.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
