"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganizationEvent } from "../EventContext";

type Stage = {
  id: string;
  stage_number: number;
  name: string;
  results_published: boolean;
};

type StageResult = {
  id: string;
  athlete_id: string;
  registration_id: string | null;
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
  admin_note: string | null;
};

type OverallResult = {
  athlete_id: string;
  registration_id?: string | null;
  full_name: string;
  bib_number: string | null;
  category: string;
  overall_position: number;
  total_points: number;
  stages_completed: number;
  eligible_for_title: boolean;
  stage_results: Array<{
    stage_id: string;
    stage_number: number;
    position: number | null;
    weighted_points: number;
    final_time_s: number;
  }>;
};

type Payload = {
  module_ready: boolean;
  event_id: string | null;
  events: Array<{ id: string; name: string }>;
  stages: Stage[];
  results: StageResult[];
  overall: OverallResult[];
};

function duration(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const total = Math.max(0, Math.round(Number(value)));
  return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(
    Math.floor((total % 3600) / 60),
  ).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    official: "OFICIAL",
    provisional: "PROVISÓRIO",
    review: "EM REVISÃO",
    dnf: "DNF",
    disqualified: "DESCLASSIFICADO",
  };
  return labels[status] ?? status.toUpperCase();
}

function groupByCategory<T extends { category: string }>(rows: T[]) {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const current = groups.get(row.category) ?? [];
    current.push(row);
    groups.set(row.category, current);
  }
  return [...groups.entries()].sort(([left], [right]) =>
    left.localeCompare(right, "pt-BR"),
  );
}

