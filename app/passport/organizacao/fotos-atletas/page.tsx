"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganizationEvent } from "../EventContext";

type Submission = {
  id: string;
  status: "pending" | "approved" | "card_created";
  face_photo_url: string | null;
  cycling_photo_url: string | null;
  face_photo_name: string;
  cycling_photo_name: string;
  admin_notes?: string | null;
  updated_at: string;
  registration: {
    full_name: string;
    email: string;
    bib_number?: string | null;
    category?: string | null;
    journey_format?: string | null;
    country_code?: string | null;
  };
};

const statusLabel = { pending: "Em análise", approved: "Aprovadas", card_created: "Card criado" };

export default function AthletePhotosAdminPage() {
  const { activeEventId } = useOrganizationEvent();
  const [items, setItems] = useState<Submission[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [moduleReady, setModuleReady] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    if (!activeEventId) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/athlete-photos?eventId=${encodeURIComponent(activeEventId)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar.");
      setItems(payload.submissions ?? []);
      setSummary(payload.summary);
      setModuleReady(payload.module_ready !== false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [activeEventId]);

  async function update(item: Submission, status: Submission["status"]) {
    const response = await fetch("/api/admin/athlete-photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status, admin_notes: item.admin_notes ?? "" }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Não foi possível atualizar.");
      return;
    }
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, ...payload.submission } : row));
    setMessage("Status atualizado.");
    await load();
  }

  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.status === filter), [items, filter]);

  return <main className="athlete-media-admin">
    <style>{`
      .athlete-media-admin{min-height:calc(100vh - 72px);background:#0d100d;color:#f3eee5;padding:48px 4vw 90px;font-family:Arial,sans-serif}.media-wrap{max-width:1500px;margin:auto}.head{display:flex;align-items:end;justify-content:space-between;gap:30px}.eyebrow{color:#e37b2f;font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}.head h1{font-size:clamp(40px,5vw,66px);font-weight:300;line-height:.92;margin:12px 0 0}.head p{max-width:660px;color:#a8aea5;line-height:1.6}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:34px 0}.metric{background:#151914;border:1px solid #343a32;padding:20px}.metric strong{display:block;color:#e37b2f;font-size:34px}.metric span{color:#949b91;font-size:10px;text-transform:uppercase;letter-spacing:.1em}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}.toolbar button{border:1px solid #464c43;background:transparent;color:#bfc4bc;padding:11px 14px;font-weight:800;cursor:pointer}.toolbar button.active{border-color:#e37b2f;background:#2a1b10;color:#fff}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.card{border:1px solid #393f37;background:#151914;padding:20px}.card-head{display:flex;justify-content:space-between;gap:20px;margin-bottom:15px}.card-head h2{margin:0;font-size:24px}.card-head p{margin:5px 0 0;color:#929990;font-size:12px}.badge{align-self:flex-start;border:1px solid #76502d;color:#efaa69;padding:7px 9px;font-size:9px;font-weight:900;text-transform:uppercase}.badge.approved,.badge.card_created{border-color:#31543b;color:#74c68d}.photos{display:grid;grid-template-columns:1fr 1fr;gap:10px}.photo{position:relative;background:#090b09;aspect-ratio:4/3;overflow:hidden}.photo img{width:100%;height:100%;object-fit:cover}.photo span{position:absolute;left:8px;bottom:8px;background:#000c;padding:5px 7px;font-size:9px;font-weight:900;text-transform:uppercase}.photo a{display:block;width:100%;height:100%;color:#888;text-decoration:none}.details{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#343a32;margin:12px 0}.details div{background:#111410;padding:11px}.details span,.details strong{display:block}.details span{font-size:8px;color:#7f867d;text-transform:uppercase;margin-bottom:5px}.details strong{font-size:12px}.notes{width:100%;box-sizing:border-box;min-height:65px;background:#0d100d;color:#fff;border:1px solid #454c42;padding:10px;resize:vertical}.actions{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.actions button{border:1px solid #4a5047;background:transparent;color:#d4d8d1;padding:11px 8px;font-size:10px;font-weight:900;cursor:pointer}.actions button.primary{background:#e3691e;border-color:#e3691e;color:#fff}.actions button.done{background:#31543b;border-color:#31543b;color:#fff}.empty{border:1px dashed #464c43;padding:70px;text-align:center;color:#959c92}.notice{border:1px solid #76502d;background:#24190f;color:#efb079;padding:18px;margin-top:26px}@media(max-width:1000px){.grid{grid-template-columns:1fr}.summary{grid-template-columns:1fr 1fr}}@media(max-width:620px){.athlete-media-admin{padding:34px 18px 70px}.head{display:block}.photos{grid-template-columns:1fr}.summary{grid-template-columns:1fr 1fr}.details{grid-template-columns:1fr}.actions{grid-template-columns:1fr}}
    `}</style>
    <div className="media-wrap">
      <header className="head"><div><p className="eyebrow">Legends Core · Conteúdo dos atletas</p><h1>Fotos para os cards</h1></div><p>Receba as duas imagens de cada participante, aprove a qualidade e acompanhe quais cards já foram produzidos.</p></header>
      {moduleReady ? <><section className="summary"><div className="metric"><strong>{summary?.total ?? 0}</strong><span>envios recebidos</span></div><div className="metric"><strong>{summary?.pending ?? 0}</strong><span>em análise</span></div><div className="metric"><strong>{summary?.approved ?? 0}</strong><span>fotos aprovadas</span></div><div className="metric"><strong>{summary?.card_created ?? 0}</strong><span>cards criados</span></div></section>
      <nav className="toolbar">{[["all","Todos"],["pending","Em análise"],["approved","Aprovadas"],["card_created","Cards criados"]].map(([value,label])=><button key={value} className={filter===value?"active":""} onClick={()=>setFilter(value)}>{label}</button>)}</nav>
      {loading ? <div className="empty">Carregando fotos...</div> : visible.length ? <section className="grid">{visible.map((item)=><article className="card" key={item.id}><header className="card-head"><div><h2>{item.registration?.full_name}</h2><p>{item.registration?.email}</p></div><span className={`badge ${item.status}`}>{statusLabel[item.status]}</span></header><div className="photos"><div className="photo">{item.face_photo_url?<a href={item.face_photo_url} target="_blank" rel="noreferrer"><img src={item.face_photo_url} alt={`Rosto de ${item.registration?.full_name}`} /><span>Rosto · abrir original</span></a>:null}</div><div className="photo">{item.cycling_photo_url?<a href={item.cycling_photo_url} target="_blank" rel="noreferrer"><img src={item.cycling_photo_url} alt={`${item.registration?.full_name} pedalando`} /><span>Pedal · abrir original</span></a>:null}</div></div><div className="details"><div><span>Formato</span><strong>{item.registration?.journey_format === "short" ? "Short" : "Ultimate"}</strong></div><div><span>Categoria</span><strong>{item.registration?.category ?? "—"}</strong></div><div><span>Enviado</span><strong>{new Date(item.updated_at).toLocaleDateString("pt-BR")}</strong></div></div><textarea className="notes" value={item.admin_notes ?? ""} onChange={(event)=>setItems((current)=>current.map((row)=>row.id===item.id?{...row,admin_notes:event.target.value}:row))} placeholder="Observações internas sobre as fotos..."/><div className="actions"><button onClick={()=>update(item,"pending")}>REVISAR</button><button className="primary" onClick={()=>update(item,"approved")}>APROVAR FOTOS</button><button className="done" onClick={()=>update(item,"card_created")}>CARD CRIADO</button></div></article>)}</section> : <div className="empty">Nenhum atleta enviou fotos para este evento.</div>}</> : <div className="notice">Execute a migration 031 no Supabase para ativar o módulo de fotos dos atletas.</div>}
      {message ? <div className="notice">{message}</div> : null}
    </div>
  </main>;
}
