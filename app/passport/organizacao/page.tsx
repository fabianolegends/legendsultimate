"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganizationEvent } from "./EventContext";

type ValidationSummary = { total:number; validated:number; review:number; rejected:number; pending:number };
type RegistrationSummary = { total:number; eligible:number; paid:number; payment_pending:number; refunded:number; cancelled:number; linked:number; last_sync:string|null };
type Item = { id:string; status:string; coverage_percent:number|null; athlete?:{full_name?:string}; stage?:{name?:string}; activity?:{name?:string;created_at?:string} };
type SyncStatus = { connections?:{active:number;error:number}; latest_run?:{errors_count:number;activities_imported:number;finished_at:string|null}|null };

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }) : "Ainda não executada";
}

export default function OrganizationDashboard() {
  const { activeEventId, activeEvent } = useOrganizationEvent();
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [registrationSummary, setRegistrationSummary] = useState<RegistrationSummary | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeEventId) { setSummary(null); setRegistrationSummary(null); setItems([]); return; }
    setError(""); setLoading(true);
    Promise.all([
      fetch(`/api/admin/reviews?eventId=${encodeURIComponent(activeEventId)}`, { cache:"no-store" }).then(async r => { const p=await r.json(); if(!r.ok) throw new Error(p.error); return p; }),
      fetch(`/api/admin/registrations?eventId=${encodeURIComponent(activeEventId)}`, { cache:"no-store" }).then(async r => { const p=await r.json(); if(!r.ok) throw new Error(p.error); return p; }),
      fetch("/api/admin/activity-sync", { cache:"no-store" }).then(async r => r.ok ? r.json() : null),
    ]).then(([reviews, registrations, syncPayload]) => {
      setSummary(reviews.summary); setItems(reviews.items ?? []); setRegistrationSummary(registrations.summary ?? null); setSync(syncPayload);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [activeEventId]);

  const queue = items.filter(item => item.status === "review").slice(0, 4);
  const stages = activeEvent?.stages ?? [];
  const published = stages.filter(stage => stage.results_published).length;
  const steps = [
    { n:"01", label:"Evento", detail:activeEvent ? "Configurado" : "Não selecionado", done:Boolean(activeEvent), href:"/passport/organizacao/eventos" },
    { n:"02", label:"Inscrições", detail:`${registrationSummary?.total ?? 0} atletas`, done:Boolean(registrationSummary?.total), href:"/passport/organizacao/inscritos" },
    { n:"03", label:"Percursos", detail:`${stages.length} etapas`, done:Boolean(stages.length), href:"/passport/organizacao/rotas" },
    { n:"04", label:"Atividades", detail:`${summary?.total ?? 0} recebidas`, done:Boolean(summary?.total), href:"/passport/organizacao/validacao" },
    { n:"05", label:"Apuração", detail:summary?.review ? `${summary.review} em revisão` : "Sem pendências", done:Boolean(summary?.total) && !summary?.review && !summary?.pending, href:"/passport/organizacao/apuracao" },
    { n:"06", label:"Publicação", detail:`${published}/${stages.length} etapas`, done:Boolean(stages.length) && published === stages.length, href:"/passport/organizacao/classificacao" },
  ];
  const nextAction = useMemo(() => steps.find(step => !step.done) ?? steps[5], [activeEventId, summary, registrationSummary, published, stages.length]);
  const issues = [
    sync?.connections?.error ? `${sync.connections.error} conexão(ões) Ride with GPS com erro` : null,
    summary?.review ? `${summary.review} atividade(s) aguardando revisão` : null,
    summary?.pending ? `${summary.pending} atividade(s) aguardando validação` : null,
    registrationSummary?.payment_pending ? `${registrationSummary.payment_pending} pagamento(s) pendente(s)` : null,
  ].filter(Boolean) as string[];

  return <main className="ops-home"><style>{`
    .ops-home{min-height:calc(100vh - 86px);padding:40px 42px 80px;background:#0d100d;color:#f3eee5}.ops-wrap{max-width:1480px;margin:auto}.ops-kicker{margin:0 0 10px;color:#d47b2d;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}.ops-heading{display:flex;justify-content:space-between;align-items:end;gap:32px}.ops-heading h1{margin:0;font-size:clamp(34px,4vw,58px);line-height:.95;font-weight:500;text-transform:uppercase}.ops-heading p{max-width:560px;margin:0;color:#9fa59c;line-height:1.6}.ops-heading strong{color:#eee}.ops-action{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:30px;padding:20px 22px;border:1px solid #674526;background:#20170f}.ops-action small,.ops-action strong{display:block}.ops-action small{color:#b9aa99;text-transform:uppercase;font-size:9px;font-weight:900;letter-spacing:.14em}.ops-action strong{margin-top:5px;font-size:18px}.ops-btn{padding:14px 18px;background:#e86619;color:#fff;text-decoration:none;font-size:12px;font-weight:900;text-transform:uppercase;white-space:nowrap}.ops-flow{display:grid;grid-template-columns:repeat(6,1fr);margin-top:26px;border:1px solid #363c34}.ops-step{position:relative;min-height:116px;padding:18px;border-right:1px solid #363c34;color:#f3eee5;text-decoration:none;background:#141714}.ops-step:last-child{border:0}.ops-step:hover{background:#1a1e19}.ops-step.done:before{content:"";position:absolute;left:0;right:0;top:-1px;height:3px;background:#4f9f69}.ops-step small{display:block;color:#d47b2d;font-size:9px;font-weight:900;letter-spacing:.15em}.ops-step strong{display:block;margin-top:25px;font-size:14px}.ops-step span{display:block;margin-top:7px;color:#8f958d;font-size:11px}.ops-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:22px;margin-top:22px}.ops-panel{border:1px solid #363c34;background:#141714}.ops-panel-head{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 22px;border-bottom:1px solid #363c34}.ops-panel h2{margin:0;font-size:16px;text-transform:uppercase}.ops-panel-head a{color:#dc7d36;font-size:10px;font-weight:900;text-decoration:none;text-transform:uppercase}.ops-metrics{display:grid;grid-template-columns:repeat(4,1fr)}.ops-metric{padding:22px;border-right:1px solid #363c34}.ops-metric:last-child{border:0}.ops-metric strong{display:block;font-size:30px}.ops-metric span{color:#8f958d;font-size:10px;text-transform:uppercase}.ops-queue{padding:8px 22px}.ops-queue-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:18px;padding:15px 0;border-bottom:1px solid #30352e}.ops-queue-row:last-child{border:0}.ops-queue-row strong,.ops-queue-row span{display:block}.ops-queue-row span{margin-top:5px;color:#8f958d;font-size:11px}.ops-queue-row a{padding:9px 12px;border:1px solid #5c6258;color:#eee;text-decoration:none;font-size:10px;font-weight:900}.ops-alerts{padding:18px 22px}.ops-alert{display:flex;align-items:flex-start;gap:10px;padding:11px 0;border-bottom:1px solid #30352e;color:#e7b17f;font-size:12px}.ops-alert:last-child{border:0}.ops-alert b{color:#e86619}.ops-ok{padding:22px;color:#70c78d}.ops-sync{padding:18px 22px;border-top:1px solid #363c34;color:#858b82;font-size:11px;line-height:1.5}.ops-shortcuts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.ops-shortcut{padding:18px;border:1px solid #363c34;color:#eee;text-decoration:none;background:#141714}.ops-shortcut:hover{border-color:#d47b2d}.ops-shortcut strong,.ops-shortcut span{display:block}.ops-shortcut span{margin-top:6px;color:#8f958d;font-size:11px;line-height:1.45}.ops-error{margin-top:18px;padding:14px;border:1px solid #814f31;color:#efaa69}.ops-loading{opacity:.55}
    @media(max-width:1100px){.ops-flow{grid-template-columns:repeat(3,1fr)}.ops-step:nth-child(3){border-right:0}.ops-step:nth-child(-n+3){border-bottom:1px solid #363c34}.ops-grid{grid-template-columns:1fr}}@media(max-width:720px){.ops-home{padding:28px 18px 60px}.ops-heading{display:block}.ops-heading p{margin-top:16px}.ops-action{align-items:flex-start;flex-direction:column}.ops-btn{width:100%;box-sizing:border-box;text-align:center}.ops-flow{grid-template-columns:1fr 1fr}.ops-step:nth-child(3){border-right:1px solid #363c34}.ops-step:nth-child(even){border-right:0}.ops-step{border-bottom:1px solid #363c34}.ops-metrics{grid-template-columns:1fr 1fr}.ops-metric{border-bottom:1px solid #363c34}.ops-shortcuts{grid-template-columns:1fr}.ops-queue-row{grid-template-columns:1fr}.ops-queue-row a{text-align:center}}
  `}</style><div className={`ops-wrap ${loading ? "ops-loading" : ""}`}>
    <section className="ops-heading"><div><p className="ops-kicker">Legends Core · Centro de operações</p><h1>Visão geral da prova</h1></div><p><strong>{activeEvent?.name ?? "Selecione um evento"}</strong><br/>Veja o que está pronto, o que exige atenção e qual é a próxima ação recomendada.</p></section>
    <section className="ops-action"><div><small>Próxima ação recomendada</small><strong>{nextAction.label}: {nextAction.detail}</strong></div><a className="ops-btn" href={nextAction.href}>Continuar operação →</a></section>
    <section className="ops-flow" aria-label="Fluxo da prova">{steps.map(step => <a className={`ops-step ${step.done ? "done" : ""}`} href={step.href} key={step.n}><small>{step.n}</small><strong>{step.done ? "✓ " : ""}{step.label}</strong><span>{step.detail}</span></a>)}</section>
    {error ? <div className="ops-error">{error}</div> : null}
    <section className="ops-grid"><article className="ops-panel"><div className="ops-panel-head"><h2>Atividades e validação</h2><a href="/passport/organizacao/validacao">Abrir validação →</a></div><div className="ops-metrics"><div className="ops-metric"><strong>{summary?.total ?? "—"}</strong><span>Recebidas</span></div><div className="ops-metric"><strong>{summary?.validated ?? "—"}</strong><span>Homologadas</span></div><div className="ops-metric"><strong>{summary?.review ?? "—"}</strong><span>Em revisão</span></div><div className="ops-metric"><strong>{summary?.rejected ?? "—"}</strong><span>Rejeitadas</span></div></div><div className="ops-panel-head"><h2>Fila prioritária</h2><a href="/passport/organizacao/revisoes">Ver todas →</a></div>{queue.length ? <div className="ops-queue">{queue.map(item => <div className="ops-queue-row" key={item.id}><div><strong>{item.athlete?.full_name ?? "Atleta"} · {item.stage?.name ?? "Etapa"}</strong><span>{item.activity?.name ?? "Atividade"} · cobertura {item.coverage_percent ?? "—"}%</span></div><a href={`/passport/organizacao/revisoes?validation=${item.id}`}>ANALISAR</a></div>)}</div> : <div className="ops-ok">✓ Nenhuma atividade aguardando revisão.</div>}</article>
    <aside className="ops-panel"><div className="ops-panel-head"><h2>Atenção agora</h2><a href="/passport/organizacao/apuracao">Abrir central →</a></div>{issues.length ? <div className="ops-alerts">{issues.map((issue, index) => <div className="ops-alert" key={issue}><b>{String(index + 1).padStart(2,"0")}</b><span>{issue}</span></div>)}</div> : <div className="ops-ok">✓ Nenhuma pendência crítica detectada.</div>}<div className="ops-sync"><strong>Sincronização Ride with GPS</strong><br/>{sync?.connections?.active ?? 0} conexão(ões) automática(s) ativa(s).<br/>Última execução: {formatDate(sync?.latest_run?.finished_at)}</div></aside></section>
    <section className="ops-shortcuts"><a className="ops-shortcut" href="/passport/organizacao/inscritos"><strong>Inscritos</strong><span>{registrationSummary?.total ?? 0} registros · {registrationSummary?.linked ?? 0} vinculados ao Ride with GPS</span></a><a className="ops-shortcut" href="/passport/organizacao/rotas"><strong>Percursos e checkpoints</strong><span>Gerencie GPX, versões oficiais e pontos de controle.</span></a><a className="ops-shortcut" href="/passport/organizacao/impressao"><strong>Documentos oficiais</strong><span>Gere resultados por categoria, geral e relatórios com checkpoints.</span></a></section>
  </div></main>;
}