export default function PrintResultsPage() {
  const { activeEventId, activeEvent } = useOrganizationEvent();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [stageId, setStageId] = useState("");
  const [view, setView] = useState<"stage" | "overall">("stage");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!activeEventId) {
      setPayload(null);
      return;
    }
    fetch(
      `/api/admin/classification?eventId=${encodeURIComponent(activeEventId)}`,
      {
        cache: "no-store",
      },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error ?? "Falha ao carregar resultados.");
        setPayload(data);
        setStageId((current) =>
          data.stages?.some((stage: Stage) => stage.id === current)
            ? current
            : (data.stages?.[0]?.id ?? ""),
        );
      })
      .catch((error) => setMessage(error.message));
  }, [activeEventId]);

  const categories = useMemo(
    () =>
      [
        ...new Set(
          (view === "stage" ? payload?.results : payload?.overall)?.map(
            (row) => row.category,
          ) ?? [],
        ),
      ].sort((left, right) => left.localeCompare(right, "pt-BR")),
    [payload, view],
  );
  const stage = payload?.stages.find((row) => row.id === stageId) ?? null;
  const stageRows = useMemo(
    () =>
      (payload?.results ?? []).filter(
        (row) =>
          row.stage_id === stageId &&
          (category === "all" || row.category === category),
      ),
    [payload, stageId, category],
  );
  const overallRows = useMemo(
    () =>
      (payload?.overall ?? []).filter(
        (row) => category === "all" || row.category === category,
      ),
    [payload, category],
  );
  const groups = useMemo(
    () =>
      groupByCategory<StageResult | OverallResult>(
        view === "stage" ? stageRows : overallRows,
      ),
    [view, stageRows, overallRows],
  );

  function penaltiesFor(row: OverallResult) {
    return (payload?.results ?? []).filter(
      (result) =>
        (row.registration_id
          ? result.registration_id === row.registration_id
          : result.athlete_id === row.athlete_id) &&
        (result.time_penalty_s > 0 || result.points_penalty > 0),
    );
  }

  return (
    <main className="print-page">
      <style>{`
        .print-page{min-height:calc(100vh - 82px);background:#ece4d7;color:#151814;padding:36px 4vw 80px;font-family:Arial,sans-serif}.print-shell{max-width:1500px;margin:auto}.screen-title{display:flex;justify-content:space-between;align-items:end;gap:20px}.screen-title h1{font-size:clamp(38px,5vw,68px);line-height:.9;margin:8px 0;text-transform:uppercase}.kicker{color:#bf5e19;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.print-controls{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;margin:26px 0}.print-controls select,.print-controls button{padding:14px;border:1px solid #59584f;background:#f7f1e8;color:#171917;font-weight:800}.print-controls button{background:#e86619;border-color:#e86619;color:white;cursor:pointer}.message{padding:14px;border:1px solid #a96e3a;color:#8b4819;margin:18px 0}.category-sheet{background:white;border:1px solid #b9b2a7;margin:22px 0;padding:26px}.document-head{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #e86619;padding-bottom:14px;margin-bottom:18px}.document-head h2{font-size:30px;margin:4px 0}.document-meta{text-align:right;color:#555}.document-meta strong,.document-meta span{display:block}.result-table{width:100%;border-collapse:collapse}.result-table th,.result-table td{padding:11px 9px;border-bottom:1px solid #d2cdc5;text-align:left;vertical-align:top}.result-table th{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#9a4d17}.position{font-size:20px;font-weight:900}.bib,.points{font-weight:900;color:#c65b14}.athlete strong,.athlete small,.penalty strong,.penalty small{display:block}.athlete small,.penalty small{color:#666;margin-top:4px}.penalty small{max-width:260px}.stage-points{white-space:nowrap}.stage-points span{display:inline-block;border:1px solid #ccc;padding:5px 7px;margin:0 3px 3px 0;font-size:11px}.empty{padding:50px;text-align:center;border:1px solid #aaa}.document-footer{display:flex;justify-content:space-between;margin-top:22px;padding-top:10px;border-top:1px solid #bbb;color:#666;font-size:10px}.official-badge{color:#18733d;font-weight:900}.provisional-badge{color:#a55819;font-weight:900}@media(max-width:850px){.print-controls{grid-template-columns:1fr}.document-head{display:block}.document-meta{text-align:left}.category-sheet{padding:14px;overflow:auto}}
        @media print{@page{size:A4 landscape;margin:10mm}.org-nav,.print-controls,.screen-title,.message{display:none!important}.print-page{background:white;padding:0;color:black}.print-shell{max-width:none}.category-sheet{border:0;margin:0;padding:0;break-after:page;page-break-after:always}.category-sheet:last-child{break-after:auto;page-break-after:auto}.result-table th,.result-table td{padding:7px 6px}.document-head h2{font-size:24px}.document-footer{position:relative}.penalty small{color:#333}}
      `}</style>
      <div className="print-shell">
        <header className="screen-title">
          <div>
            <p className="kicker">Legends Core · Documento esportivo</p>
            <h1>Impressão de resultados</h1>
          </div>
          <p>Escolha uma categoria ou imprima o resultado geral completo.</p>
        </header>
        <section className="print-controls">
          <select
            value={view}
            onChange={(event) => {
              setView(event.target.value as "stage" | "overall");
              setCategory("all");
            }}
          >
            <option value="stage">Resultado por etapa</option>
            <option value="overall">Classificação geral</option>
          </select>
          <select
            value={stageId}
            disabled={view === "overall"}
            onChange={(event) => setStageId(event.target.value)}
          >
            {payload?.stages.map((row) => (
              <option key={row.id} value={row.id}>
                Stage {row.stage_number} · {row.name}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">Impressão geral · todas as categorias</option>
            {categories.map((row) => (
              <option key={row} value={row}>
                Somente {row}
              </option>
            ))}
          </select>
          <button onClick={() => window.print()}>IMPRIMIR / SALVAR PDF</button>
        </section>
        {message ? <div className="message">{message}</div> : null}
        {!groups.length ? (
          <div className="empty">
            Nenhum resultado disponível para impressão.
          </div>
        ) : (
          groups.map(([groupName, rows]) => (
            <section className="category-sheet" key={groupName}>
              <header className="document-head">
                <div>
                  <p className="kicker">Legends Bike Race · Resultado</p>
                  <h2>{activeEvent?.name ?? "Evento"}</h2>
                  <strong>{groupName}</strong>
                </div>
                <div className="document-meta">
                  <strong>
                    {view === "stage"
                      ? `Stage ${stage?.stage_number ?? "—"} · ${stage?.name ?? "Etapa"}`
                      : "Classificação geral"}
                  </strong>
                  <span>
                    {view === "stage" && stage?.results_published
                      ? "RESULTADO OFICIAL"
                      : "RESULTADO PROVISÓRIO"}
                  </span>
                </div>
              </header>
              {view === "stage" ? (
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Pos.</th>
                      <th>Nº</th>
                      <th>Atleta</th>
                      <th>Tempo oficial</th>
                      <th>Penalidade e motivo</th>
                      <th>Tempo final</th>
                      <th>Pontos</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rows as StageResult[]).map((row) => (
                      <tr key={row.id}>
                        <td className="position">{row.position ?? "—"}</td>
                        <td className="bib">{row.bib_number ?? "—"}</td>
                        <td className="athlete">
                          <strong>{row.full_name}</strong>
                        </td>
                        <td>{duration(row.official_time_s)}</td>
                        <td className="penalty">
                          {row.time_penalty_s || row.points_penalty ? (
                            <>
                              <strong>
                                {row.time_penalty_s
                                  ? `+${duration(row.time_penalty_s)} tempo`
                                  : ""}
                                {row.time_penalty_s && row.points_penalty
                                  ? " · "
                                  : ""}
                                {row.points_penalty
                                  ? `-${row.points_penalty} ponto(s)`
                                  : ""}
                              </strong>
                              <small>
                                Motivo: {row.admin_note || "Não informado"}
                              </small>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{duration(row.final_time_s)}</td>
                        <td className="points">{row.weighted_points}</td>
                        <td>{statusLabel(row.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Pos.</th>
                      <th>Nº</th>
                      <th>Atleta</th>
                      <th>Etapas</th>
                      <th>Pontos por etapa</th>
                      <th>Penalidades</th>
                      <th>Total</th>
                      <th>Disputa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rows as OverallResult[]).map((row) => {
                      const penalties = penaltiesFor(row);
                      return (
                        <tr key={row.registration_id ?? row.athlete_id}>
                          <td className="position">{row.overall_position}</td>
                          <td className="bib">{row.bib_number ?? "—"}</td>
                          <td className="athlete">
                            <strong>{row.full_name}</strong>
                          </td>
                          <td>
                            {row.stages_completed}/{payload?.stages.length ?? 0}
                          </td>
                          <td className="stage-points">
                            {row.stage_results.map((result) => (
                              <span key={result.stage_id}>
                                S{result.stage_number}: {result.weighted_points}
                              </span>
                            ))}
                          </td>
                          <td className="penalty">
                            {penalties.length
                              ? penalties.map((result) => (
                                  <small key={result.id}>
                                    S
                                    {
                                      payload?.stages.find(
                                        (item) => item.id === result.stage_id,
                                      )?.stage_number
                                    }
                                    :{" "}
                                    {result.admin_note ||
                                      "Motivo não informado"}
                                  </small>
                                ))
                              : "—"}
                          </td>
                          <td className="points">{row.total_points}</td>
                          <td>
                            {row.eligible_for_title ? "ELEGÍVEL" : "INCOMPLETO"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <footer className="document-footer">
                <span>Categoria: {groupName}</span>
                <span>
                  Emitido em {new Date().toLocaleString("pt-BR")} · Legends Core
                </span>
              </footer>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
