"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganizationEvent } from "../EventContext";

type Declaration = {
  id: string;
  event_id: string;
  registration_id: string;
  athlete_number: string;
  full_name: string;
  email: string;
  birth_date: string | null;
  blood_type: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  answers: Record<string, boolean>;
  medications: string | null;
  allergies: string | null;
  health_notes: string | null;
  submitted_at: string;
};

const labels: Record<string,string> = {
  cardiovascular: "Condição cardiovascular",
  chest_pain: "Dor/pressão no peito durante esforço",
  syncope_palpitations: "Desmaio, tontura ou palpitações",
  hypertension: "Hipertensão",
  respiratory: "Condição respiratória",
  metabolic: "Condição metabólica / diabetes / hipoglicemia",
  neurological: "Condição neurológica",
  orthopedic: "Limitação ortopédica/musculoesquelética",
  severe_allergy: "Alergia grave",
  continuous_medication: "Uso contínuo de medicamentos",
  recent_surgery: "Cirurgia/internação nos últimos 12 meses",
  other_condition: "Outra condição relevante",
};

export default function HealthDeclarationsAdminPage() {
  const { activeEventId, activeEvent } = useOrganizationEvent();
  const [items, setItems] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(true);
  const [selected, setSelected] = useState<Declaration | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    if (!activeEventId) { setItems([]); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/health-declarations?eventId=${encodeURIComponent(activeEventId)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar os dados.");
      setReady(payload.module_ready !== false);
      setItems(payload.declarations ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [activeEventId]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => [item.full_name,item.athlete_number,item.email].some((v)=>String(v).toLowerCase().includes(term)));
  }, [items, query]);

  const alerts = items.filter((item) => Object.values(item.answers ?? {}).some(Boolean)).length;

  return <main className="healthAdmin"><style>{`
    .healthAdmin{min-height:100vh;background:#0d100d;color:#f3eee5;padding:54px 4vw 90px}.wrap{max-width:1450px;margin:auto}.head{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:30px}.kicker{color:#e47727;font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}.head h1{font-size:clamp(40px,5vw,64px);font-weight:300;margin:9px 0 5px}.head p{color:#9da39a;max-width:720px}.stats{display:flex;gap:10px}.stat{border:1px solid #3b4039;background:#141713;padding:14px 18px;min-width:125px}.stat strong{display:block;font-size:28px}.stat span{font-size:9px;color:#91978d;text-transform:uppercase;letter-spacing:.12em}.warn{border-color:#734a29}.warn strong{color:#efa35f}.toolbar{display:flex;gap:12px;margin:24px 0}.toolbar input{flex:1;max-width:480px;background:#151914;color:#fff;border:1px solid #41463e;padding:13px 15px}.toolbar button{background:transparent;color:#eee;border:1px solid #565b53;padding:0 18px;cursor:pointer}.notice{border:1px solid #77502e;background:#241a11;padding:18px;color:#edb17c}.table{border:1px solid #333831}.row{display:grid;grid-template-columns:110px 1.5fr 1fr 130px 140px;align-items:center;min-height:64px;border-bottom:1px solid #333831}.row:last-child{border:0}.row>div{padding:12px 15px}.row.headrow{background:#151814;min-height:45px;color:#858c82;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.1em}.number{color:#e47b31;font-weight:900}.statusRisk{color:#ef9b57;font-weight:900}.statusOk{color:#74bd86;font-weight:900}.open{border:1px solid #50564d;background:transparent;color:#eee;padding:8px 12px;cursor:pointer}.empty{padding:50px;text-align:center;color:#878d84}.overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:1300}.drawer{position:fixed;z-index:1400;top:0;right:0;width:min(650px,94vw);height:100vh;overflow:auto;background:#111410;border-left:1px solid #444a41;padding:30px}.drawerTop{display:flex;justify-content:space-between;gap:20px}.drawerTop h2{font-size:34px;margin:6px 0}.close{background:none;border:1px solid #4d534a;color:#fff;width:38px;height:38px;cursor:pointer}.identity{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0}.field{border:1px solid #343a32;padding:12px}.field small{display:block;color:#80877e;font-size:9px;text-transform:uppercase;letter-spacing:.1em}.field strong{display:block;margin-top:5px}.answers{margin-top:25px}.answer{display:flex;justify-content:space-between;gap:20px;padding:12px 0;border-bottom:1px solid #333831;color:#c1c5be}.answer b.yes{color:#f09b58}.answer b.no{color:#77bd89}.notes{margin-top:22px}.notes article{border-top:1px solid #3b4039;padding:14px 0}.notes h3{font-size:11px;color:#e47b31;text-transform:uppercase;letter-spacing:.12em}.notes p{white-space:pre-wrap;color:#c3c7c0;line-height:1.55}.sensitive{font-size:11px;color:#8d938a;margin-top:28px;line-height:1.5}@media(max-width:900px){.head{display:block}.stats{margin-top:18px}.row{grid-template-columns:90px 1fr 110px}.row>div:nth-child(3),.row>div:nth-child(4){display:none}.identity{grid-template-columns:1fr}}
  `}</style><div className="wrap">
    <header className="head"><div><div className="kicker">Saúde dos atletas · acesso restrito</div><h1>Declarações de saúde</h1><p>{activeEvent?.name ?? "Selecione um evento"}. Dados sensíveis enviados online pelos participantes e vinculados ao número da inscrição.</p></div><div className="stats"><div className="stat"><strong>{items.length}</strong><span>recebidas</span></div><div className="stat warn"><strong>{alerts}</strong><span>com resposta SIM</span></div></div></header>
    {!ready && <div className="notice">Execute a migration <strong>026_health_declarations.sql</strong> no Supabase para ativar o armazenamento das declarações.</div>}
    <div className="toolbar"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar por nome, número do atleta ou e-mail"/><button onClick={()=>void load()}>{loading ? "Carregando..." : "Atualizar"}</button></div>
    <section className="table"><div className="row headrow"><div>Nº atleta</div><div>Participante</div><div>Contato emergência</div><div>Enviado em</div><div>Status</div></div>{filtered.length ? filtered.map((item)=>{const risk=Object.values(item.answers??{}).some(Boolean);return <div className="row" key={item.id}><div className="number">{item.athlete_number}</div><div><strong>{item.full_name}</strong><br/><small>{item.email}</small></div><div>{item.emergency_contact_name}<br/><small>{item.emergency_contact_phone}</small></div><div>{new Date(item.submitted_at).toLocaleDateString("pt-BR")}</div><div><span className={risk?"statusRisk":"statusOk"}>{risk?"REVISAR":"SEM ALERTAS"}</span> <button className="open" onClick={()=>setSelected(item)}>Abrir</button></div></div>}) : <div className="empty">{loading ? "Carregando..." : "Nenhuma declaração encontrada para este evento."}</div>}</section>
  </div>{selected && <><button className="overlay" aria-label="Fechar" onClick={()=>setSelected(null)}/><aside className="drawer"><div className="drawerTop"><div><div className="kicker">Nº {selected.athlete_number}</div><h2>{selected.full_name}</h2><p>Enviado em {new Date(selected.submitted_at).toLocaleString("pt-BR")}</p></div><button className="close" onClick={()=>setSelected(null)}>×</button></div><div className="identity"><div className="field"><small>E-mail</small><strong>{selected.email}</strong></div><div className="field"><small>Tipo sanguíneo</small><strong>{selected.blood_type || "Não informado"}</strong></div><div className="field"><small>Contato emergência</small><strong>{selected.emergency_contact_name}</strong></div><div className="field"><small>Telefone emergência</small><strong>{selected.emergency_contact_phone}</strong></div></div><section className="answers">{Object.entries(labels).map(([key,label])=>{const yes=selected.answers?.[key]===true;return <div className="answer" key={key}><span>{label}</span><b className={yes?"yes":"no"}>{yes?"SIM":"NÃO"}</b></div>})}</section><section className="notes"><article><h3>Medicamentos</h3><p>{selected.medications || "Não informado"}</p></article><article><h3>Alergias</h3><p>{selected.allergies || "Não informado"}</p></article><article><h3>Condições / observações</h3><p>{selected.health_notes || "Não informado"}</p></article></section><p className="sensitive">INFORMAÇÃO DE SAÚDE — DADO PESSOAL SENSÍVEL. Utilize somente para as finalidades operacionais, médicas, de segurança e emergência relacionadas ao evento.</p></aside></>}
  </main>;
}
