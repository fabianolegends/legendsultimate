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
  passages?: Array<{
    checkpoint_id: string;
    elapsed_s: number;
    checkpoint?: { sequence: number; label: string; checkpoint_kind: string };
  }>;
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
  const [includeCheckpoints, setIncludeCheckpoints] = useState(false);
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
        .print-page{min-height:calc(100vh - 82px);background:#ece4d7;color:#151814;padding:36px 4vw 80px;font-family:Arial,sans-serif}.print-shell{max-width:1500px;margin:auto}.screen-title{display:flex;justify-content:space-between;align-items:end;gap:20px}.screen-title h1{font-size:clamp(38px,5vw,68px);line-height:.9;margin:8px 0;text-transform:uppercase}.kicker{color:#bf5e19;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.print-controls{display:grid;grid-template-columns:1fr 1fr 1fr auto auto;gap:10px;margin:26px 0}.print-controls select,.print-controls button{padding:14px;border:1px solid #59584f;background:#f7f1e8;color:#171917;font-weight:800}.print-controls button{background:#e86619;border-color:#e86619;color:white;cursor:pointer}.checkpoint-option{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid #59584f;background:#f7f1e8;font-weight:800;white-space:nowrap}.checkpoint-option input{width:18px;height:18px;accent-color:#e86619}.message{padding:14px;border:1px solid #a96e3a;color:#8b4819;margin:18px 0}.category-sheet{background:white;border:1px solid #b9b2a7;margin:22px 0;padding:26px}.document-head{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #e86619;padding-bottom:14px;margin-bottom:18px}.document-head h2{font-size:30px;margin:4px 0}.document-side{display:flex;align-items:flex-start;justify-content:flex-end;gap:18px}.document-logo{width:82px;height:auto;object-fit:contain}.document-meta{text-align:right;color:#555}.document-meta strong,.document-meta span{display:block}.result-table{width:100%;border-collapse:collapse}.result-table th,.result-table td{padding:9px 7px;border-bottom:1px solid #d2cdc5;text-align:left;vertical-align:top;font-size:12px}.result-table th{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#9a4d17}.position{font-size:18px;font-weight:900}.bib,.points{font-weight:900;color:#c65b14}.athlete strong,.athlete small,.penalty strong,.penalty small{display:block}.athlete small,.penalty small{color:#666;margin-top:4px}.penalty small{max-width:220px}.checkpoint-list{display:grid;grid-template-columns:repeat(9,minmax(42px,1fr));gap:3px;min-width:410px;white-space:nowrap}.checkpoint-time{border:1px solid #ccc;padding:4px 3px;min-width:0;text-align:center}.checkpoint-time strong,.checkpoint-time small{display:block}.checkpoint-time strong{font-size:10px;letter-spacing:-.03em}.checkpoint-time small{font-size:7px;color:#666;margin-bottom:2px}.stage-cell{min-width:88px}.stage-cell strong,.stage-cell small{display:block}.stage-cell strong{font-size:13px}.stage-cell small{font-size:10px;color:#c65b14;font-weight:900;margin-top:4px}.totals strong,.totals small{display:block}.totals small{color:#c65b14;font-weight:900;margin-top:4px}.empty{padding:50px;text-align:center;border:1px solid #aaa}.document-footer{display:flex;justify-content:space-between;margin-top:22px;padding-top:10px;border-top:1px solid #bbb;color:#666;font-size:10px}.official-badge{color:#18733d;font-weight:900}.provisional-badge{color:#a55819;font-weight:900}@media(max-width:850px){.print-controls{grid-template-columns:1fr}.document-head{display:block}.document-side{justify-content:space-between;margin-top:15px}.document-meta{text-align:left}.category-sheet{padding:14px;overflow:auto}}
        @media print{@page{size:A4 landscape;margin:8mm}html,body,.print-page,.print-shell{background:#fff!important;min-height:100%!important}.org-nav,.print-controls,.screen-title,.message{display:none!important}.print-page{padding:0;color:black}.print-shell{max-width:none}.category-sheet{background:#fff!important;border:0;margin:0;padding:0;break-after:page;page-break-after:always}.category-sheet:last-child{break-after:auto;page-break-after:auto}.result-table th,.result-table td{padding:5px 4px;font-size:9px}.document-head h2{font-size:22px}.document-logo{width:72px}.document-footer{position:relative}.penalty small{color:#333}.checkpoint-list{min-width:380px;gap:2px}.checkpoint-time{padding:3px 2px}.checkpoint-time strong{font-size:8px}.checkpoint-time small{font-size:6px}.stage-cell{min-width:72px}}
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
            <option value="overall">Classificação acumulada por etapas</option>
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
          <label
            className="checkpoint-option"
            style={{ visibility: view === "stage" ? "visible" : "hidden" }}
          >
            <input
              type="checkbox"
              checked={includeCheckpoints}
              onChange={(event) => setIncludeCheckpoints(event.target.checked)}
            />
            Incluir checkpoints
          </label>
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
                <div className="document-side">
                  <div className="document-meta">
                    <strong>
                      {view === "stage"
                        ? `Stage ${stage?.stage_number ?? "—"} · ${stage?.name ?? "Etapa"}`
                        : "Classificação acumulada até o momento"}
                    </strong>
                    <span>
                      {view === "stage" && stage?.results_published
                        ? "RESULTADO OFICIAL"
                        : "RESULTADO PROVISÓRIO"}
                    </span>
                  </div>
                  <img
                    className="document-logo"
                    src="/legends-logo-official.png"
                    alt="Legends Bike Race"
                  />
                </div>
              </header>
              {view === "stage" ? (
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Pos.</th>
                      <th>Nº</th>
                      <th>Atleta</th>
                      {includeCheckpoints ? <th>Checkpoints</th> : null}
                      <th>Tempo oficial</th>
                      <th>Penalidade e motivo</th>
                      <th>Tempo final</th>
                      <th>Pontos</th>
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
                        {includeCheckpoints ? (
                          <td>
                            <div className="checkpoint-list">
                              {row.passages?.filter(
                                (passage) =>
                                  passage.checkpoint?.checkpoint_kind !==
                                    "start" &&
                                  passage.checkpoint?.checkpoint_kind !==
                                    "finish",
                              ).length
                                ? row.passages
                                    .filter(
                                      (passage) =>
                                        passage.checkpoint?.checkpoint_kind !==
                                          "start" &&
                                        passage.checkpoint?.checkpoint_kind !==
                                          "finish",
                                    )
                                    .map((passage) => (
                                      <span
                                        className="checkpoint-time"
                                        key={passage.checkpoint_id}
                                      >
                                        <small>
                                          {passage.checkpoint?.label ?? "CP"}
                                        </small>
                                        <strong>
                                          {duration(passage.elapsed_s)}
                                        </strong>
                                      </span>
                                    ))
                                : "Sem passagens"}
                            </div>
                          </td>
                        ) : null}
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
                      {payload?.stages.map((currentStage) => (
                        <th key={currentStage.id}>
                          Stage {currentStage.stage_number}
                        </th>
                      ))}
                      <th>Penalidades</th>
                      <th>Acumulado</th>
                      <th>Classificação atual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rows as OverallResult[]).map((row) => {
                      const penalties = penaltiesFor(row);
                      const accumulatedTime = row.stage_results.reduce(
                        (total, result) => total + Number(result.final_time_s),
                        0,
                      );
                      return (
                        <tr key={row.registration_id ?? row.athlete_id}>
                          <td className="position">{row.overall_position}</td>
                          <td className="bib">{row.bib_number ?? "—"}</td>
                          <td className="athlete">
                            <strong>{row.full_name}</strong>
                          </td>
                          {payload?.stages.map((currentStage) => {
                            const result = row.stage_results.find(
                              (item) => item.stage_id === currentStage.id,
                            );
                            return (
                              <td className="stage-cell" key={currentStage.id}>
                                <strong>
                                  {duration(result?.final_time_s ?? 0)}
                                </strong>
                                <small>
                                  {result?.weighted_points ?? 0} pontos
                                </small>
                              </td>
                            );
                          })}
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
                          <td className="totals">
                            <strong>{duration(accumulatedTime)}</strong>
                            <small>{row.total_points} pontos</small>
                          </td>
                          <td className="position">
                            {row.overall_position}º
                            <small style={{ display: "block", fontSize: 9 }}>
                              {row.stages_completed}/
                              {payload?.stages.length ?? 0} etapas
                            </small>
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
