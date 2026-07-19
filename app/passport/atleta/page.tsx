"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const ValidationMap = dynamic(() => import("../organizacao/validacao/ValidationMap"), { ssr: false });

type Stage = { id:string; name:string; route_label:string|null; stage_date:string; distance_km:number|null; elevation_m:number|null; route_active:boolean; event_name?:string };
type Activity = { id:string; name:string; startDateLocal:string; distanceKm:number; elevationM:number; movingTimeMin:number };
type Submission = { id:string; stage_id:string; name:string; distance_km:number; elevation_m:number|null; created_at:string; validation:any };
type Dashboard = { athlete:{full_name:string;profile?:string}; stages:Stage[]; submissions:Submission[] };
type Result = { report:any; validation:{id:string;status:string}; activity:{database_id:string;file_name:string;points_count:number}; route:{version:number;file_name:string}; map:{official_points:[number,number][];activity_points:[number,number][];checkpoints:any[]} };

const statusText: Record<string,string> = { validated:"Homologada", review:"Em revisão", rejected:"Não homologada", pending:"Pendente" };

export default function AthletePassportPage() {
  const [dashboard,setDashboard]=useState<Dashboard|null>(null);
  const [stageId,setStageId]=useState("");
  const [activities,setActivities]=useState<Activity[]>([]);
  const [loadingActivities,setLoadingActivities]=useState(false);
  const [message,setMessage]=useState("");
  const [validating,setValidating]=useState(false);
  const [result,setResult]=useState<Result|null>(null);
  const [reviewNote,setReviewNote]=useState("");
  const [requesting,setRequesting]=useState(false);

  async function loadDashboard() {
    const response=await fetch("/api/athlete/dashboard",{cache:"no-store"});
    const payload=await response.json();
    if(!response.ok)throw new Error(payload.error??"Falha ao carregar o Passport.");
    setDashboard(payload); setStageId((current)=>current||payload.stages?.[0]?.id||"");
  }

  useEffect(()=>{loadDashboard().catch((error)=>setMessage(error.message));},[]);
  const stage=useMemo(()=>dashboard?.stages.find((item)=>item.id===stageId)??null,[dashboard,stageId]);
  const stageSubmission=useMemo(()=>dashboard?.submissions.find((item)=>item.stage_id===stageId)??null,[dashboard,stageId]);

  useEffect(()=>{
    if(!stage)return;
    setResult(null); setLoadingActivities(true); setMessage("");
    fetch(`/api/strava/activities?date=${encodeURIComponent(stage.stage_date)}`,{cache:"no-store"})
      .then(async(response)=>{const payload=await response.json();if(!response.ok)throw new Error(payload.error??"Falha ao consultar o Strava.");setActivities(payload.activities??[]);})
      .catch((error)=>setMessage(error.message)).finally(()=>setLoadingActivities(false));
  },[stage]);

  async function validate(activityId:string) {
    if(!stageId)return;
    setValidating(true);setMessage("Comparando sua atividade com o percurso oficial...");setResult(null);
    try{
      const response=await fetch("/api/admin/validate-strava",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stageId,activityId,toleranceM:120})});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error??"Falha na homologação.");
      setResult(payload);setMessage(payload.report.status==="validated"?"Atividade homologada automaticamente.":payload.report.status==="manual_review"?"Atividade enviada para revisão da organização.":"Atividade não homologada. Você pode solicitar revisão.");
      await loadDashboard();
    }catch(error){setMessage(error instanceof Error?error.message:"Falha na homologação.");}finally{setValidating(false);}
  }

  async function requestReview() {
    const activityId=result?.activity.database_id??stageSubmission?.id;if(!activityId)return;
    setRequesting(true);
    try{
      const response=await fetch("/api/athlete/request-review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({activityId,note:reviewNote})});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error??"Falha ao solicitar revisão.");
      setMessage("Sua solicitação entrou na fila da organização.");setReviewNote("");await loadDashboard();
    }catch(error){setMessage(error instanceof Error?error.message:"Falha ao solicitar revisão.");}finally{setRequesting(false);}
  }

  async function logout(){await fetch("/api/athlete/logout",{method:"POST"});window.location.href="/passport/acesso";}
  const submissions=dashboard?.submissions??[];
  const validatedCount=submissions.filter((item)=>item.validation?.status==="validated").length;

  return <main className="athlete-passport">
    <style>{`
      .athlete-passport{min-height:100vh;background:#0c0f0c;color:#f3eee5;font-family:Arial,sans-serif}.athlete-nav{min-height:76px;border-bottom:1px solid #34382f;display:flex;align-items:center;justify-content:space-between;padding:0 4vw;gap:20px}.athlete-nav img{width:165px}.athlete-actions{display:flex;gap:18px;align-items:center}.athlete-actions a,.athlete-actions button{color:#d9d5cd;background:transparent;border:0;text-decoration:none;text-transform:uppercase;font-size:12px;font-weight:800;cursor:pointer}.athlete-shell{width:min(1240px,92%);margin:auto;padding:48px 0 80px}.hero{display:grid;grid-template-columns:1.25fr .75fr;gap:35px;align-items:end}.kicker{color:#d47b2d;letter-spacing:.2em;text-transform:uppercase;font-size:12px;font-weight:900}.hero h1{font-size:clamp(45px,6vw,78px);line-height:.9;text-transform:uppercase;margin:14px 0}.hero p{color:#adb2aa;line-height:1.7}.metrics{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #3c4138}.metric{padding:20px;border-right:1px solid #3c4138}.metric:last-child{border:0}.metric strong{display:block;font-size:28px}.metric span{font-size:12px;color:#9da299}.workspace{display:grid;grid-template-columns:300px 1fr;gap:24px;margin-top:42px}.stage-list{display:grid;gap:10px;align-content:start}.stage-button{background:#171a16;color:#eee9e1;border:1px solid #353b33;padding:18px;text-align:left;cursor:pointer}.stage-button.active{border-color:#d47b2d;background:#22180f}.stage-button strong,.stage-button span{display:block}.stage-button span{font-size:12px;color:#9fa49c;margin-top:6px}.stage-panel{background:#eee5d8;color:#181a18;padding:30px}.stage-panel h2{font-size:38px;text-transform:uppercase;margin:6px 0}.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#cbbdad;margin:22px 0}.facts div{background:#e4dacb;padding:16px}.facts strong{display:block;font-size:22px}.activity-list{display:grid;gap:10px}.activity-card{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;border:1px solid #c9bdad;padding:16px}.activity-card span{display:block;color:#666b64;font-size:13px;margin-top:5px}.activity-card button,.review-box button{border:0;background:#e86619;color:#fff;padding:13px 16px;font-weight:900;cursor:pointer}.status-box{margin:20px 0;padding:18px;border:1px solid #c8bcaa;background:#f8f1e7}.status-box strong{font-size:20px}.message{padding:14px;background:#171a16;color:#efb078;margin-top:16px}.result-block{margin-top:24px}.result-head{padding:20px;background:#dfeee3;border:1px solid #3d7955;color:#1d5f38}.result-head.rejected{background:#f5dddd;border-color:#a24a42;color:#812f2d}.result-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}.result-grid div{border:1px solid #c7bcac;padding:14px}.result-grid strong{font-size:28px;display:block}.review-box{margin-top:18px;padding:18px;border:1px solid #c8bcaa}.review-box textarea{width:100%;box-sizing:border-box;min-height:90px;padding:12px;margin:10px 0;border:1px solid #b7aa98}.history{margin-top:46px}.history h2{text-transform:uppercase}.history-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.history-card{border:1px solid #353b33;background:#151815;padding:18px}.history-card span{display:block;color:#a6aba3;font-size:13px;margin-top:6px}.empty{color:#777c75;padding:20px 0}
      @media(max-width:850px){.hero,.workspace{grid-template-columns:1fr}.metrics,.facts,.history-grid{grid-template-columns:1fr}.metric{border-right:0;border-bottom:1px solid #3c4138}.activity-card{grid-template-columns:1fr}.athlete-nav{padding:16px 20px}.athlete-actions a{display:none}.stage-panel{padding:22px}}
    `}</style>
    <header className="athlete-nav"><a href="/"><img src="/legends-logo-official.png" alt="Legends" /></a><div className="athlete-actions"><span>{dashboard?.athlete.full_name??"Atleta"}</span><a href="/">Site</a><button onClick={logout}>Sair</button></div></header>
    <div className="athlete-shell">
      <section className="hero"><div><p className="kicker">Portal do atleta</p><h1>Legends Passport</h1><p>Selecione a etapa, escolha sua atividade do Strava e acompanhe a homologação.</p></div><div className="metrics"><div className="metric"><strong>{validatedCount}</strong><span>homologadas</span></div><div className="metric"><strong>{submissions.length}</strong><span>enviadas</span></div><div className="metric"><strong>{dashboard?.stages.length??0}</strong><span>etapas</span></div></div></section>
      <section className="workspace">
        <aside className="stage-list">{dashboard?.stages.map((item)=><button key={item.id} className={`stage-button ${stageId===item.id?"active":""}`} onClick={()=>setStageId(item.id)}><strong>{item.name}</strong><span>{item.route_label||item.event_name}</span><span>{statusText[dashboard.submissions.find((sub)=>sub.stage_id===item.id)?.validation?.status]||"Aguardando atividade"}</span></button>)}</aside>
        <section className="stage-panel">
          {!stage?<p>Carregando etapas...</p>:<><p className="kicker">{stage.name}</p><h2>{stage.route_label||"Percurso oficial"}</h2><div className="facts"><div><strong>{stage.distance_km??"—"} km</strong><span>distância</span></div><div><strong>{stage.elevation_m??"—"} m+</strong><span>elevação</span></div><div><strong>{new Date(`${stage.stage_date}T12:00:00`).toLocaleDateString("pt-BR")}</strong><span>data</span></div></div>
          {stageSubmission?.validation?<div className="status-box"><strong>{statusText[stageSubmission.validation.status]||stageSubmission.validation.status}</strong><p>Cobertura: {stageSubmission.validation.coverage_percent??"—"}% · Checkpoints: {stageSubmission.validation.checkpoints_passed??0}/{stageSubmission.validation.checkpoints_total??0}</p></div>:null}
          <h3>Atividades do dia</h3>{loadingActivities?<p>Consultando o Strava...</p>:activities.length?<div className="activity-list">{activities.map((activity)=><div className="activity-card" key={activity.id}><div><strong>{activity.name}</strong><span>{activity.distanceKm.toFixed(1)} km · {Math.round(activity.elevationM)} m+ · {Math.round(activity.movingTimeMin)} min</span></div><button disabled={validating||!stage.route_active} onClick={()=>validate(activity.id)}>{validating?"ANALISANDO...":"ENVIAR PARA HOMOLOGAÇÃO"}</button></div>)}</div>:<p className="empty">Nenhuma atividade de ciclismo encontrada nesta data.</p>}
          {message?<div className="message">{message}</div>:null}
          {result?<div className="result-block"><div className={`result-head ${result.report.status==="rejected"?"rejected":""}`}><strong>{result.report.status==="validated"?"ATIVIDADE HOMOLOGADA":result.report.status==="manual_review"?"EM REVISÃO":"NÃO HOMOLOGADA"}</strong></div><div className="result-grid"><div><small>COBERTURA</small><strong>{result.report.coverage_percent}%</strong></div><div><small>CHECKPOINTS</small><strong>{result.report.checkpoints_hit}/{result.report.checkpoints_total}</strong></div></div><ValidationMap officialPoints={result.map.official_points} activityPoints={result.map.activity_points} checkpoints={result.map.checkpoints} toleranceM={result.report.tolerance_m}/>{result.report.status==="rejected"?<div className="review-box"><strong>Discorda do resultado?</strong><p>Explique o ocorrido e envie para análise da organização.</p><textarea value={reviewNote} onChange={(event)=>setReviewNote(event.target.value)} placeholder="Ex.: falha do GPS, desvio orientado pela organização, interrupção da gravação..."/><button disabled={requesting} onClick={requestReview}>{requesting?"ENVIANDO...":"SOLICITAR REVISÃO"}</button></div>:null}</div>:null}</>}
        </section>
      </section>
      <section className="history"><p className="kicker">Seu histórico</p><h2>Atividades enviadas</h2>{submissions.length?<div className="history-grid">{submissions.map((item)=><article className="history-card" key={item.id}><strong>{item.name}</strong><span>{item.distance_km} km · {item.elevation_m??0} m+</span><span>Status: {statusText[item.validation?.status]||"Pendente"}</span><span>{new Date(item.created_at).toLocaleString("pt-BR")}</span></article>)}</div>:<p className="empty">Nenhuma atividade enviada ainda.</p>}</section>
    </div>
  </main>;
}
