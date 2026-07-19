"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type RouteVersion = {
  id: string;
  version: number;
  file_name: string;
  distance_km: number;
  elevation_m: number | null;
  is_active: boolean;
  valid_from: string;
  created_at: string;
  change_note: string | null;
};

type Stage = {
  id: string;
  name: string;
  route_label: string | null;
  stage_date: string;
  distance_km: number | null;
  elevation_m: number | null;
  events: { name: string } | { name: string }[] | null;
  routes: RouteVersion[];
};

export default function RouteManagerPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageId, setStageId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [checkpointCount, setCheckpointCount] = useState(5);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function loadStages() {
    setLoading(true);
    const response = await fetch("/api/admin/routes", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar as etapas.");
    setStages(payload.stages ?? []);
    setStageId((current) => current || payload.stages?.[0]?.id || "");
    setLoading(false);
  }

  useEffect(() => {
    loadStages().catch((error) => {
      setStatus(error instanceof Error ? error.message : "Erro ao carregar etapas.");
      setLoading(false);
    });
  }, []);

  const selectedStage = useMemo(
    () => stages.find((stage) => stage.id === stageId) ?? null,
    [stageId, stages],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!stageId || !file) {
      setStatus("Selecione uma etapa e um arquivo GPX.");
      return;
    }

    setUploading(true);
    setStatus("Validando e criando uma nova versão...");
    const formData = new FormData();
    formData.append("stageId", stageId);
    formData.append("file", file);
    formData.append("changeNote", changeNote);
    formData.append("checkpointCount", String(checkpointCount));

    try {
      const response = await fetch("/api/admin/routes", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Falha ao enviar o GPX.");
      setStatus(`Versão ${payload.route.version} ativada. ${payload.intermediate_checkpoints} checkpoints intermediários e ${payload.checkpoints} pontos totais criados.`);
      setFile(null);
      setChangeNote("");
      const input = document.getElementById("gpx-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadStages();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Falha ao enviar o GPX.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0d100d", color: "#f4eee4", padding: "48px 20px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <p style={{ color: "#d47b2d", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>
          Legends Core · Organização
        </p>
        <h1 style={{ fontSize: "clamp(34px, 6vw, 72px)", lineHeight: 0.95, margin: "12px 0 18px" }}>
          Percursos oficiais
        </h1>
        <p style={{ maxWidth: 760, color: "#bbb7ae", fontSize: 18 }}>
          Substitua o GPX sem mexer no GitHub. Cada envio cria uma nova versão, preserva o histórico e distribui os checkpoints iniciais.
        </p>

        <section style={{ marginTop: 36, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 0.8fr)", gap: 24 }}>
          <form onSubmit={submit} style={{ border: "1px solid #3a3d35", background: "#171a16", padding: 28 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Etapa</label>
            <select value={stageId} onChange={(event) => setStageId(event.target.value)} disabled={loading} style={{ width: "100%", padding: 14, background: "#0d100d", color: "white", border: "1px solid #55594d" }}>
              {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name} · {stage.stage_date}</option>)}
            </select>

            <label style={{ display: "block", margin: "22px 0 8px", fontWeight: 700 }}>Novo arquivo GPX</label>
            <input id="gpx-file" type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" onChange={(event) => setFile(event.target.files?.[0] ?? null)} style={{ width: "100%", padding: 14, border: "1px dashed #d47b2d", background: "#11130f", color: "white" }} />

            <label style={{ display: "block", margin: "22px 0 8px", fontWeight: 700 }}>Checkpoints intermediários</label>
            <input type="number" min={1} max={12} value={checkpointCount} onChange={(event) => setCheckpointCount(Number(event.target.value))} style={{ width: "100%", padding: 14, background: "#0d100d", color: "white", border: "1px solid #55594d" }} />
            <p style={{ color: "#9b9e94", fontSize: 13, lineHeight: 1.5 }}>O padrão recomendado é 5, além da largada e da chegada. Depois você poderá reposicioná-los no editor de checkpoints.</p>

            <label style={{ display: "block", margin: "22px 0 8px", fontWeight: 700 }}>Motivo da alteração</label>
            <textarea value={changeNote} onChange={(event) => setChangeNote(event.target.value)} placeholder="Ex.: desvio por obra, ajuste de segurança ou versão oficial final." rows={4} style={{ width: "100%", padding: 14, background: "#0d100d", color: "white", border: "1px solid #55594d", resize: "vertical" }} />

            <button type="submit" disabled={uploading || !stageId || !file} style={{ marginTop: 22, width: "100%", padding: 16, background: "#e86619", color: "white", border: 0, fontWeight: 800, fontSize: 16, cursor: "pointer", opacity: uploading ? 0.6 : 1 }}>
              {uploading ? "PROCESSANDO GPX..." : "CRIAR NOVA VERSÃO"}
            </button>
            {status && <p style={{ marginTop: 16, color: "#efb078" }}>{status}</p>}
          </form>

          <div style={{ border: "1px solid #3a3d35", background: "#f1e9dc", color: "#161816", padding: 28 }}>
            <p style={{ color: "#c36118", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Etapa selecionada</p>
            {selectedStage ? (
              <>
                <h2 style={{ fontSize: 30, margin: "10px 0" }}>{selectedStage.name}</h2>
                <p>{selectedStage.route_label || "Sem descrição"}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "20px 0" }}>
                  <div><strong>{selectedStage.distance_km ?? "—"} km</strong><br /><small>distância cadastrada</small></div>
                  <div><strong>{selectedStage.elevation_m ?? "—"} m+</strong><br /><small>elevação cadastrada</small></div>
                </div>
                <a href="/passport/organizacao/checkpoints" style={{ display: "block", margin: "16px 0 24px", padding: 13, background: "#171a16", color: "#fff", textAlign: "center", textDecoration: "none", fontWeight: 900 }}>EDITAR CHECKPOINTS E SEGMENTOS</a>
                <h3 style={{ marginTop: 26 }}>Histórico de versões</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {[...(selectedStage.routes ?? [])].sort((a, b) => b.version - a.version).map((route) => (
                    <div key={route.id} style={{ borderTop: "1px solid #c8bcaa", paddingTop: 12 }}>
                      <strong>v{route.version} · {route.file_name}</strong>
                      {route.is_active && <span style={{ marginLeft: 8, color: "#31734d", fontWeight: 800 }}>ATIVA</span>}
                      <div style={{ fontSize: 14, marginTop: 4 }}>{route.distance_km} km · {route.elevation_m ?? "—"} m+</div>
                      {route.change_note && <div style={{ fontSize: 13, marginTop: 4 }}>{route.change_note}</div>}
                    </div>
                  ))}
                  {!selectedStage.routes?.length && <p>Nenhuma versão enviada ainda.</p>}
                </div>
              </>
            ) : <p>{loading ? "Carregando..." : "Nenhuma etapa encontrada."}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
