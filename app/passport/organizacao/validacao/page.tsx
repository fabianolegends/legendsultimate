"use client";

import { FormEvent, useEffect, useState } from "react";

type Stage = { id: string; name: string; stage_date: string };
type CheckpointResult = {
  id?: string;
  sequence: number;
  label: string;
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
  activity: { file_name: string; points_count: number };
};

const statusCopy = {
  validated: { title: "VALIDADA", detail: "A atividade atende aos critérios automáticos de homologação.", background: "#dff3e6", color: "#185c35" },
  manual_review: { title: "REVISÃO MANUAL", detail: "A atividade está próxima dos limites e deve ser conferida pela organização.", background: "#fff0cf", color: "#805100" },
  rejected: { title: "NÃO HOMOLOGADA", detail: "A atividade não corresponde suficientemente ao percurso oficial.", background: "#f8dddd", color: "#812d2d" },
};

function Check({ ok }: { ok: boolean }) {
  return <strong style={{ color: ok ? "#2a7b4b" : "#a13f32" }}>{ok ? "✓" : "✕"}</strong>;
}

export default function ValidationPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageId, setStageId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tolerance, setTolerance] = useState(120);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);

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

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!stageId || !file) {
      setMessage("Selecione uma etapa e o GPX da atividade.");
      return;
    }

    setValidating(true);
    setResult(null);
    setMessage("Comparando a atividade com a rota oficial...");

    const formData = new FormData();
    formData.append("stageId", stageId);
    formData.append("file", file);
    formData.append("toleranceM", String(tolerance));

    try {
      const response = await fetch("/api/admin/validate-activity", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Falha na validação.");
      setResult(payload);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na validação.");
    } finally {
      setValidating(false);
    }
  }

  const status = result ? statusCopy[result.report.status] : null;

  return (
    <main style={{ minHeight: "100vh", background: "#0d100d", color: "#f4eee4", padding: "48px 20px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <p style={{ color: "#d47b2d", letterSpacing: 3, textTransform: "uppercase", fontWeight: 800 }}>Legends Core · Race Engine</p>
        <h1 style={{ fontSize: "clamp(38px, 6vw, 74px)", lineHeight: 0.95, margin: "12px 0 18px" }}>Validar atividade</h1>
        <p style={{ maxWidth: 760, color: "#bbb7ae", fontSize: 18 }}>
          Envie o GPX realizado pelo atleta. O sistema compara a atividade com a versão oficial ativa, verifica cobertura, sentido, largada, chegada e checkpoints.
        </p>

        <section style={{ marginTop: 36, display: "grid", gridTemplateColumns: "minmax(300px, .8fr) minmax(0, 1.2fr)", gap: 24 }}>
          <form onSubmit={submit} style={{ border: "1px solid #3a3d35", background: "#171a16", padding: 28, alignSelf: "start" }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Etapa oficial</label>
            <select value={stageId} onChange={(event) => setStageId(event.target.value)} disabled={loading} style={{ width: "100%", padding: 14, background: "#0d100d", color: "white", border: "1px solid #55594d" }}>
              {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name} · {stage.stage_date}</option>)}
            </select>

            <label style={{ display: "block", margin: "22px 0 8px", fontWeight: 700 }}>GPX da atividade realizada</label>
            <input type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" onChange={(event) => setFile(event.target.files?.[0] ?? null)} style={{ width: "100%", padding: 14, border: "1px dashed #d47b2d", background: "#11130f", color: "white" }} />

            <label style={{ display: "block", margin: "22px 0 8px", fontWeight: 700 }}>Tolerância GPS: {tolerance} m</label>
            <input type="range" min={40} max={300} step={10} value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} style={{ width: "100%" }} />
            <p style={{ color: "#9b9e94", fontSize: 13, lineHeight: 1.5 }}>Para o primeiro teste, mantenha 120 m. Depois calibraremos o limite com atividades reais e diferentes aparelhos GPS.</p>

            <button type="submit" disabled={validating || !stageId || !file} style={{ marginTop: 18, width: "100%", padding: 16, background: "#e86619", color: "white", border: 0, fontWeight: 900, fontSize: 16, cursor: "pointer", opacity: validating ? 0.6 : 1 }}>
              {validating ? "COMPARANDO ROTAS..." : "VALIDAR ATIVIDADE"}
            </button>
            {message && <p style={{ marginTop: 16, color: "#efb078" }}>{message}</p>}
          </form>

          <div style={{ border: "1px solid #3a3d35", background: "#f1e9dc", color: "#161816", padding: 28, minHeight: 430 }}>
            {!result || !status ? (
              <div style={{ minHeight: 360, display: "grid", placeItems: "center", textAlign: "center", color: "#6c685f" }}>
                <div><div style={{ fontSize: 54 }}>⌖</div><h2>Primeiro teste do Race Engine</h2><p>Use o GPX da pedalada desta manhã, que também originou a rota oficial.</p></div>
              </div>
            ) : (
              <>
                <div style={{ padding: 20, background: status.background, color: status.color, border: `1px solid ${status.color}` }}>
                  <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2 }}>RESULTADO AUTOMÁTICO</div>
                  <h2 style={{ fontSize: 34, margin: "8px 0" }}>{status.title}</h2>
                  <p style={{ margin: 0 }}>{status.detail}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 18 }}>
                  <div style={{ border: "1px solid #c8bcaa", padding: 16 }}><small>COBERTURA</small><div style={{ fontSize: 34, fontWeight: 900 }}>{result.report.coverage_percent}%</div><span>{result.report.matched_route_km} de {result.report.route_distance_km} km</span></div>
                  <div style={{ border: "1px solid #c8bcaa", padding: 16 }}><small>CHECKPOINTS</small><div style={{ fontSize: 34, fontWeight: 900 }}>{result.report.checkpoints_hit}/{result.report.checkpoints_total}</div><span>confirmados</span></div>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
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

                <p style={{ marginTop: 20, fontSize: 13, color: "#6c685f" }}>Rota oficial v{result.route.version}: {result.route.file_name} · atividade: {result.activity.file_name} ({result.activity.points_count} pontos).</p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
