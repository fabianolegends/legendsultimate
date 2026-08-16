"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Stage = {
  id: string;
  stage_number: number;
  name: string;
  route_label: string | null;
  stage_date: string;
  results_published_at: string | null;
};
type StageResult = {
  id: string;
  stage_id: string;
  full_name: string;
  bib_number: string | null;
  category: string;
  journey_format: "ultimate" | "short";
  official_time_s: number;
  time_penalty_s: number;
  points_penalty: number;
  final_time_s: number;
  position: number | null;
  weighted_points: number;
  status: string;
  penalty_reason: string | null;
};
type OverallResult = {
  registration_id?: string | null;
  athlete_id: string;
  full_name: string;
  bib_number?: string | null;
  category: string;
  journey_format: "ultimate" | "short";
  overall_position: number;
  total_points: number;
  total_time_s: number;
  stages_completed: number;
  stage_results: Array<{
    stage_id: string;
    stage_number: number;
    final_time_s: number;
    weighted_points: number;
  }>;
};
type Payload = {
  event: { slug: string; name: string; location: string | null; starts_on: string; ends_on: string };
  stages: Stage[];
  results: StageResult[];
  overall: OverallResult[];
  generated_at: string;
  latest_publication_at: string | null;
};

function duration(seconds?: number | null) {
  if (!seconds) return "—";
  const total = Math.max(0, Math.round(Number(seconds)));
  return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function statusLabel(status: string) {
  if (status === "dnf") return "DNF";
  if (status === "disqualified") return "DSQ";
  return "OFICIAL";
}

export default function PublicLiveResultsPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug ?? "");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [stageId, setStageId] = useState("");
  const [category, setCategory] = useState("all");
  const [journeyFormat, setJourneyFormat] = useState<"ultimate" | "short">("ultimate");
  const [view, setView] = useState<"stage" | "overall">("stage");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(silent = false) {
    if (!slug) return;
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/results/${encodeURIComponent(slug)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Resultados indisponíveis.");
      setPayload(data);
      setStageId((current) => data.stages.some((stage: Stage) => stage.id === current) ? current : (data.stages.at(-1)?.id ?? ""));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Resultados indisponíveis.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [slug]);
  useEffect(() => {
    const timer = window.setInterval(() => { void load(true); }, 15000);
    return () => window.clearInterval(timer);
  }, [slug]);

  const availableStages = useMemo(() => (payload?.stages ?? []).filter((stage) => journeyFormat === "ultimate" || stage.stage_number >= 3), [payload, journeyFormat]);
  useEffect(() => {
    if (!availableStages.some((stage) => stage.id === stageId)) setStageId(availableStages.at(-1)?.id ?? "");
  }, [availableStages, stageId]);
  const categories = useMemo(() => [...new Set((payload?.results ?? []).filter((result) => result.journey_format === journeyFormat).map((result) => result.category))].sort(), [payload, journeyFormat]);
  const stageResults = useMemo(() => {
    const rows = (payload?.results ?? []).filter((result) => result.stage_id === stageId && result.journey_format === journeyFormat);
    return category === "all" ? rows : rows.filter((result) => result.category === category);
  }, [payload, stageId, category, journeyFormat]);
  const overallResults = useMemo(() => {
    const rows = (payload?.overall ?? []).filter((result) => result.journey_format === journeyFormat);
    return category === "all" ? rows : rows.filter((result) => result.category === category);
  }, [payload, category, journeyFormat]);
  const selectedStage = payload?.stages.find((stage) => stage.id === stageId) ?? null;

  return <main className="live-results">
    <style>{`
      .live-results{min-height:100vh;background:#0c0f0c;color:#f2eee5;font-family:Arial,sans-serif}.live-results *{box-sizing:border-box}.live-hero{padding:28px 5vw 58px;background:linear-gradient(90deg,#080a08fa,#080a08c8),url('/hero-production.jpg') center/cover;border-bottom:1px solid #453624}.live-nav{display:flex;align-items:center;justify-content:space-between;gap:20px}.live-nav img{width:160px}.live-nav a{font-size:11px;font-weight:900;letter-spacing:.12em;color:#d9d6cf}.live-shell{width:min(1480px,90%);margin:auto}.live-heading{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-top:55px}.kicker{color:#e87827;font-size:12px;letter-spacing:.22em;font-weight:900}.live-heading h1{font-size:clamp(48px,7vw,96px);line-height:.86;font-weight:300;margin:15px 0}.live-heading p{color:#aeb3ab;line-height:1.6;max-width:580px}.live-signal{display:inline-flex;align-items:center;gap:8px;color:#78ce93;font-weight:900;font-size:12px;letter-spacing:.1em}.live-signal i{width:9px;height:9px;border-radius:50%;background:#58d47e;box-shadow:0 0 0 6px #58d47e22;animation:pulse 1.8s infinite}@keyframes pulse{50%{box-shadow:0 0 0 12px transparent}}.live-meta{display:flex;gap:28px;flex-wrap:wrap;margin-top:24px;color:#aeb3ab;font-size:12px}.live-content{padding:42px 0 90px}.controls{display:grid;grid-template-columns:auto auto auto 1fr auto;gap:10px;margin-bottom:18px}.controls button,.controls select{padding:14px;border:1px solid #474c44;background:#161a16;color:#eee;font:800 12px Arial;cursor:pointer}.controls button.active{background:#eee6da;color:#171917}.controls .refresh{border-color:#c76320;color:#f18a43}.notice{padding:15px;border:1px solid #6e4b29;background:#251a10;color:#efaa69;margin-bottom:18px}.facts{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #383e36;margin-bottom:18px}.facts div{padding:18px;border-right:1px solid #383e36}.facts strong,.facts span{display:block}.facts strong{font-size:26px}.facts span{color:#92988f;font-size:10px;text-transform:uppercase;margin-top:5px}.table-wrap{overflow:auto;border:1px solid #383e36}.result-table{width:100%;min-width:1000px;border-collapse:collapse;background:#151915}.result-table th,.result-table td{padding:16px;border-bottom:1px solid #343a32;text-align:left}.result-table th{color:#db792e;font-size:10px;letter-spacing:.13em;text-transform:uppercase;background:#101310}.position{font-size:27px;font-weight:900}.bib,.points{color:#ed7425;font-size:19px;font-weight:900}.format{font-weight:900;color:#efaa69}.athlete strong,.athlete span{display:block}.athlete span{font-size:11px;color:#8f958c;margin-top:5px}.time{font-size:18px;font-weight:800}.penalty{color:#efaa69}.penalty small{display:block;max-width:280px;margin-top:5px;line-height:1.35}.status{font-size:11px;font-weight:900;color:#73c990}.status.dnf,.status.disqualified{color:#e47d68}.stage-cells{display:flex;gap:6px}.stage-cell{min-width:76px;border:1px solid #3d433a;padding:7px;text-align:center}.stage-cell span,.stage-cell strong,.stage-cell small{display:block}.stage-cell span{font-size:9px;color:#979d94}.stage-cell small{font-size:9px;color:#d57b31;margin-top:3px}.empty{padding:55px;text-align:center;border:1px solid #383e36;color:#9ca198;background:#151915}.live-foot{display:flex;justify-content:space-between;gap:20px;margin-top:20px;color:#7f857d;font-size:11px}@media(max-width:850px){.live-heading{display:block}.controls{grid-template-columns:1fr 1fr}.controls select{grid-column:1/-1}.facts{grid-template-columns:1fr 1fr}.live-shell{width:min(94%,720px)}}@media(max-width:520px){.live-hero{padding-inline:18px}.live-nav img{width:130px}.live-shell{width:calc(100% - 28px)}.controls{grid-template-columns:1fr}.controls select{grid-column:auto}.facts{grid-template-columns:1fr 1fr}.live-foot{display:block}}
    `}</style>
    <header className="live-hero">
      <nav className="live-nav"><a href="/"><img src="/legends-logo-official.png" alt="Legends"/></a><a href={`/eventos/${slug}`}>EVENTO E INSCRIÇÃO →</a></nav>
      <div className="live-shell live-heading"><div><div className="kicker">LEGENDS CORE · RESULTADOS</div><h1>{payload?.event.name ?? "Resultado ao vivo"}</h1></div><div><div className="live-signal"><i/>ATUALIZAÇÃO AUTOMÁTICA</div><p>Resultados oficiais publicados pela organização. Esta página verifica novas publicações a cada 15 segundos.</p></div></div>
      {payload ? <div className="live-shell live-meta"><span>{payload.event.location ?? "Local a definir"}</span><span>{payload.stages.length} etapa(s) publicada(s)</span><span>Última publicação: {payload.latest_publication_at ? new Date(payload.latest_publication_at).toLocaleString("pt-BR") : "—"}</span></div> : null}
    </header>
    <section className="live-shell live-content">
      <div className="controls">
        <button className={view === "stage" ? "active" : ""} onClick={() => setView("stage")}>RESULTADO DA ETAPA</button>
        <button className={view === "overall" ? "active" : ""} onClick={() => setView("overall")}>CLASSIFICAÇÃO ACUMULADA</button>
        <select aria-label="Formato" value={journeyFormat} onChange={(event) => { setJourneyFormat(event.target.value as "ultimate" | "short"); setCategory("all"); }}><option value="ultimate">Legends Ultimate</option><option value="short">Legends Short</option></select>
        <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <button className="refresh" disabled={loading} onClick={() => load()}>{loading ? "ATUALIZANDO..." : "ATUALIZAR"}</button>
      </div>
      {view === "stage" && availableStages.length ? <select aria-label="Etapa" value={stageId} onChange={(event) => setStageId(event.target.value)} style={{width:"100%",padding:14,marginBottom:18,background:"#161a16",color:"#fff",border:"1px solid #474c44"}}>{availableStages.map((stage) => <option value={stage.id} key={stage.id}>Stage {stage.stage_number} · {stage.name}</option>)}</select> : null}
      {error ? <div className="notice">{error}</div> : null}
      {!error && !loading && !payload?.stages.length ? <div className="empty"><strong>Os resultados ainda não foram publicados.</strong><br/><br/>Esta página será liberada automaticamente após a homologação da primeira etapa.</div> : null}
      {view === "stage" && selectedStage ? <>
        <section className="facts"><div><strong>Stage {selectedStage.stage_number}</strong><span>Etapa</span></div><div><strong>{stageResults.length}</strong><span>Atletas</span></div><div><strong>{categories.length}</strong><span>Categorias</span></div><div><strong>OFICIAL</strong><span>Situação</span></div></section>
        {stageResults.length ? <div className="table-wrap"><table className="result-table"><thead><tr><th>Pos.</th><th>Nº</th><th>Atleta</th><th>Formato</th><th>Categoria</th><th>Tempo oficial</th><th>Penalidade e motivo</th><th>Tempo final</th><th>Pontos</th><th>Situação</th></tr></thead><tbody>{stageResults.map((result) => <tr key={result.id}><td className="position">{result.position ?? "—"}</td><td className="bib">{result.bib_number ?? "—"}</td><td className="athlete"><strong>{result.full_name}</strong><span>{selectedStage.name}</span></td><td className="format">{result.journey_format === "short" ? "Short" : "Ultimate"}</td><td>{result.category}</td><td className="time">{duration(result.official_time_s)}</td><td className="penalty">{result.time_penalty_s || result.points_penalty || result.status !== "official" ? <><strong>{result.time_penalty_s ? `+${duration(result.time_penalty_s)} tempo` : ""}{result.time_penalty_s && result.points_penalty ? " · " : ""}{result.points_penalty ? `-${result.points_penalty} ponto(s)` : ""}</strong>{result.penalty_reason ? <small>Motivo: {result.penalty_reason}</small> : null}</> : "—"}</td><td className="time">{duration(result.final_time_s)}</td><td className="points">{result.weighted_points}</td><td><span className={`status ${result.status}`}>{statusLabel(result.status)}</span></td></tr>)}</tbody></table></div> : <div className="empty">Nenhum resultado publicado para esta categoria.</div>}
      </> : null}
      {view === "overall" && payload?.stages.length ? <>
        <section className="facts"><div><strong>{overallResults.length}</strong><span>Atletas</span></div><div><strong>{availableStages.length}</strong><span>Etapas do formato</span></div><div><strong>{categories.length}</strong><span>Categorias</span></div><div><strong>AO VIVO</strong><span>Acumulado</span></div></section>
        {overallResults.length ? <div className="table-wrap"><table className="result-table"><thead><tr><th>Pos.</th><th>Nº</th><th>Atleta</th><th>Formato</th><th>Categoria</th><th>Etapas</th><th>Tempo acumulado</th><th>Pontos</th></tr></thead><tbody>{overallResults.map((result) => <tr key={`${result.journey_format}:${result.registration_id ?? result.athlete_id}:${result.category}`}><td className="position">{result.overall_position}</td><td className="bib">{result.bib_number ?? "—"}</td><td className="athlete"><strong>{result.full_name}</strong><span>{result.stages_completed}/{availableStages.length} etapas</span></td><td className="format">{result.journey_format === "short" ? "Short" : "Ultimate"}</td><td>{result.category}</td><td><div className="stage-cells">{availableStages.map((stage) => {const score = result.stage_results.find((item) => item.stage_id === stage.id);return <div className="stage-cell" key={stage.id}><span>S{stage.stage_number}</span><strong>{duration(score?.final_time_s)}</strong><small>{score?.weighted_points ?? 0} pts</small></div>;})}</div></td><td className="time">{duration(result.total_time_s)}</td><td className="points">{result.total_points}</td></tr>)}</tbody></table></div> : <div className="empty">Nenhum atleta classificado nesta categoria.</div>}
      </> : null}
      <footer className="live-foot"><span>Resultado oficial emitido pelo Legends Core.</span><span>{payload?.generated_at ? `Dados consultados em ${new Date(payload.generated_at).toLocaleString("pt-BR")}` : ""}</span></footer>
    </section>
  </main>;
}
