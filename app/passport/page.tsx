"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Result = {
  source: "GPX" | "Strava";
  sourceId?: string;
  fileName: string;
  distanceKm: number;
  elevationM: number;
  durationMin: number;
  avgSpeed: number;
  avgHeartRate?: number | null;
  avgWatts?: number | null;
  points: number;
  status: string;
  uploadedAt: string;
};

type Athlete = { id?: number; firstname?: string; lastname?: string; profile?: string };
type StravaActivity = {
  id: string;
  name: string;
  startDateLocal: string;
  distanceKm: number;
  elevationM: number;
  movingTimeMin: number;
  avgSpeed: number;
  avgHeartRate: number | null;
  avgWatts: number | null;
};
type StravaState = {
  configured: boolean;
  connected: boolean;
  athlete: Athlete | null;
  activities: StravaActivity[];
  error?: string;
};

const stages = [
  { id: 1, name: "Stage 01", route: "Canela → São Francisco de Paula", distance: 111, elevation: 1420, weight: 1.15 },
  { id: 2, name: "Stage 02", route: "São Francisco de Paula → Gramado", distance: 89.1, elevation: 1520, weight: 1 },
  { id: 3, name: "Stage 03", route: "Gramado → Nova Petrópolis", distance: 99.7, elevation: 1550, weight: 1.2 },
  { id: 4, name: "Stage 04", route: "Nova Petrópolis → Canela", distance: 70, elevation: 1530, weight: 0.65 },
];

function haversine(a: [number, number], b: [number, number]) {
  const r = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}

