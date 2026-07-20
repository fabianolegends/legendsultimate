"use client";

import { FormEvent, useEffect, useState } from "react";

type StageRules = {
  id: string;
  direction_required?: boolean;
  route_tolerance_m?: number;
  start_radius_m?: number;
  finish_radius_m?: number;
  auto_validate_min_coverage?: number;
  review_min_coverage?: number;
  auto_validate_max_off_route_percent?: number;
  review_max_off_route_percent?: number;
  max_continuous_off_route_km?: number;
  auto_validate_min_checkpoint_ratio?: number;
  review_min_checkpoint_ratio?: number;
};

const defaults = {
  direction_required: true, route_tolerance_m: 120, start_radius_m: 300, finish_radius_m: 300,
  auto_validate_min_coverage: 95, review_min_coverage: 80,
  auto_validate_max_off_route_percent: 5, review_max_off_route_percent: 20,
  max_continuous_off_route_km: 1.5, auto_validate_min_checkpoint_ratio: 95, review_min_checkpoint_ratio: 80,
};

export default function ValidationRulesForm({ stage, moduleReady, onSaved }:{ stage:StageRules; moduleReady:boolean; onSaved:()=>Promise<void> }) {
  const [rules,setRules]=useState(defaults);
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>setRules({
    direction_required: stage.direction_required !== false,
    route_tolerance_m: Number(stage.route_tolerance_m ?? 120),
    start_radius_m: Number(stage.start_radius_m ?? 300),
    finish_radius_m: Number(stage.finish_radius_m ?? 300),
    auto_validate_min_coverage: Number(stage.auto_validate_min_coverage ?? 95),
    review_min_coverage: Number(stage.review_min_coverage ?? 80),
    auto_validate_max_off_route_percent: Number(stage.auto_validate_max_off_route_percent ?? 5),
    review_max_off_route_percent: Number(stage.review_max_off_route_percent ?? 20),
    max_continuous_off_route_km: Number(stage.max_continuous_off_route_km ?? 1.5),
    auto_validate_min_checkpoint_ratio: Number(stage.auto_validate_min_checkpoint_ratio ?? .95) * 100,
    review_min_checkpoint_ratio: Number(stage.review_min_checkpoint_ratio ?? .8) * 100,
  }),[stage]);

  function numberField(key:keyof typeof rules,label:string,min:number,max:number,step=1,suffix="") {
    return <label className="rule-field"><span>{label}</span><div><input type="number" min={min} max={max} step={step} value={Number(rules[key])} onChange={(event)=>setRules({...rules,[key]:Number(event.target.value)})}/>{suffix&&<b>{suffix}</b>}</div></label>;
  }

  async function save(event:FormEvent) {
    event.preventDefault();setSaving(true);setMessage("Salvando regras...");
    try {
      const response=await fetch("/api/admin/routes",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({stageId:stage.id,rules:{...rules,auto_validate_min_checkpoint_ratio:rules.auto_validate_min_checkpoint_ratio/100,review_min_checkpoint_ratio:rules.review_min_checkpoint_ratio/100}})});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error??"Falha ao salvar as regras.");
      setMessage("Regras do Race Engine atualizadas.");await onSaved();
    } catch(error) { setMessage(error instanceof Error?error.message:"Falha ao salvar as regras."); }
    finally { setSaving(false); }
  }

  return <form className="rules-card" onSubmit={save}><style>{`
    .rules-card{margin-top:28px;border-top:1px solid #c8bcaa;padding-top:24px}.rules-card h3{margin:0 0 6px}.rules-card>p{color:#656a63;font-size:13px;line-height:1.5}.rules-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.rule-field{display:grid;gap:6px;font-size:12px;font-weight:800}.rule-field>div{display:flex;align-items:center;border:1px solid #b9ad9d;background:#fff}.rule-field input{width:100%;min-width:0;border:0;padding:11px;background:transparent}.rule-field b{padding:0 10px;color:#777}.direction-rule{display:flex;gap:10px;align-items:center;margin:15px 0;font-weight:800}.rules-card button{width:100%;padding:13px;border:0;background:#c36118;color:#fff;font-weight:900;cursor:pointer}.rules-card button:disabled{opacity:.55}.rules-message{color:#9a4c14!important}.migration-warning{border:1px solid #a7662c;padding:12px;color:#8a4916!important;background:#fff2dd}@media(max-width:650px){.rules-grid{grid-template-columns:1fr}}
  `}</style><h3>Regras do Race Engine</h3><p>Defina os limites usados para homologar, revisar ou rejeitar atividades desta etapa.</p>{!moduleReady?<p className="migration-warning">Execute a migration 009 no Supabase para habilitar o salvamento.</p>:null}<div className="rules-grid">
    {numberField("route_tolerance_m","Tolerância lateral",20,500,5,"m")}{numberField("max_continuous_off_route_km","Máximo contínuo fora da rota",.1,50,.1,"km")}
    {numberField("start_radius_m","Raio da largada",20,1000,10,"m")}{numberField("finish_radius_m","Raio da chegada",20,1000,10,"m")}
    {numberField("auto_validate_min_coverage","Cobertura para homologar",50,100,.1,"%")}{numberField("review_min_coverage","Cobertura mínima para revisão",30,100,.1,"%")}
    {numberField("auto_validate_max_off_route_percent","Fora da rota para homologar",0,50,.1,"%")}{numberField("review_max_off_route_percent","Fora da rota para revisão",0,80,.1,"%")}
    {numberField("auto_validate_min_checkpoint_ratio","Checkpoints para homologar",0,100,1,"%")}{numberField("review_min_checkpoint_ratio","Checkpoints para revisão",0,100,1,"%")}
  </div><label className="direction-rule"><input type="checkbox" checked={rules.direction_required} onChange={(event)=>setRules({...rules,direction_required:event.target.checked})}/> Exigir o sentido oficial</label><button disabled={!moduleReady||saving}>{saving?"SALVANDO...":"SALVAR REGRAS DA ETAPA"}</button>{message?<p className="rules-message">{message}</p>:null}</form>;
}
