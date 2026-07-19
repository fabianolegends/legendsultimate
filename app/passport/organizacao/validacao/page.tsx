"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";

const ValidationMap = dynamic(() => import("./ValidationMap"), {
  ssr: false,
  loading: () => (
    <div style={{ marginTop: 24, padding: 28, border: "1px solid #c8bcaa", background: "#fffaf2", color: "#6c685f" }}>
      Carregando o mapa da validação...
    </div>
  ),
});

type Stage = { id: string; name: string; stage_date: string };
type CheckpointResult = {
  id?: string;
  sequence: number;
  label: string;
  hit: boolean;
  nearest_distance_m: number;
};
type MapCheckpoint = {
  sequence: number;
  label: string;
  latitude: number;
  longitude: number;
  hit: boolean;
  nearest_distance_m: number;
};
type Report = {
  status: "validated" | "manual_review" | "rejected";
  coverage_percent: number;
  matched_route_km: number;
  route_distance_km: number;
  activity_distance_km: number;
  start_ok: boolean;
  finish_ok: boolean;
  direction_ok: boolean;
  checkpoints_hit: number;
  checkpoints_total: number;
  checkpoint_results: CheckpointResult[];
  tolerance_m: number;
  notes: string[];
};
type Result = {
  report: Report;
  route: { version: number; file_name: string; distance_km: number; elevation_m: number | null };
  activity: {
    file_name: string;
    name?: string;
    source?: string;
    points_count: number;
    distance_km?: number;
    elevation_m?: number;
    moving_time_min?: number;
  };
  map?: {
    official_points: Array<[number, number]>;
    activity_points: Array<[number, number]>;
    checkpoints: MapCheckpoint[];
  };
  saved?: boolean;
};
type StravaActivity = {
  id: string;
  name: string;
  sportType: string;
  startDateLocal: string;
  distanceKm: number;
  elevationM: number;
  movingTimeMin: number;
  avgSpeed: number;
  avgHeartRate: number | null;
  avgWatts: number | null;
  trainer: boolean;
};
type StravaState = {
  configured: boolean;
  connected: boolean;
  athlete: { firstname?: string; lastname?: string } | null;
  activities: StravaActivity[];
  date?: string | null;
  error?: string;
};

const statusCopy = {
  validated: { title: "VALIDADA", detail: "A atividade atende aos critérios automáticos de homologação.", background: "#dff3e6", color: "#185c35" },
  manual_review: { title: "REVISÃO MANUAL", detail: "A atividade está próxima dos limites e deve ser conferida pela organização.", background: "#fff0cf", color: "#805100" },
  rejected: { title: "NÃO HOMOLOGADA", detail: "A atividade não corresponde suficientemente ao percurso oficial.", background: "#f8dddd", color: "#812d2d" },
};

function Check({ ok }: { ok: boolean }) {
  return <strong style={{ color: ok ? "#2a7b4b" : "#a13f32" }}>{ok ? "✓" : "✕"}</strong>;
}

function formatStageDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function ValidationPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageId, setStageId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tolerance, setTolerance] = useState(120);
  const [loading, setLoading] = useState(true);
  const [stravaLoading, setStravaLoading] = useState(false);
  const [strava, setStrava] = useState<StravaState | null>(null);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const selectedStage = useMemo(
    () => stages.find((stage) => stage.id === stageId) ?? null,
    [stageId, stages],
  );

  useEffect(() => {
    fetch("/api/admin/routes", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Falha ao carregar etapas.");
        setStages(payload.stages ?? []);
        setStageId(payload.stages?.[0]?.id ?? "");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Falha ao carregar etapas."))
      .finally(() => setLoading(false));
  }, []);

  async function loadStrava(date: string) {
    setStravaLoading(true);
    try {
      const response = await fetch(`/api/strava/activities?date=${encodeURIComponent(date)}`, { cache: "no-store" });
      const payload = (await response.json()) as StravaState;
      setStrava(payload);
    } catch {
      setStrava({ configured: false, connected: false, athlete: null, activities: [], error: "Falha ao consultar o Strava." });
    } finally {
      setStravaLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedStage) return;
    setResult(null);
    setMessage("");
    void loadStrava(selectedStage.stage_date);
  }, [selectedStage]);

  async function validateStrava(activityId: string) {
    if (!stageId) return;
    setValidating(true);
    setResult(null);
    setMessage("Buscando o traçado GPS no Strava e comparando com a rota oficial...");
    try {
      const response = await fetch("/api/admin/validate-strava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, activityId, toleranceM: tolerance }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Falha na validação pelo Strava.");
      setResult(payload);
      setMessage(payload.saved ? "Validação concluída e resultado salvo no Supabase." : "Validação concluída.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na validação pelo Strava.");
    } finally {
      setValidating(false);
    }
  }

  async function submitManual(event: FormEvent) {
    event.preventDefault();
    if (!stageId || !file) {
      setMessage("Selecione uma etapa e o GPX da atividade.");
      return;
    }

    setValidating(true);
    setResult(null);
    setMessage("Comparando o GPX com a rota oficial...");
    const formData = new FormData();
    formData.append("stageId", stageId);
    formData.append("file", file);
    formData.append("toleranceM", String(tolerance));

    try {
      const response = await fetch("/api/admin/validate-activity", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Falha na validação.");
      setResult(payload);
      setMessage("GPX validado. Este modo é a alternativa para quem não utiliza Strava.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na validação.");
    } finally {
      setValidating(false);
    }
  }

  const status = result ? statusCopy[result.report.status] : null;

  return (
    <main className="validation-page">
      <style>{`
        .validation-page{min-height:100vh;background:#0d100d;color:#f4eee4;padding:48px 20px;font-family:Arial,sans-serif}
        .validation-shell{max-width:1180px;margin:0 auto}.validation-grid{margin-top:36px;display:grid;grid-template-columns:minmax(330px,.9fr) minmax(0,1.25fr);gap:24px}
        .control-panel{border:1px solid #3a3d35;background:#171a16;padding:28px;align-self:start}.result-panel{border:1px solid #3a3d35;background:#f1e9dc;color:#161816;padding:28px;min-height:500px}
        .field{width:100%;padding:14px;background:#0d100d;color:white;border:1px solid #55594d}.strava-list{display:grid;gap:10px;margin-top:12px}.activity-card{border:1px solid #44493f;background:#222620;padding:15px}
        .activity-card strong,.activity-card span{display:block}.activity-card span{margin-top:6px;color:#b8bcb4;font-size:13px}.activity-card button,.primary-button{width:100%;margin-top:12px;padding:14px;background:#fc4c02;color:white;border:0;font-weight:900;cursor:pointer}
        .activity-card button:disabled,.primary-button:disabled{opacity:.55;cursor:not-allowed}.manual{margin-top:20px;border-top:1px solid #44493f;padding-top:18px}.manual summary{cursor:pointer;font-weight:800;color:#d9d3c8}
        .metric-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.checks{display:grid;gap:10px;margin-top:18px}.empty-result{min-height:410px;display:grid;place-items:center;text-align:center;color:#6c685f}
        @media(max-width:850px){.validation-grid{grid-template-columns:1fr}.metric-grid{grid-template-columns:1fr}.validation-page{padding:30px 14px}.control-panel,.result-panel{padding:22px}}
      `}</style>
      <div className="validation-shell">
        <p style={{ color: "#d47b2d", letterSpacing: 3, textTransform: "uppercase", fontWeight: 800 }}>Legends Core · Race Engine</p>
        <h1 style={{ fontSize: "clamp(38px, 6vw, 74px)", lineHeight: 0.95, margin: "12px 0 18px" }}>Validar atividade</h1>
        <p style={{ maxWidth: 780, color: "#bbb7ae", fontSize: 18 }}>
          O atleta conecta o Strava e o sistema mostra somente as atividades realizadas no dia da etapa. O traçado GPS é comparado diretamente com a versão oficial ativa.
        </p>

        <section className="validation-grid">
          <div className="control-panel">
            <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Etapa oficial</label>
            <select className="field" value={stageId} onChange={(event) => setStageId(event.target.value)} disabled={loading}>
              {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name} · {formatStageDate(stage.stage_date)}</option>)}
            </select>

            <label style={{ display: "block", margin: "22px 0 8px", fontWeight: 700 }}>Tolerância GPS: {tolerance} m</label>
            <input type="range" min={40} max={300} step={10} value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} style={{ width: "100%" }} />
            <p style={{ color: "#9b9e94", fontSize: 13, lineHeight: 1.5 }}>120 m é a tolerância inicial. Depois será calibrada com diferentes ciclocomputadores e condições de sinal.</p>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #44493f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <strong style={{ display: "block" }}>Atividades do dia</strong>
                  <span style={{ color: "#aaaFA7", fontSize: 13 }}>{selectedStage ? formatStageDate(selectedStage.stage_date) : "—"}</span>
                </div>
                {selectedStage && <button type="button" onClick={() => void loadStrava(selectedStage.stage_date)} style={{ background: "transparent", border: "1px solid #686d62", color: "white", padding: "9px 12px", cursor: "pointer" }}>Atualizar</button>}
              </div>

              {stravaLoading ? <p>Consultando o Strava...</p> : !strava?.configured ? (
                <p style={{ color: "#efb078" }}>A integração do Strava não está configurada neste ambiente.</p>
              ) : !strava.connected ? (
                <div style={{ marginTop: 14 }}>
                  <p>Conecte sua conta para carregar a atividade sem baixar arquivos.</p>
                  <a href="/api/strava/connect" style={{ display: "block", padding: 14, textAlign: "center", background: "#fc4c02", color: "white", fontWeight: 900, textDecoration: "none" }}>CONECTAR COM STRAVA</a>
                </div>
              ) : strava.activities.length === 0 ? (
                <p style={{ color: "#c9c4ba" }}>Nenhuma atividade de ciclismo encontrada na data desta etapa.</p>
              ) : (
                <div className="strava-list">
                  {strava.activities.map((activity) => (
                    <div className="activity-card" key={activity.id}>
                      <strong>{activity.name}</strong>
                      <span>{new Date(activity.startDateLocal).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {activity.distanceKm.toFixed(1)} km · {Math.round(activity.elevationM)} m+ · {Math.round(activity.movingTimeMin)} min</span>
                      <button type="button" disabled={validating} onClick={() => void validateStrava(activity.id)}>{validating ? "VALIDANDO..." : "VALIDAR ESTA ATIVIDADE"}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <details className="manual">
              <summary>Alternativa: enviar GPX manualmente</summary>
              <form onSubmit={submitManual} style={{ marginTop: 15 }}>
                <input className="field" type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                <button className="primary-button" type="submit" disabled={validating || !stageId || !file}>{validating ? "COMPARANDO..." : "VALIDAR GPX"}</button>
              </form>
            </details>

            {message && <p style={{ marginTop: 16, color: "#efb078", lineHeight: 1.5 }}>{message}</p>}
          </div>

          <div className="result-panel">
            {!result || !status ? (
              <div className="empty-result">
                <div><div style={{ fontSize: 54 }}>⌖</div><h2>Homologação automática</h2><p>Selecione a atividade do dia da etapa. O sistema buscará os pontos GPS diretamente no Strava.</p></div>
              </div>
            ) : (
              <>
                <div style={{ padding: 20, background: status.background, color: status.color, border: `1px solid ${status.color}` }}>
                  <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2 }}>RESULTADO AUTOMÁTICO</div>
                  <h2 style={{ fontSize: 34, margin: "8px 0" }}>{status.title}</h2>
                  <p style={{ margin: 0 }}>{status.detail}</p>
                </div>

                <div className="metric-grid">
                  <div style={{ border: "1px solid #c8bcaa", padding: 16 }}><small>COBERTURA</small><div style={{ fontSize: 34, fontWeight: 900 }}>{result.report.coverage_percent}%</div><span>{result.report.matched_route_km} de {result.report.route_distance_km} km</span></div>
                  <div style={{ border: "1px solid #c8bcaa", padding: 16 }}><small>CHECKPOINTS</small><div style={{ fontSize: 34, fontWeight: 900 }}>{result.report.checkpoints_hit}/{result.report.checkpoints_total}</div><span>confirmados</span></div>
                </div>

                <div className="checks">
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #d2c7b7", paddingBottom: 9 }}><span>Largada dentro da área</span><Check ok={result.report.start_ok} /></div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #d2c7b7", paddingBottom: 9 }}><span>Chegada dentro da área</span><Check ok={result.report.finish_ok} /></div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #d2c7b7", paddingBottom: 9 }}><span>Sentido do percurso</span><Check ok={result.report.direction_ok} /></div>
                </div>

                <h3 style={{ marginBottom: 8 }}>Laudo</h3>
                <ul style={{ paddingLeft: 20 }}>{result.report.notes.map((note) => <li key={note} style={{ marginBottom: 6 }}>{note}</li>)}</ul>

                <details style={{ marginTop: 18 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 800 }}>Ver checkpoints e distâncias</summary>
                  <div style={{ marginTop: 12, display: "grid", gap: 7 }}>
                    {result.report.checkpoint_results.map((checkpoint) => (
                      <div key={`${checkpoint.sequence}-${checkpoint.label}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid #d8cebf" }}>
                        <span><Check ok={checkpoint.hit} /> {checkpoint.label}</span><span>{checkpoint.nearest_distance_m} m</span>
                      </div>
                    ))}
                  </div>
                </details>

                <p style={{ marginTop: 20, fontSize: 13, color: "#6c685f" }}>
                  Rota oficial v{result.route.version}: {result.route.file_name} · atividade: {result.activity.file_name} ({result.activity.points_count} pontos GPS).{result.saved ? " Resultado armazenado no Supabase." : ""}
                </p>
              </>
            )}
          </div>
        </section>

        {result?.map && (
          <ValidationMap
            officialPoints={result.map.official_points}
            activityPoints={result.map.activity_points}
            checkpoints={result.map.checkpoints}
            toleranceM={result.report.tolerance_m}
          />
        )}
      </div>
    </main>
  );
}