function parseGpx(text: string) {
  const xml = new DOMParser().parseFromString(text, "application/xml");
  if (xml.querySelector("parsererror")) throw new Error("Arquivo GPX inválido.");
  const pts = Array.from(xml.querySelectorAll("trkpt"))
    .map((point) => ({
      lat: Number(point.getAttribute("lat")),
      lon: Number(point.getAttribute("lon")),
      ele: Number(point.querySelector("ele")?.textContent || 0),
      time: point.querySelector("time")?.textContent || "",
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));
  if (pts.length < 2) throw new Error("O GPX não contém pontos suficientes.");

  let distanceKm = 0;
  let elevationM = 0;
  for (let i = 1; i < pts.length; i += 1) {
    distanceKm += haversine([pts[i - 1].lat, pts[i - 1].lon], [pts[i].lat, pts[i].lon]);
    const gain = pts[i].ele - pts[i - 1].ele;
    if (gain > 0) elevationM += gain;
  }
  const start = pts.find((point) => point.time)?.time;
  const end = [...pts].reverse().find((point) => point.time)?.time;
  const durationMin = start && end ? Math.max(1, (new Date(end).getTime() - new Date(start).getTime()) / 60000) : 0;
  return { distanceKm, elevationM, durationMin, avgSpeed: durationMin ? distanceKm / (durationMin / 60) : 0 };
}

export default function Passport() {
  const [selected, setSelected] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [strava, setStrava] = useState<StravaState | null>(null);
  const [results, setResults] = useState<Record<number, Result>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("legends-passport-results") || "{}") as Record<number, Result>;
    } catch {
      return {};
    }
  });

  const stage = stages.find((item) => item.id === selected) ?? stages[0];
  const total = useMemo(() => Object.values(results).reduce((sum, result) => sum + result.distanceKm, 0), [results]);

  async function loadStrava() {
    try {
      const response = await fetch("/api/strava/activities", { cache: "no-store" });
      const data = (await response.json()) as StravaState;
      setStrava(data);
    } catch {
      setStrava({ configured: false, connected: false, athlete: null, activities: [], error: "Falha ao consultar a integração." });
    }
  }

  useEffect(() => {
    void loadStrava();
  }, []);

  function validate(distanceKm: number) {
    const coverage = Math.min(100, (distanceKm / stage.distance) * 100);
    return coverage >= 97 ? "Validado automaticamente" : coverage >= 90 ? "Aguardando revisão" : "Percurso incompleto";
  }

  function saveResult(result: Result) {
    const next = { ...results, [stage.id]: result };
    setResults(next);
    localStorage.setItem("legends-passport-results", JSON.stringify(next));
    const submissions = JSON.parse(localStorage.getItem("legends-admin-submissions") || "[]") as unknown[];
    const athleteName = strava?.athlete ? `${strava.athlete.firstname || ""} ${strava.athlete.lastname || ""}`.trim() : "Atleta demonstração";
    submissions.push({ athlete: athleteName, category: "Master", stage: stage.name, ...result });
    localStorage.setItem("legends-admin-submissions", JSON.stringify(submissions));
  }

  function importStrava(activity: StravaActivity) {
    const status = validate(activity.distanceKm);
    saveResult({
      source: "Strava",
      sourceId: activity.id,
      fileName: activity.name,
      distanceKm: activity.distanceKm,
      elevationM: activity.elevationM,
      durationMin: activity.movingTimeMin,
      avgSpeed: activity.avgSpeed,
      avgHeartRate: activity.avgHeartRate,
      avgWatts: activity.avgWatts,
      status,
      points: status === "Validado automaticamente" ? Math.round(100 * stage.weight) : 0,
      uploadedAt: new Date().toISOString(),
    });
    setMessage(`${activity.name} importada do Strava com ${activity.distanceKm.toFixed(1)} km.`);
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      if (!file.name.toLowerCase().endsWith(".gpx")) throw new Error("O envio manual aceita somente arquivo GPX.");
      const data = parseGpx(await file.text());
      const status = validate(data.distanceKm);
      saveResult({
        ...data,
        source: "GPX",
        fileName: file.name,
        status,
        points: status === "Validado automaticamente" ? Math.round(100 * stage.weight) : 0,
        uploadedAt: new Date().toISOString(),
      });
      setMessage(`${status}. Distância detectada: ${data.distanceKm.toFixed(1)} km.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível processar o arquivo.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <main className="passport">
      <style>{`
        .passport{min-height:100vh;background:#0d100e;color:#f5f0e7;font-family:Arial,sans-serif}.top{height:86px;border-bottom:1px solid #3e3328;display:flex;align-items:center;justify-content:space-between;padding:0 5vw}.top img{width:190px}.top a{color:#f5f0e7;text-transform:uppercase;font-weight:700;font-size:13px}.shell{width:min(1240px,90%);margin:auto;padding:60px 0}.eyebrow{color:#d16d0d;letter-spacing:.2em;text-transform:uppercase;font-size:13px;font-weight:700}.hero{display:grid;grid-template-columns:1.25fr .75fr;gap:50px;align-items:end}.hero h1{font-size:clamp(52px,7vw,92px);line-height:.88;text-transform:uppercase;margin:18px 0}.hero h1 em{font-style:normal;color:#d16d0d}.summary{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #4a3b2e}.summary div{padding:22px;border-right:1px solid #4a3b2e}.summary div:last-child{border:0}.summary strong{font-size:30px;display:block}.grid{display:grid;grid-template-columns:300px 1fr;gap:28px;margin-top:55px}.stages{display:grid;gap:10px}.stageBtn{background:#171a17;border:1px solid #353a34;color:#f5f0e7;text-align:left;padding:20px;cursor:pointer}.stageBtn.active{border-color:#d16d0d;background:#20170e}.stageBtn strong,.stageBtn span{display:block}.stageBtn span{color:#9fa49d;margin-top:7px;font-size:13px}.panel{background:#f1eadf;color:#101210;padding:34px}.panel h2{font-size:42px;text-transform:uppercase;margin:0 0 6px}.route{color:#6c6f69}.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#c9bbaa;margin:28px 0}.facts div{background:#e8ded0;padding:18px}.facts strong{display:block;font-size:23px}.stravaBox{background:#171a17;color:#fff;padding:24px;margin:26px 0}.stravaHead{display:flex;justify-content:space-between;align-items:center;gap:18px}.stravaHead h3{margin:0;text-transform:uppercase}.stravaConnect,.activity button{background:#fc4c02;color:#fff;border:0;padding:14px 18px;font-weight:800;text-transform:uppercase;cursor:pointer}.activities{display:grid;gap:10px;margin-top:18px}.activity{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;background:#252925;padding:16px}.activity span{display:block;color:#afb4ad;font-size:13px;margin-top:6px}.divider{text-align:center;color:#726a61;margin:22px 0;text-transform:uppercase;font-size:12px;letter-spacing:.16em}.upload{display:block;border:2px dashed #d16d0d;padding:30px;text-align:center;cursor:pointer;background:#fff8ef}.upload input{display:none}.upload b{display:block;font-size:20px;margin-bottom:8px}.notice{margin-top:18px;padding:15px;background:#171a17;color:#fff}.result{margin-top:22px;border-top:1px solid #c9bbaa;padding-top:22px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.result strong{font-size:24px;display:block}.status,.extra{grid-column:1/-1}.status{color:#a34d00;font-weight:700}.extra{color:#69645e;font-size:13px}.adminLink{display:inline-block;margin-top:34px;color:#d16d0d;font-weight:700;text-transform:uppercase}@media(max-width:800px){.hero,.grid{grid-template-columns:1fr}.summary,.facts,.result{grid-template-columns:1fr}.summary div{border-right:0;border-bottom:1px solid #4a3b2e}.top{padding:0 20px}.top img{width:150px}.shell{padding-top:38px}.panel{padding:24px}.stravaHead,.activity{display:grid;grid-template-columns:1fr}.activity button{width:100%}}
      `}</style>
      <header className="top"><a href="/"><img src="/legends-logo-official.png" alt="Legends" /></a><a href="/">Voltar ao site</a></header>
      <div className="shell">
        <section className="hero">
          <div><p className="eyebrow">Legends Passport</p><h1>Sua jornada.<br /><em>Seus dados.</em></h1><p>Conecte sua conta Strava e importe a atividade sem precisar baixar arquivos.</p></div>
          <div className="summary"><div><strong>{Object.keys(results).length}/4</strong><span>etapas enviadas</span></div><div><strong>{total.toFixed(0)} km</strong><span>registrados</span></div><div><strong>{Object.values(results).reduce((sum, result) => sum + result.points, 0)}</strong><span>pontos</span></div></div>
        </section>
        <section className="grid">
          <aside className="stages">{stages.map((item) => <button key={item.id} className={`stageBtn ${selected === item.id ? "active" : ""}`} onClick={() => setSelected(item.id)}><strong>{item.name}</strong><span>{item.route}</span><span>{results[item.id]?.status || "Aguardando atividade"}</span></button>)}</aside>
          <div className="panel">
            <p className="eyebrow">{stage.name}</p><h2>{stage.route}</h2><p className="route">Escolha uma atividade recente do Strava ou envie o GPX manualmente.</p>
            <div className="facts"><div><strong>{stage.distance} km</strong><span>distância oficial</span></div><div><strong>{stage.elevation} m+</strong><span>ascensão prevista</span></div><div><strong>{stage.weight.toFixed(2)}</strong><span>peso da etapa</span></div></div>
            <div className="stravaBox">
              {!strava ? <p>Consultando conexão com o Strava...</p> : !strava.configured ? <p>Integração aguardando as credenciais do Strava na Vercel.</p> : !strava.connected ? <div className="stravaHead"><div><h3>Importar do Strava</h3><p>Autorize uma vez e selecione seu pedal recente.</p></div><a className="stravaConnect" href="/api/strava/connect">Conectar com Strava</a></div> : <><div className="stravaHead"><div><h3>Atividades de {strava.athlete?.firstname || "atleta"}</h3><p>Pedais encontrados nos últimos sete dias.</p></div><button onClick={() => void loadStrava()}>Atualizar</button></div><div className="activities">{strava.activities.length === 0 ? <p>Nenhuma atividade recente de ciclismo encontrada.</p> : strava.activities.map((activity) => <div className="activity" key={activity.id}><div><strong>{activity.name}</strong><span>{new Date(activity.startDateLocal).toLocaleString("pt-BR")} · {activity.distanceKm.toFixed(1)} km · {Math.round(activity.elevationM)} m+ · {Math.round(activity.movingTimeMin)} min</span></div><button onClick={() => importStrava(activity)}>Usar nesta etapa</button></div>)}</div></>}
            </div>
            <div className="divider">ou envie manualmente</div>
            <label className="upload"><input type="file" accept=".gpx,application/gpx+xml" onChange={upload} /><b>{busy ? "Processando arquivo..." : "Clique ou arraste seu GPX"}</b><span>Alternativa para quem não utiliza o Strava.</span></label>
            {message && <div className="notice">{message}</div>}
            {results[stage.id] && <div className="result"><div><strong>{results[stage.id].distanceKm.toFixed(1)} km</strong><span>distância</span></div><div><strong>{Math.round(results[stage.id].elevationM)} m+</strong><span>elevação</span></div><div><strong>{Math.round(results[stage.id].durationMin)} min</strong><span>tempo</span></div><div><strong>{results[stage.id].avgSpeed.toFixed(1)} km/h</strong><span>média</span></div><div className="status">{results[stage.id].status} · {results[stage.id].points} pontos</div><div className="extra">Fonte: {results[stage.id].source}{results[stage.id].avgHeartRate ? ` · FC média ${Math.round(results[stage.id].avgHeartRate)} bpm` : ""}{results[stage.id].avgWatts ? ` · Potência média ${Math.round(results[stage.id].avgWatts)} W` : ""}</div></div>}
            <a className="adminLink" href="/organizacao/passport">Ver painel demonstrativo da organização →</a>
          </div>
        </section>
      </div>
    </main>
  );
}
