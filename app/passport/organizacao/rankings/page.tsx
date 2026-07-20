"use client";

import { useEffect, useMemo, useState } from "react";

type Stage = { id: string; name: string; route_label: string | null; stage_date: string };
type Segment = { id: string; stage_id: string; name: string; segment_type: string };
type RankingResult = {
  id: string; position: number; elapsed_s: number; status: string; segment: Segment; stage: Stage;
  athlete: { full_name: string; category: string | null; country_code: string | null; bib_number?: string | null; modality?: string | null } | null;
  activity: { name: string; started_at: string; distance_km: number } | null;
  start_passage: { passed_at: string; elapsed_s: number } | null;
  finish_passage: { passed_at: string; elapsed_s: number } | null;
};
type Payload = { module_ready: boolean; message?: string; stages: Stage[]; segments: Segment[]; results: RankingResult[] };

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(Number(seconds)));
  const hours = Math.floor(total / 3600); const minutes = Math.floor((total % 3600) / 60); const remaining = total % 60;
  return `${hours ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}
function formatPassage(value?: string | null) { return value ? new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"; }

export default function RankingsPage() {
  const [payload, setPayload] = useState<Payload | null>(null); const [stageId, setStageId] = useState(""); const [segmentId, setSegmentId] = useState("");
  const [category, setCategory] = useState("all"); const [status, setStatus] = useState(""); const [loading, setLoading] = useState(true);

  async function load(currentStageId = stageId, currentSegmentId = segmentId) {
    setLoading(true); const query = new URLSearchParams(); if (currentStageId) query.set("stageId", currentStageId); if (currentSegmentId) query.set("segmentId", currentSegmentId);
    const response = await fetch(`/api/admin/rankings?${query.toString()}`, { cache: "no-store" }); const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Falha ao carregar rankings."); setPayload(data); setLoading(false); return data as Payload;
  }

  useEffect(() => { load("", "").then((data) => setStageId(data.stages?.[0]?.id ?? "")).catch((error) => { setStatus(error.message); setLoading(false); }); }, []);
  useEffect(() => { if (!stageId) return; setSegmentId(""); load(stageId, "").catch((error) => { setStatus(error.message); setLoading(false); }); }, [stageId]);
  useEffect(() => { if (!stageId || !segmentId) return; load(stageId, segmentId).catch((error) => { setStatus(error.message); setLoading(false); }); }, [segmentId]);

  const categories = useMemo(() => [...new Set((payload?.results ?? []).map((result) => result.athlete?.category).filter(Boolean) as string[])].sort(), [payload]);
  const results = useMemo(() => category === "all" ? payload?.results ?? [] : (payload?.results ?? []).filter((result) => (result.athlete?.category ?? "Sem categoria") === category), [payload, category]);
  const stageSegments = payload?.segments ?? [];

  return <main className="rankings-page"><style>{`
    .rankings-page{min-height:100vh;background:#0d100d;color:#f4eee4;padding:44px 20px;font-family:Arial,sans-serif}.rankings-shell{max-width:1240px;margin:auto}.eyebrow{color:#d47b2d;letter-spacing:.2em;text-transform:uppercase;font-size:12px;font-weight:900}.rankings-page h1{font-size:clamp(40px,6vw,72px);line-height:.92;margin:12px 0}.intro{max-width:820px;color:#b8bcb4;font-size:17px;line-height:1.65}.filters{display:grid;grid-template-columns:1fr 1fr .8fr auto;gap:10px;margin:30px 0 20px}.filters select,.refresh{padding:13px;background:#171a16;color:#fff;border:1px solid #555a50}.refresh{background:#e86619;border:0;font-weight:900;cursor:pointer}.migration{border:1px solid #a96e2f;background:#2b2115;padding:16px;color:#f2c38f;margin-top:20px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#3c4138;border:1px solid #3c4138;margin-bottom:18px}.summary div{background:#171a16;padding:18px}.summary strong{display:block;font-size:28px}.summary span{font-size:12px;color:#9fa49b}.table-wrap{overflow:auto;border:1px solid #3c4138}.ranking-table{width:100%;border-collapse:collapse;min-width:980px;background:#171a16}.ranking-table th,.ranking-table td{padding:15px 14px;border-bottom:1px solid #353b33;text-align:left}.ranking-table th{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#d47b2d;background:#11140f}.position{font-size:24px;font-weight:900}.bib{font-size:18px;font-weight:900;color:#e86619}.time{font-size:20px;font-weight:900;color:#f0a15f}.athlete strong,.athlete span{display:block}.athlete span,.muted{font-size:12px;color:#9fa49b;margin-top:4px}.status-valid{color:#71c58f;font-weight:900}.status-review{color:#efb078;font-weight:900}.empty{padding:34px;border:1px solid #3c4138;background:#171a16;color:#9fa49b;text-align:center}.notice{padding:14px;background:#242820;color:#efb078;margin-top:15px}@media(max-width:780px){.filters{grid-template-columns:1fr}.summary{grid-template-columns:1fr}.rankings-page{padding:30px 12px}}
  `}</style><div className="rankings-shell">
    <p className="eyebrow">Legends Core · Segment Engine</p><h1>Rankings de trechos</h1><p className="intro">Compare o tempo registrado entre dois checkpoints. Os dados oficiais de número, categoria e modalidade vêm do cadastro de inscritos.</p>
    {!payload?.module_ready && payload?.message ? <div className="migration"><strong>Módulo aguardando banco de dados.</strong><br />{payload.message}</div> : null}
    <div className="filters"><select value={stageId} onChange={(event) => setStageId(event.target.value)}><option value="">Todas as etapas</option>{payload?.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select><select value={segmentId} onChange={(event) => setSegmentId(event.target.value)}><option value="">Todos os segmentos</option>{stageSegments.map((segment) => <option key={segment.id} value={segment.id}>{segment.name}</option>)}</select><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><button className="refresh" type="button" onClick={() => void load()}>ATUALIZAR</button></div>
    <div className="summary"><div><strong>{results.length}</strong><span>resultados</span></div><div><strong>{results.filter((result) => result.status === "valid").length}</strong><span>válidos</span></div><div><strong>{results.length ? formatDuration(Math.min(...results.map((result) => Number(result.elapsed_s)))) : "—"}</strong><span>melhor tempo</span></div></div>
    {loading ? <div className="empty">Carregando resultados...</div> : results.length ? <div className="table-wrap"><table className="ranking-table"><thead><tr><th>Pos.</th><th>Nº</th><th>Atleta</th><th>Segmento</th><th>Tempo</th><th>Passagem inicial</th><th>Passagem final</th><th>Status</th></tr></thead><tbody>{results.map((result, index) => <tr key={result.id}><td className="position">{category === "all" ? result.position : index + 1}</td><td className="bib">{result.athlete?.bib_number ?? "—"}</td><td className="athlete"><strong>{result.athlete?.full_name ?? "Atleta"}</strong><span>{result.athlete?.category ?? "Sem categoria"} · {result.athlete?.modality === "experience" ? "Experience" : "Gravel Race"}</span></td><td><strong>{result.segment?.name ?? "Segmento"}</strong><div className="muted">{result.stage?.name}</div></td><td className="time">{formatDuration(result.elapsed_s)}</td><td>{formatPassage(result.start_passage?.passed_at)}</td><td>{formatPassage(result.finish_passage?.passed_at)}</td><td className={result.status === "valid" ? "status-valid" : "status-review"}>{result.status === "valid" ? "VÁLIDO" : "REVISÃO"}</td></tr>)}</tbody></table></div> : <div className="empty">Nenhum resultado calculado para os filtros selecionados.</div>}
    {status ? <div className="notice">{status}</div> : null}
  </div></main>;
}
