"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";

const ValidationMap = dynamic(() => import("../organizacao/validacao/ValidationMap"), { ssr: false });

type Stage = { id:string; event_id:string; name:string; route_label:string|null; stage_date:string; distance_km:number|null; elevation_m:number|null; route_active:boolean; event_name?:string };
type Activity = { id:string; name:string; startDateLocal:string; distanceKm:number; elevationM:number; movingTimeMin:number };
type Passage = { checkpoint_id?:string; sequence?:number; label?:string; checkpoint_kind?:string; passed?:boolean; passed_at?:string|null; elapsed_s?:number|null; nearest_distance_m?:number; checkpoint?:{sequence:number;label:string;checkpoint_kind:string} };
type SegmentResult = { elapsed_s:number; status:string; segment?:{name:string;segment_type:string} };
type Submission = { id:string; stage_id:string; name:string; distance_km:number; elevation_m:number|null; created_at:string; validation:any; passages?:Passage[]; segment_results?:SegmentResult[] };
type Registration = { id:string; event_id:string; bib_number?:string|null; full_name:string; email:string; category?:string|null; modality?:string|null; country_code?:string|null; city?:string|null; status:string; registration_code:string; stage_count?:number; event?:{id:string;slug:string;name:string;starts_on:string;ends_on:string;location?:string|null}|null };
type Dashboard = {
  athlete:{full_name:string;profile?:string;category?:string|null;bib_number?:string|null;modality?:string|null};
  registration?:Registration|null; registrations?:Registration[]; registration_required?:boolean; registration_module_ready?:boolean; open_test_mode?:boolean;
  stages:Stage[]; submissions:Submission[]; timing_configured?:boolean;
};
type Result = {
  report:any; validation:{id:string;status:string}; activity:{database_id:string;file_name:string;points_count:number};
  route:{version:number;file_name:string}; map:{official_points:[number,number][];activity_points:[number,number][];checkpoints:any[]};
  timing?:{configured:boolean;message?:string|null;passages:Passage[];segments:Array<{name:string;segment_type:string;completed:boolean;elapsed_s:number|null;start_passed_at?:string|null;finish_passed_at?:string|null}>};
};

const statusText: Record<string,string> = { validated:"Homologada", review:"Em revisão", rejected:"Não homologada", pending:"Pendente" };

