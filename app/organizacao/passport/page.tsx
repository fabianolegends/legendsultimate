"use client";

import { useEffect, useMemo, useState } from "react";

type Submission={athlete:string;category:string;stage:string;fileName:string;distanceKm:number;elevationM:number;durationMin:number;avgSpeed:number;points:number;status:string;uploadedAt:string};

export default function OrganizationPassport(){
  const [items,setItems]=useState<Submission[]>([]);
  useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem("legends-admin-submissions")||"[]"))}catch{setItems([])}},[]);
  const stats=useMemo(()=>({total:items.length,valid:items.filter(i=>i.status==="Validado automaticamente").length,review:items.filter(i=>i.status==="Aguardando revisão").length,incomplete:items.filter(i=>i.status==="Percurso incompleto").length}),[items]);
  function clear(){localStorage.removeItem("legends-admin-submissions");localStorage.removeItem("legends-passport-results");setItems([])}
  return <main className="admin">
    <style>{`
      .admin{min-height:100vh;background:#ece5d9;color:#101210;font-family:Arial,sans-serif}.top{height:84px;background:#0d100e;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 5vw}.top img{width:185px}.top a{color:#fff;text-transform:uppercase;font-size:13px;font-weight:700}.shell{width:min(1240px,90%);margin:auto;padding:55px 0}.eyebrow{color:#d16d0d;letter-spacing:.2em;text-transform:uppercase;font-size:13px;font-weight:700}.head{display:flex;justify-content:space-between;align-items:end;gap:30px}.head h1{font-size:clamp(48px,7vw,82px);text-transform:uppercase;line-height:.9;margin:15px 0 0}.head button{border:1px solid #1b1e1b;background:transparent;padding:14px 18px;text-transform:uppercase;font-weight:700;cursor:pointer}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:38px 0}.card{background:#111411;color:#fff;padding:25px}.card strong{display:block;font-size:40px;color:#d16d0d}.table{background:#fff;border:1px solid #c7bcad;overflow:auto}table{width:100%;border-collapse:collapse;min-width:900px}th,td{text-align:left;padding:17px;border-bottom:1px solid #ded6ca}th{background:#171a17;color:#fff;text-transform:uppercase;font-size:12px;letter-spacing:.08em}.badge{display:inline-block;padding:7px 10px;background:#eee5d8;font-size:12px;font-weight:700}.empty{padding:55px;text-align:center}.empty h2{text-transform:uppercase;font-size:34px;margin:0 0 10px}.empty a{color:#c45f05;font-weight:700}.foot{margin-top:24px;color:#656963;font-size:14px}@media(max-width:800px){.head{align-items:flex-start;flex-direction:column}.cards{grid-template-columns:1fr 1fr}.top{padding:0 20px}.top img{width:145px}}
    `}</style>
    <header className="top"><a href="/"><img src="/legends-logo-official.png" alt="Legends"/></a><a href="/passport">Área do atleta</a></header>
    <div className="shell"><div className="head"><div><p className="eyebrow">Legends OS · Organização</p><h1>Validação de atividades</h1></div><button onClick={clear}>Limpar demonstração</button></div>
      <div className="cards"><div className="card"><strong>{stats.total}</strong><span>uploads recebidos</span></div><div className="card"><strong>{stats.valid}</strong><span>validados</span></div><div className="card"><strong>{stats.review}</strong><span>em revisão</span></div><div className="card"><strong>{stats.incomplete}</strong><span>incompletos</span></div></div>
      <div className="table">{items.length?<table><thead><tr><th>Atleta</th><th>Categoria</th><th>Etapa</th><th>Arquivo</th><th>Distância</th><th>Elevação</th><th>Status</th><th>Pontos</th></tr></thead><tbody>{[...items].reverse().map((i,index)=><tr key={i.uploadedAt+index}><td><strong>{i.athlete}</strong></td><td>{i.category}</td><td>{i.stage}</td><td>{i.fileName}</td><td>{i.distanceKm.toFixed(1)} km</td><td>{Math.round(i.elevationM)} m+</td><td><span className="badge">{i.status}</span></td><td>{i.points}</td></tr>)}</tbody></table>:<div className="empty"><h2>Nenhum arquivo recebido</h2><p>Faça um envio na <a href="/passport">área demonstrativa do atleta</a> para testar o fluxo.</p></div>}</div>
      <p className="foot">MVP em modo demonstração: os registros ficam armazenados no navegador. A próxima etapa conecta autenticação, banco de dados e arquivos ao Supabase.</p>
    </div>
  </main>
}
