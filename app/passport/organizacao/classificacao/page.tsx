"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganizationEvent } from "../EventContext";

type EventRow = { id: string; name: string };
type Stage = { id: string; stage_number: number; name: string; classification_weight: number; time_limit_s: number | null; results_published: boolean };
type StageResult = {
  id: string; stage_id: string; full_name: string; bib_number: string | null; category: string; journey_format: string; official_time_s: number;
  manual_time_s: number | null; time_penalty_s: number; final_time_s: number; position: number | null;
  base_points: number; weighted_points: number; status: string; calculated_at: string; stage?: Stage | null;
  passages?: Array<{ checkpoint_id:string; elapsed_s:number; passed_at:string; checkpoint?:{ sequence:number; label:string; checkpoint_kind:string } }>;
};
type OverallResult = {
  athlete_id: string; full_name: string; bib_number: string | null; category: string; journey_format: string; overall_position: number;
  total_points: number; stages_completed: number; eligible_for_title: boolean;
  stage_results: Array<{ stage_id: string; stage_number: number; position: number | null; weighted_points: number; final_time_s: number }>;
};
type Payload = { module_ready: boolean; message?: string; event_id: string | null; events: EventRow[]; stages: Stage[]; results: StageResult[]; overall: OverallResult[] };

function duration(seconds?: number | null) {
  if (!seconds) return "—";
  const total = Math.round(Number(seconds)); const hours = Math.floor(total / 3600); const minutes = Math.floor((total % 3600) / 60); const rest = total % 60;
  return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(rest).padStart(2,"0")}`;
}
function statusLabel(status: string) {
  return status === "official" ? "OFICIAL" : status === "provisional" ? "PROVISÓRIO" : status === "review" ? "EM REVISÃO" : status === "dnf" ? "FORA DO LIMITE" : "DESCLASSIFICADO";
}

export default function OfficialClassificationPage() {
  const {activeEventId,setActiveEventId}=useOrganizationEvent();
  const [payload,setPayload]=useState<Payload|null>(null); const [eventId,setEventId]=useState(""); const [stageId,setStageId]=useState("");
  const [category,setCategory]=useState("all"); const [journeyFormat,setJourneyFormat]=useState("all"); const [view,setView]=useState<"stage"|"overall">("stage"); const [loading,setLoading]=useState(true); const [message,setMessage]=useState("");

  async function load(selectedEvent = eventId) {
    setLoading(true);
    try {
      const query = selectedEvent ? `?eventId=${encodeURIComponent(selectedEvent)}` : "";
      const response = await fetch(`/api/admin/classification${query}`,{cache:"no-store"}); const data = await response.json();
      if(!response.ok) throw new Error(data.error??"Falha ao carregar classificação.");
      setPayload(data); if(!selectedEvent&&data.event_id)setEventId(data.event_id); if(!stageId&&data.stages?.[0]?.id)setStageId(data.stages[0].id);
    } catch(error){setMessage(error instanceof Error?error.message:"Falha ao carregar classificação.");} finally{setLoading(false);}
  }
  useEffect(()=>{if(activeEventId&&activeEventId!==eventId)setEventId(activeEventId);},[activeEventId]);
  useEffect(()=>{if(eventId&&eventId!==payload?.event_id){setStageId("");setCategory("all");void load(eventId);}},[eventId,payload?.event_id]);

  async function recalculate(){
    if(!eventId)return;setLoading(true);setMessage("Recalculando resultados oficiais...");
    try{const response=await fetch("/api/admin/classification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId})});const data=await response.json();if(!response.ok)throw new Error(data.error??"Falha ao recalcular.");const missing=Number(data.excluded?.missing_passages??0);const unmatched=Number(data.excluded?.missing_registration??0);setMessage(`${data.recalculated} resultados recalculados.${missing?` ${missing} atividade(s) sem passagens válidas de largada e chegada.`:""}${unmatched?` ${unmatched} atividade(s) sem vínculo único com uma inscrição.`:""}`);await load(eventId);}catch(error){setMessage(error instanceof Error?error.message:"Falha ao recalcular.");setLoading(false);}
  }

  const stageResults=useMemo(()=>{const items=(payload?.results??[]).filter(item=>(!stageId||item.stage_id===stageId)&&(journeyFormat==="all"||item.journey_format===journeyFormat));return category==="all"?items:items.filter(item=>item.category===category);},[payload,stageId,category,journeyFormat]);
  const overallResults=useMemo(()=>{const items=(payload?.overall??[]).filter(item=>journeyFormat==="all"||item.journey_format===journeyFormat);return category==="all"?items:items.filter(item=>item.category===category);},[payload,category,journeyFormat]);
  const categories=useMemo(()=>[...new Set((view==="stage"?(payload?.results??[]):(payload?.overall??[])).map(item=>item.category))].sort(),[payload,view]);
  const selectedStage=payload?.stages.find(stage=>stage.id===stageId);
  const classificationStages=useMemo(()=>{
    const stages=payload?.stages??[];
    return journeyFormat==="short"?stages.filter(stage=>stage.stage_number>=3):stages;
  },[payload,journeyFormat]);
  const expectedStageCount=journeyFormat==="short"?2:journeyFormat==="ultimate"?4:classificationStages.length;
  const maximumPoints=useMemo(()=>Math.round(classificationStages.reduce((total,stage)=>total+100*Number(stage.classification_weight??1),0)),[classificationStages]);

  return <main className="classification-page"><style>{`
    .classification-page{min-height:calc(100vh - 72px);background:#0d100d;color:#f3eee5;padding:44px 4vw 80px;font-family:Arial,sans-serif}.classification-shell{width:min(1480px,100%);margin:auto}.kicker{color:#d47b2d;letter-spacing:.2em;text-transform:uppercase;font-size:12px;font-weight:900}.head{display:flex;justify-content:space-between;align-items:end;gap:28px}.head h1{font-size:clamp(42px,5.5vw,76px);line-height:.88;text-transform:uppercase;margin:14px 0}.head p{color:#aeb3ab;max-width:700px;line-height:1.7}.toolbar{display:grid;grid-template-columns:1.1fr 1fr 1fr 1fr auto;gap:10px;margin:30px 0 18px}.toolbar select,.recalculate{min-width:0;padding:14px;border:1px solid #51574e;background:#171a16;color:#fff}.recalculate{background:#e86619;border-color:#e86619;font-weight:900;cursor:pointer}.recalculate:disabled{opacity:.55}.view-switch{display:flex;gap:8px;margin-bottom:18px}.view-switch button{padding:11px 15px;border:1px solid #4b5048;background:transparent;color:#cbc8c0;font-weight:900;cursor:pointer}.view-switch button.active{background:#eee5d8;color:#171917;border-color:#eee5d8}.stage-facts{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #3b4038;margin-bottom:18px}.fact{padding:17px;border-right:1px solid #3b4038}.fact:last-child{border:0}.fact strong{display:block;font-size:25px}.fact span{font-size:11px;color:#9fa49c;text-transform:uppercase}.table-wrap{overflow:auto;border:1px solid #3b4038}.table{width:100%;border-collapse:collapse;min-width:1120px;background:#171a16}.table th,.table td{padding:14px 13px;border-bottom:1px solid #353a33;text-align:left}.table th{color:#d47b2d;background:#11140f;font-size:11px;letter-spacing:.1em;text-transform:uppercase}.position{font-size:25px;font-weight:900}.bib,.points{font-size:19px;font-weight:900;color:#e86619}.format{font-size:11px;font-weight:900;text-transform:uppercase;color:#efb078}.athlete strong,.athlete span{display:block}.athlete span,.muted{color:#979c94;font-size:12px;margin-top:4px}.status{font-size:11px;font-weight:900}.official{color:#71c58f}.provisional{color:#efb078}.review{color:#dfb14c}.dnf,.disqualified{color:#db6d64}.stages{display:flex;gap:6px}.stage-score{min-width:62px;padding:7px;border:1px solid #3d433a;text-align:center}.stage-score strong,.stage-score span{display:block}.stage-score span{color:#969b93;font-size:10px}.eligible{color:#71c58f;font-weight:900}.incomplete{color:#efb078;font-weight:900}.message,.migration{padding:14px;margin:14px 0;background:#241b12;border:1px solid #745027;color:#efb078}.empty{padding:44px;text-align:center;color:#9ca198;border:1px solid #3b4038;background:#171a16}@media(max-width:1100px){.toolbar{grid-template-columns:1fr 1fr 1fr}}@media(max-width:900px){.head{display:block}.toolbar{grid-template-columns:1fr 1fr}.stage-facts{grid-template-columns:1fr 1fr}}@media(max-width:600px){.classification-page{padding:28px 14px 60px}.toolbar{grid-template-columns:1fr}.stage-facts{grid-template-columns:1fr 1fr}.view-switch{display:grid;grid-template-columns:1fr 1fr}}
  `}</style><div className="classification-shell">
    <section className="head"><div><p className="kicker">Legends Core · Race Engine</p><h1>Classificação oficial</h1></div><p>O tempo entre largada e chegada define cada etapa. A pontuação ponderada das etapas define o campeão da Legends.</p></section>
    {!payload?.module_ready&&payload?.message?<div className="migration"><strong>Módulo aguardando banco de dados.</strong><br/>{payload.message}</div>:null}
    <section className="toolbar"><select value={eventId} onChange={event=>{setEventId(event.target.value);setActiveEventId(event.target.value);}}>{payload?.events.map(event=><option key={event.id} value={event.id}>{event.name}</option>)}</select><select value={stageId} onChange={event=>setStageId(event.target.value)} disabled={view==="overall"}><option value="">Todas as etapas</option>{payload?.stages.map(stage=><option key={stage.id} value={stage.id}>Stage {stage.stage_number} · {stage.name}</option>)}</select><select value={journeyFormat} onChange={event=>setJourneyFormat(event.target.value)}><option value="all">Ultimate + Short</option><option value="ultimate">Legends Ultimate</option><option value="short">Legends Short</option></select><select value={category} onChange={event=>setCategory(event.target.value)}><option value="all">Todas as categorias</option>{categories.map(item=><option key={item}>{item}</option>)}</select><button className="recalculate" disabled={loading||!payload?.module_ready} onClick={recalculate}>{loading?"PROCESSANDO...":"RECALCULAR"}</button></section>
    <div className="view-switch"><button className={view==="stage"?"active":""} onClick={()=>setView("stage")}>RESULTADOS POR ETAPA</button><button className={view==="overall"?"active":""} onClick={()=>setView("overall")}>CLASSIFICAÇÃO GERAL</button></div>
    {message?<div className="message">{message}</div>:null}
    {view==="stage"?<><section className="stage-facts"><div className="fact"><strong>{stageResults.length}</strong><span>atletas</span></div><div className="fact"><strong>{stageResults.filter(item=>item.status==="official"||item.status==="provisional").length}</strong><span>classificados</span></div><div className="fact"><strong>{selectedStage?Number(selectedStage.classification_weight).toFixed(2).replace(".",","):"—"}</strong><span>peso da etapa</span></div><div className="fact"><strong>{duration(selectedStage?.time_limit_s)}</strong><span>tempo limite</span></div></section>{stageResults.length?<div className="table-wrap"><table className="table"><thead><tr><th>Pos.</th><th>Nº</th><th>Atleta</th><th>Formato</th><th>Categoria</th><th>Passagens</th><th>Tempo oficial</th><th>Penalidade</th><th>Tempo final</th><th>Pontos</th><th>Status</th></tr></thead><tbody>{stageResults.map(item=><tr key={item.id}><td className="position">{item.position??"—"}</td><td className="bib">{item.bib_number??"—"}</td><td className="athlete"><strong>{item.full_name}</strong><span>{item.stage?.name}</span></td><td className="format">{item.journey_format==="short"?"Short":"Ultimate"}</td><td>{item.category}</td><td><div className="stages">{item.passages?.map(passage=><div className="stage-score" key={passage.checkpoint_id}><span>{passage.checkpoint?.label??"CP"}</span><strong>{duration(passage.elapsed_s)}</strong></div>)}</div></td><td>{duration(item.official_time_s)}</td><td>{item.time_penalty_s?`+ ${duration(item.time_penalty_s)}`:"—"}</td><td><strong>{duration(item.final_time_s)}</strong></td><td className="points">{Number(item.weighted_points)}</td><td><span className={`status ${item.status}`}>{statusLabel(item.status)}</span></td></tr>)}</tbody></table></div>:<div className="empty">Nenhum resultado calculado. Clique em “Recalcular” após homologar as atividades.</div>}</>:<><section className="stage-facts"><div className="fact"><strong>{overallResults.length}</strong><span>atletas na geral</span></div><div className="fact"><strong>{overallResults.filter(item=>item.eligible_for_title).length}</strong><span>elegíveis ao título</span></div><div className="fact"><strong>{expectedStageCount}</strong><span>etapas exigidas</span></div><div className="fact"><strong>{maximumPoints||"—"}</strong><span>pontos máximos</span></div></section>{overallResults.length?<div className="table-wrap"><table className="table"><thead><tr><th>Pos.</th><th>Nº</th><th>Atleta</th><th>Formato</th><th>Categoria</th><th>Etapas</th><th>Pontos por etapa</th><th>Total</th><th>Disputa geral</th></tr></thead><tbody>{overallResults.map(item=>{const itemStages=item.journey_format==="short"?(payload?.stages??[]).filter(stage=>stage.stage_number>=3):(payload?.stages??[]);return <tr key={`${item.journey_format}-${item.athlete_id}`}><td className="position">{item.overall_position}</td><td className="bib">{item.bib_number??"—"}</td><td className="athlete"><strong>{item.full_name}</strong></td><td className="format">{item.journey_format==="short"?"Short":"Ultimate"}</td><td>{item.category}</td><td>{item.stages_completed}/{item.journey_format==="short"?2:4}</td><td><div className="stages">{itemStages.map(stage=>{const result=item.stage_results.find(row=>row.stage_id===stage.id);return <div className="stage-score" key={stage.id}><span>S{stage.stage_number}</span><strong>{result?.weighted_points??"—"}</strong></div>})}</div></td><td className="points">{item.total_points}</td><td className={item.eligible_for_title?"eligible":"incomplete"}>{item.eligible_for_title?"ELEGÍVEL":"INCOMPLETO"}</td></tr>})}</tbody></table></div>:<div className="empty">A classificação geral aparecerá após o primeiro cálculo das etapas.</div>}</>}
  </div></main>;
}