function formatDuration(seconds?:number|null){
  if(seconds===null||seconds===undefined)return "—";
  const total=Math.max(0,Math.round(Number(seconds)));const hours=Math.floor(total/3600);const minutes=Math.floor((total%3600)/60);const remaining=total%60;
  return `${hours?`${String(hours).padStart(2,"0")}:`:""}${String(minutes).padStart(2,"0")}:${String(remaining).padStart(2,"0")}`;
}
function formatPassage(value?:string|null){return value?new Date(value).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"}):"—";}

function TimingPanel({passages,segments,message}:{passages:Passage[];segments:Array<any>;message?:string|null}){
  return <section className="timing-panel"><div className="timing-head"><div><small>CHECKPOINT ENGINE</small><h3>Horários de passagem</h3></div><span>{passages.filter((passage)=>passage.passed!==false&&(passage.passed_at||passage.checkpoint)).length} registros</span></div>
    {message?<p className="timing-message">{message}</p>:null}
    {passages.length?<div className="passage-list">{passages.map((passage,index)=>{const checkpoint=passage.checkpoint;const label=passage.label??checkpoint?.label??`CP ${index}`;return <div className="passage-row" key={`${passage.checkpoint_id??index}-${label}`}><div><strong>{label}</strong><span>{passage.checkpoint_kind==="start"||checkpoint?.checkpoint_kind==="start"?"Largada":passage.checkpoint_kind==="finish"||checkpoint?.checkpoint_kind==="finish"?"Chegada":"Checkpoint"}</span></div><div><strong>{formatPassage(passage.passed_at)}</strong><span>{formatDuration(passage.elapsed_s)}</span></div></div>;})}</div>:<p className="timing-empty">Nenhuma passagem cronometrada registrada.</p>}
    {segments.length?<><h4>Seus segmentos</h4><div className="athlete-segments">{segments.map((item,index)=>{const segment=item.segment??item;return <div key={`${segment?.name??index}-${index}`}><strong>{segment?.name??"Segmento"}</strong><span>{segment?.segment_type==="climb"?"Subida":segment?.segment_type==="sprint"?"Sprint":"Trecho especial"}</span><b>{item.completed===false?"Incompleto":formatDuration(item.elapsed_s)}</b></div>;})}</div></>:null}
  </section>;
}

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
  const [registrationCode,setRegistrationCode]=useState("");
  const [registrationEmail,setRegistrationEmail]=useState("");
  const [linking,setLinking]=useState(false);
  const [selectedEventId,setSelectedEventId]=useState("");
  const [showClaimForm,setShowClaimForm]=useState(false);

  async function loadDashboard(preferredEventId?:string) {
    const response=await fetch("/api/athlete/dashboard",{cache:"no-store"});
    const payload=await response.json();
    if(!response.ok)throw new Error(payload.error??"Falha ao carregar o Passport.");
    setDashboard(payload);
    const registrations=(payload.registrations??[]) as Registration[];
    const nextEventId=registrations.some(item=>item.event_id===(preferredEventId||selectedEventId))?(preferredEventId||selectedEventId):(registrations[0]?.event_id??payload.stages?.[0]?.event_id??"");
    setSelectedEventId(nextEventId);
    setStageId((current)=>payload.stages?.some((item:Stage)=>item.id===current&&item.event_id===nextEventId)?current:payload.stages?.find((item:Stage)=>item.event_id===nextEventId)?.id||"");
  }

  useEffect(()=>{
    try {
      const pending=window.localStorage.getItem("legends-pending-registration");
      if(pending){const parsed=JSON.parse(pending) as {code?:string;email?:string};setRegistrationCode(parsed.code??"");setRegistrationEmail(parsed.email??"");}
    } catch { window.localStorage.removeItem("legends-pending-registration"); }
    loadDashboard().catch((error)=>setMessage(error.message));
  },[]);
  const stage=useMemo(()=>dashboard?.stages.find((item)=>item.id===stageId)??null,[dashboard,stageId]);
  const stageSubmission=useMemo(()=>dashboard?.submissions.find((item)=>item.stage_id===stageId)??null,[dashboard,stageId]);

  useEffect(()=>{
    if(!stage){setActivities([]);return;}
    setResult(null);setLoadingActivities(true);setMessage("");
    fetch(`/api/ridewithgps/trips?date=${encodeURIComponent(stage.stage_date)}`,{cache:"no-store"})
      .then(async(response)=>{const payload=await response.json();if(!response.ok)throw new Error(payload.error??"Falha ao consultar o Ride with GPS.");setActivities(payload.activities??[]);})
      .catch((error)=>setMessage(error.message)).finally(()=>setLoadingActivities(false));
  },[stage]);

  async function claimRegistration(event:FormEvent){
    event.preventDefault();setLinking(true);setMessage("Vinculando sua inscrição à conta Ride with GPS...");
    try{
      const response=await fetch("/api/athlete/claim-registration",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:registrationCode,email:registrationEmail})});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error??"Falha ao vincular a inscrição.");
      setMessage("Evento vinculado ao seu Passport.");setRegistrationCode("");setRegistrationEmail("");setShowClaimForm(false);window.localStorage.removeItem("legends-pending-registration");await loadDashboard(payload.registration?.event_id);
    }catch(error){setMessage(error instanceof Error?error.message:"Falha ao vincular a inscrição.");}finally{setLinking(false);}
  }

  async function validate(activityId:string) {
    if(!stageId)return;
    setValidating(true);setMessage("Comparando sua atividade com o percurso oficial e calculando as passagens...");setResult(null);
    try{
      const response=await fetch("/api/athlete/validate-ridewithgps",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stageId,tripId:activityId,toleranceM:120})});
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
  async function disconnect(){
    if(!window.confirm("Desconectar o Ride with GPS deste dispositivo? Você poderá conectar novamente quando quiser."))return;
    const response=await fetch("/api/athlete/disconnect",{method:"POST"});
    const payload=await response.json();
    if(!response.ok){setMessage(payload.error??"Não foi possível desconectar a conta.");return;}
    window.location.href="/passport/acesso";
  }
  const registrations=dashboard?.registrations??[];
  const activeRegistration=registrations.find(item=>item.event_id===selectedEventId)??registrations[0]??dashboard?.registration??null;
  const visibleStages=(dashboard?.stages??[]).filter(item=>!selectedEventId||item.event_id===selectedEventId);
  const visibleStageIds=new Set(visibleStages.map(item=>item.id));
  const submissions=(dashboard?.submissions??[]).filter(item=>visibleStageIds.has(item.stage_id));
  const validatedCount=submissions.filter((item)=>item.validation?.status==="validated").length;
  const modality=activeRegistration?.modality==="experience"?"Legends Experience":"Legends Gravel Race";

  function chooseEvent(eventId:string){setSelectedEventId(eventId);setStageId(dashboard?.stages.find(item=>item.event_id===eventId)?.id??"");setResult(null);setMessage("");}
  const stageStatus = (id:string) => dashboard?.submissions.find((item)=>item.stage_id===id)?.validation?.status ?? "waiting";
  const selectedStatus = stage ? stageStatus(stage.id) : "waiting";

  return <main className="athlete-passport"><style>{`
    .athlete-passport{min-height:100vh;background:#0c0f0c;color:#f3eee5;font-family:Arial,sans-serif}.athlete-nav{min-height:72px;border-bottom:1px solid #34382f;display:flex;align-items:center;justify-content:space-between;padding:0 4vw;gap:20px;position:sticky;top:0;z-index:1000;background:rgba(12,15,12,.96);backdrop-filter:blur(10px)}.athlete-nav img{width:145px}.athlete-actions{display:flex;gap:16px;align-items:center}.athlete-actions span{font-size:12px}.athlete-actions a,.athlete-actions button{color:#bbbfb7;background:transparent;border:0;text-decoration:none;text-transform:uppercase;font-size:10px;font-weight:900;cursor:pointer}.athlete-shell{width:min(1180px,92%);margin:auto;padding:38px 0 80px}.kicker{margin:0;color:#d47b2d;letter-spacing:.2em;text-transform:uppercase;font-size:10px;font-weight:900}.passport-head{display:flex;justify-content:space-between;align-items:end;gap:30px}.passport-head h1{font-size:clamp(34px,5vw,58px);line-height:.95;text-transform:uppercase;margin:10px 0 0;font-weight:500}.passport-head p{max-width:520px;margin:0;color:#9da39b;line-height:1.55}.event-control{display:grid;grid-template-columns:1fr auto;gap:12px;margin-top:28px;padding:18px;border:1px solid #393e36;background:#141714}.event-field{display:grid;gap:6px}.event-field label{font-size:9px;color:#8e948c;text-transform:uppercase;font-weight:900;letter-spacing:.12em}.event-field select{width:100%;padding:13px 38px 13px 14px;background:#0d100d;border:1px solid #474d44;color:#fff;font-size:14px}.add-event{padding:0 18px;border:1px solid #d47b2d;background:transparent;color:#ef9a59;font-weight:900;cursor:pointer}.passport-summary{display:grid;grid-template-columns:1.4fr repeat(3,1fr);margin-top:14px;border:1px solid #393e36;background:#141714}.summary-main,.summary-cell{padding:20px;border-right:1px solid #393e36}.summary-cell:last-child{border:0}.summary-main strong,.summary-main span,.summary-cell strong,.summary-cell span{display:block}.summary-main strong{font-size:17px}.summary-main span,.summary-cell span{color:#8e948c;font-size:11px;margin-top:6px}.summary-cell strong{font-size:24px}.summary-cell .connected{font-size:13px;color:#70c78d}.registration-bib{color:#e86619!important}.test-mode,.message{margin-top:16px;padding:14px;border:1px solid #76502d;background:#24190e;color:#efb078}.claim{max-width:760px;margin:30px auto 0;border:1px solid #d47b2d;background:#171a16;padding:30px}.claim h2{font-size:34px;text-transform:uppercase;margin:8px 0}.claim p{color:#aeb3ab;line-height:1.7}.claim-progress{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:28px}.claim-step{display:flex;gap:12px;align-items:center;border:1px solid #343a32;padding:13px;color:#aeb3ab}.claim-step b{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#2e342d;color:#fff;flex:0 0 auto}.claim-step strong,.claim-step span{display:block}.claim-step span{font-size:12px;margin-top:2px}.claim-step.done{border-color:#3d7955;color:#dce8df}.claim-step.done b{background:#3d7955}.claim-step.current{border-color:#d47b2d;color:#fff}.claim-step.current b{background:#d47b2d}.claim-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.claim-field{display:grid;gap:7px;min-width:0}.claim-field label{font-size:12px;font-weight:800;color:#d8d4cc}.claim input{width:100%;min-width:0;box-sizing:border-box;padding:14px;background:#0d100d;border:1px solid #545a50;color:#fff;font-size:16px}.claim button{grid-column:1/-1;padding:15px;border:0;background:#e86619;color:#fff;font-weight:900;cursor:pointer}.claim button:disabled{opacity:.65}.claim .cancel-link{background:transparent;border:1px solid #555;color:#ddd}.claim-help{grid-column:1/-1;margin:0!important;font-size:12px}.stage-title{margin:42px 0 14px;display:flex;justify-content:space-between;align-items:end}.stage-title h2{margin:7px 0 0;text-transform:uppercase;font-size:22px}.stage-title span{font-size:12px;color:#8e948c}.stage-list{display:flex;gap:0;overflow:auto;border:1px solid #393e36}.stage-button{position:relative;min-width:210px;flex:1;background:#141714;color:#eee9e1;border:0;border-right:1px solid #393e36;padding:18px;text-align:left;cursor:pointer}.stage-button:last-child{border-right:0}.stage-button.active{background:#24190f}.stage-button.active:before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:#e86619}.stage-number{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;border:1px solid #555c52;color:#aab0a7;font-size:10px;margin-bottom:13px}.stage-button strong,.stage-button span{display:block}.stage-button span{font-size:11px;color:#8e948c;margin-top:5px}.stage-state{margin-top:11px!important;text-transform:uppercase;font-weight:900;color:#d5d7d2!important}.stage-state.validated{color:#70c78d!important}.stage-state.review{color:#efaa69!important}.stage-state.rejected{color:#ef7c67!important}.stage-panel{margin-top:18px;background:#eee5d8;color:#181a18;padding:32px}.stage-top{display:flex;justify-content:space-between;align-items:start;gap:20px}.stage-panel h2{font-size:clamp(28px,4vw,42px);text-transform:uppercase;margin:6px 0}.stage-date{padding:9px 12px;border:1px solid #baad9c;font-size:12px;font-weight:900}.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#cbbdad;margin:22px 0}.facts div{background:#e4dacb;padding:16px}.facts strong{display:block;font-size:22px}.facts span{font-size:11px;color:#666b64}.activity-list{display:grid;gap:10px}.activity-card{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;border:1px solid #c9bdad;padding:16px}.activity-card span{display:block;color:#666b64;font-size:13px;margin-top:5px}.activity-card button,.review-box button{border:0;background:#e86619;color:#fff;padding:13px 16px;font-weight:900;cursor:pointer}.activity-card button:disabled{opacity:.55}.status-box{margin:20px 0;padding:18px;border:1px solid #8eb29a;background:#e2ede5}.status-box strong{font-size:20px;color:#23623b}.status-box.review{border-color:#d2a36e;background:#f2e5d4}.status-box.rejected{border-color:#c88780;background:#f5dddd}.result-block{margin-top:24px}.result-head{padding:20px;background:#dfeee3;border:1px solid #3d7955;color:#1d5f38}.result-head.rejected{background:#f5dddd;border-color:#a24a42;color:#812f2d}.result-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}.result-grid div{border:1px solid #c7bcac;padding:14px}.result-grid strong{font-size:28px;display:block}.review-box{margin-top:18px;padding:18px;border:1px solid #c8bcaa}.review-box textarea{width:100%;box-sizing:border-box;min-height:90px;padding:12px;margin:10px 0;border:1px solid #b7aa98}.timing-panel{margin-top:20px;border:1px solid #c8bcaa;background:#fff9f0;padding:18px}.timing-head{display:flex;justify-content:space-between;gap:20px}.timing-head small{color:#c15f17;font-weight:900}.passage-row{display:flex;justify-content:space-between;gap:20px;border-top:1px solid #d5cabb;padding:11px 0}.passage-row>div:last-child{text-align:right}.passage-row strong,.passage-row span{display:block}.passage-row span{font-size:12px;color:#746f67}.athlete-segments{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.athlete-segments>div{border:1px solid #d3c7b7;padding:13px}.athlete-segments strong,.athlete-segments span,.athlete-segments b{display:block}.athlete-segments b{font-size:22px;color:#c15f17}.history{margin-top:42px}.history h2{text-transform:uppercase;font-size:22px}.history-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.history-card{border:1px solid #353b33;background:#151815;padding:18px}.history-card span{display:block;color:#a6aba3;font-size:12px;margin-top:6px}.empty{color:#777c75;padding:20px 0}
    @media(max-width:850px){.athlete-nav{padding:0 18px}.athlete-nav img{width:125px}.athlete-actions>span,.athlete-actions a,.athlete-actions button:first-of-type{display:none}.athlete-shell{padding-top:26px}.passport-head{display:block}.passport-head p{margin-top:14px}.event-control{grid-template-columns:1fr}.add-event{padding:13px}.passport-summary{grid-template-columns:1fr 1fr}.summary-main{grid-column:1/-1}.summary-main,.summary-cell{border-bottom:1px solid #393e36}.stage-title{display:block}.stage-title span{display:block;margin-top:6px}.stage-panel{padding:22px 18px}.stage-top{display:block}.stage-date{display:inline-block;margin-top:10px}.facts,.history-grid,.athlete-segments,.claim-grid{grid-template-columns:1fr}.activity-card{grid-template-columns:1fr}.claim button{grid-column:auto}.claim-progress{grid-template-columns:1fr}.claim{padding:24px 20px}.claim-help{grid-column:auto}}
  `}</style>
    <header className="athlete-nav"><a href="/"><img src="/legends-logo-official.png" alt="Legends" /></a><div className="athlete-actions"><span>{dashboard?.athlete.full_name??"Atleta"}</span><a href="/">Site</a><button onClick={disconnect}>Desconectar Ride</button><button onClick={logout}>Sair</button></div></header>
    <div className="athlete-shell">
      <section className="passport-head"><div><p className="kicker">Legends Passport</p><h1>Olá, {dashboard?.athlete.full_name?.split(" ")[0] ?? "atleta"}</h1></div><p>Acompanhe sua inscrição e envie a atividade certa para cada etapa. O Passport organiza toda a sua temporada em um só lugar.</p></section>
      {registrations.length?<section className="event-control"><div className="event-field"><label>Evento selecionado · {registrations.length} no Passport</label><select value={selectedEventId} onChange={(event)=>chooseEvent(event.target.value)}>{registrations.map(item=><option value={item.event_id} key={item.id}>{item.event?.name??"Evento Legends"} · {item.stage_count??0} etapa(s)</option>)}</select></div><button className="add-event" onClick={()=>setShowClaimForm(true)}>+ Adicionar evento</button></section>:null}
      {activeRegistration?<section className="passport-summary"><div className="summary-main"><p className="kicker">Inscrição confirmada</p><strong>{activeRegistration.event?.name??"Evento Legends"}</strong><span>{activeRegistration.category??"Categoria não definida"} · {modality}</span></div><div className="summary-cell"><span>Número</span><strong className="registration-bib">{activeRegistration.bib_number??"—"}</strong></div><div className="summary-cell"><span>Progresso</span><strong>{validatedCount}/{visibleStages.length}</strong></div><div className="summary-cell"><span>Ride with GPS</span><strong className="connected">✓ Conectado</strong></div></section>:null}
      {dashboard?.open_test_mode?<div className="test-mode">Modo de teste: este evento ainda não possui inscritos cadastrados. O Passport permanece aberto até a primeira inscrição ser incluída.</div>:null}
      {message?<div className="message">{message}</div>:null}
      {(dashboard?.registration_required||showClaimForm)?<form className="claim" onSubmit={claimRegistration}><div className="claim-progress" aria-label="Progresso de acesso"><div className="claim-step done"><b>✓</b><div><strong>Ride with GPS conectado</strong><span>Uma conta para todos os seus eventos</span></div></div><div className="claim-step current"><b>{registrations.length+1}</b><div><strong>Vincular evento</strong><span>Adicione outra inscrição ao Passport</span></div></div></div><p className="kicker">{registrations.length?"Adicionar outro evento":"Passo 2 de 2 · Vincular inscrição"}</p><h2>{registrations.length?"Vincule outro evento":"Libere seu Passport"}</h2><p>Use o código recebido na inscrição. Cada evento possui um código próprio, mas todos ficam na mesma conta Ride with GPS.</p><div className="claim-grid"><div className="claim-field"><label htmlFor="registration-code">Código da inscrição</label><input id="registration-code" name="registration-code" required autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="Ex.: LEG-12AB34CD" value={registrationCode} onChange={(event)=>setRegistrationCode(event.target.value.toUpperCase().trimStart())}/></div><div className="claim-field"><label htmlFor="registration-email">E-mail da inscrição (opcional)</label><input id="registration-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="nome@exemplo.com" value={registrationEmail} onChange={(event)=>setRegistrationEmail(event.target.value)}/></div><p className="claim-help">O e-mail ajuda a confirmar sua identidade quando solicitado pela organização.</p><button disabled={linking}>{linking?"VINCULANDO...":"VINCULAR EVENTO AO PASSPORT"}</button>{!dashboard?.registration_required?<button type="button" className="cancel-link" onClick={()=>setShowClaimForm(false)}>Cancelar</button>:null}</div></form>:null}
      {!dashboard?.registration_required&&!showClaimForm?<><section className="stage-title"><div><p className="kicker">Minha jornada</p><h2>Etapas do evento</h2></div><span>Selecione uma etapa para ver os detalhes</span></section><nav className="stage-list">{visibleStages.map((item,index)=>{const itemStatus=stageStatus(item.id);return <button key={item.id} className={`stage-button ${stageId===item.id?"active":""}`} onClick={()=>setStageId(item.id)}><span className="stage-number">{index+1}</span><strong>{item.name}</strong><span>{item.route_label||item.event_name}</span><span className={`stage-state ${itemStatus}`}>{statusText[itemStatus]||"Aguardando atividade"}</span></button>;})}</nav><section className="stage-panel">
        {!stage?<p>Carregando etapas...</p>:<><div className="stage-top"><div><p className="kicker">{stage.name}</p><h2>{stage.route_label||"Percurso oficial"}</h2></div><span className="stage-date">{new Date(`${stage.stage_date}T12:00:00`).toLocaleDateString("pt-BR")}</span></div><div className="facts"><div><strong>{stage.distance_km??"—"} km</strong><span>distância</span></div><div><strong>{stage.elevation_m??"—"} m+</strong><span>elevação</span></div><div><strong>{stage.route_active?"Disponível":"Aguardando"}</strong><span>percurso oficial</span></div></div>
        {stageSubmission?.validation?<div className={`status-box ${selectedStatus}`}><strong>{statusText[stageSubmission.validation.status]||stageSubmission.validation.status}</strong><p>Cobertura: {stageSubmission.validation.coverage_percent??"—"}% · Checkpoints: {stageSubmission.validation.checkpoints_passed??0}/{stageSubmission.validation.checkpoints_total??0}</p></div>:null}
        {stageSubmission&&(stageSubmission.passages?.length||stageSubmission.segment_results?.length)?<TimingPanel passages={stageSubmission.passages??[]} segments={stageSubmission.segment_results??[]} />:null}
        <h3>Atividades do dia</h3>{loadingActivities?<p>Consultando o Ride with GPS...</p>:activities.length?<div className="activity-list">{activities.map((activity)=><div className="activity-card" key={activity.id}><div><strong>{activity.name}</strong><span>{activity.distanceKm.toFixed(1)} km · {Math.round(activity.elevationM)} m+ · {Math.round(activity.movingTimeMin)} min</span></div><button disabled={validating||!stage.route_active} onClick={()=>validate(activity.id)}>{validating?"ANALISANDO...":"ENVIAR PARA HOMOLOGAÇÃO"}</button></div>)}</div>:<p className="empty">Nenhuma atividade de ciclismo encontrada nesta data.</p>}
        {result?<div className="result-block"><div className={`result-head ${result.report.status==="rejected"?"rejected":""}`}><strong>{result.report.status==="validated"?"ATIVIDADE HOMOLOGADA":result.report.status==="manual_review"?"EM REVISÃO":"NÃO HOMOLOGADA"}</strong></div><div className="result-grid"><div><small>COBERTURA</small><strong>{result.report.coverage_percent}%</strong></div><div><small>CHECKPOINTS</small><strong>{result.report.checkpoints_hit}/{result.report.checkpoints_total}</strong></div></div><ValidationMap officialPoints={result.map.official_points} activityPoints={result.map.activity_points} checkpoints={result.map.checkpoints} toleranceM={result.report.tolerance_m}/>{result.timing?<TimingPanel passages={result.timing.passages??[]} segments={result.timing.segments??[]} message={result.timing.message}/>:null}{result.report.status==="rejected"?<div className="review-box"><strong>Discorda do resultado?</strong><p>Explique o ocorrido e envie para análise da organização.</p><textarea value={reviewNote} onChange={(event)=>setReviewNote(event.target.value)} placeholder="Ex.: falha do GPS, desvio orientado pela organização, interrupção da gravação..."/><button disabled={requesting} onClick={requestReview}>{requesting?"ENVIANDO...":"SOLICITAR REVISÃO"}</button></div>:null}</div>:null}</>}
      </section></>:null}
      {!showClaimForm&&!dashboard?.registration_required?<section className="history"><p className="kicker">Seu histórico neste evento</p><h2>Atividades enviadas</h2>{submissions.length?<div className="history-grid">{submissions.map((item)=><article className="history-card" key={item.id}><strong>{item.name}</strong><span>{item.distance_km} km · {item.elevation_m??0} m+</span><span>Status: {statusText[item.validation?.status]||"Pendente"}</span><span>{item.passages?.length??0} passagens · {item.segment_results?.length??0} segmentos</span><span>{new Date(item.created_at).toLocaleString("pt-BR")}</span></article>)}</div>:<p className="empty">Nenhuma atividade enviada neste evento.</p>}</section>:null}
    </div>
  </main>;
}
