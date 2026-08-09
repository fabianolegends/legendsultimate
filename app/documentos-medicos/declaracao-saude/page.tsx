"use client";

import { FormEvent, useState } from "react";

const questions = [
  ["cardiovascular", "Possui ou já teve doença cardíaca, arritmia, insuficiência cardíaca, infarto ou outra condição cardiovascular?"],
  ["chest_pain", "Já apresentou dor ou pressão no peito durante esforço físico?"],
  ["syncope_palpitations", "Já apresentou desmaio, perda de consciência, tontura intensa ou palpitações importantes durante exercício?"],
  ["hypertension", "Possui hipertensão arterial ou utiliza medicação para controle da pressão?"],
  ["respiratory", "Possui asma, bronquite, doença pulmonar ou outra condição respiratória relevante?"],
  ["metabolic", "Possui diabetes, histórico de hipoglicemia ou outra condição metabólica que exija cuidados durante esforço prolongado?"],
  ["neurological", "Possui epilepsia, histórico de convulsões ou outra condição neurológica relevante?"],
  ["orthopedic", "Possui lesão ou limitação ortopédica/musculoesquelética que possa interferir no ciclismo de longa duração?"],
  ["severe_allergy", "Possui alergia grave a medicamentos, alimentos, picadas de insetos ou outras substâncias?"],
  ["continuous_medication", "Faz uso contínuo de medicamentos?"],
  ["recent_surgery", "Foi submetido(a) a cirurgia, internação hospitalar ou tratamento médico relevante nos últimos 12 meses?"],
  ["other_condition", "Existe alguma outra condição de saúde que a equipe médica do evento deva conhecer?"],
] as const;

type FormState = Record<string, string | boolean>;

export default function DeclaracaoSaudePage() {
  const [form, setForm] = useState<FormState>({ consent: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function setField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage(""); setSuccess(false);
    try {
      const response = await fetch("/api/public/health-declaration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível enviar a declaração.");
      setSuccess(true);
      setMessage(`Declaração enviada com sucesso para ${payload.athlete_name}. Número do atleta: ${payload.athlete_number}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar a declaração.");
    } finally { setSaving(false); }
  }

  return <main className="healthFormPage"><style>{`
    .healthFormPage{--paper:#f4f0db;--ink:#10120f;--copper:#c67a3b;background:#0b0d0c;color:#f1ece3;min-height:100vh;padding-bottom:80px}.shell{width:min(900px,calc(100% - 32px));margin:auto}.top{height:92px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(198,122,59,.32)}.top img{height:62px}.top a{color:var(--copper);font:700 12px 'Barlow Condensed';text-transform:uppercase}.hero{padding:70px 0 38px}.eyebrow{color:var(--copper);font:700 12px 'Barlow Condensed';letter-spacing:.18em;text-transform:uppercase}.hero h1{font:700 clamp(48px,7vw,82px) 'Barlow Condensed';line-height:.9;text-transform:uppercase;margin:12px 0}.hero p{max-width:760px;color:#aeb3aa;line-height:1.65}.notice{border:1px solid rgba(198,122,59,.45);background:#151814;padding:18px;margin:0 0 26px;color:#d9d7d0;line-height:1.55}.notice strong{color:var(--copper)}form{display:grid;gap:22px}.block{border:1px solid rgba(255,255,255,.11);padding:26px;background:#111411}.block h2{font:700 28px 'Barlow Condensed';text-transform:uppercase;margin:0 0 18px;color:#f1ece3}.grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.wide{grid-column:1/-1}label{display:grid;gap:7px;color:#c7cbc4;font-size:12px;font-weight:700}input,select,textarea{width:100%;box-sizing:border-box;background:#0c0f0c;border:1px solid #41463e;color:#fff;padding:13px 14px;font:500 14px Arial}textarea{resize:vertical}.q{display:grid;grid-template-columns:1fr auto;gap:18px;padding:15px 0;border-bottom:1px solid rgba(255,255,255,.1);align-items:center}.q:last-child{border:0}.q p{margin:0;color:#c9ccc6;line-height:1.45}.yesno{display:flex;gap:8px}.yesno label{display:flex;align-items:center;gap:5px;border:1px solid #3b4039;padding:8px 10px;cursor:pointer}.yesno input{width:auto}.consent{display:flex;align-items:flex-start;gap:10px;line-height:1.5}.consent input{width:auto;margin-top:3px}.submit{border:0;background:var(--copper);color:white;padding:17px 24px;font:700 14px 'Barlow Condensed';letter-spacing:.09em;text-transform:uppercase;cursor:pointer}.submit:disabled{opacity:.55}.result{padding:18px;border:1px solid #6b4b2e;background:#1d1710;color:#f0c8a4}.result.ok{border-color:#3b6647;background:#101b13;color:#a9d8b5}.privacy{font-size:11px;color:#8e948b;line-height:1.55}@media(max-width:700px){.grid{grid-template-columns:1fr}.wide{grid-column:auto}.q{grid-template-columns:1fr}.hero{padding-top:48px}.block{padding:20px}}
  `}</style>
  <nav className="top shell"><a href="/documentos-medicos">← Documentos médicos</a><img src="/legends-logo-official.png" alt="Legends Bike Race" /></nav>
  <header className="hero shell"><p className="eyebrow">Declaração de Saúde · Online</p><h1>Preencha e<br />envie à organização.</h1><p>A declaração é vinculada à sua inscrição e fica armazenada em área restrita da Organização. Tenha em mãos o <strong>número do atleta / número da inscrição</strong> recebido após concluir sua inscrição.</p></header>
  <div className="shell"><div className="notice"><strong>Como validamos sua identidade:</strong> informe o número recebido na inscrição e o mesmo e-mail utilizado no cadastro. Esses dois dados precisam coincidir com a inscrição registrada.</div>
  <form onSubmit={submit}>
    <section className="block"><h2>Identificação da inscrição</h2><div className="grid">
      <label>Número do atleta / inscrição<input required value={String(form.athlete_number ?? "")} onChange={(e)=>setField("athlete_number",e.target.value)} placeholder="Ex.: número informado na confirmação" /></label>
      <label>E-mail da inscrição<input required type="email" value={String(form.email ?? "")} onChange={(e)=>setField("email",e.target.value)} /></label>
      <label>Tipo sanguíneo<select value={String(form.blood_type ?? "")} onChange={(e)=>setField("blood_type",e.target.value)}><option value="">Não informado</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Contato de emergência<input required value={String(form.emergency_contact_name ?? "")} onChange={(e)=>setField("emergency_contact_name",e.target.value)} /></label>
      <label className="wide">Telefone de emergência<input required value={String(form.emergency_contact_phone ?? "")} onChange={(e)=>setField("emergency_contact_phone",e.target.value)} /></label>
    </div></section>
    <section className="block"><h2>Histórico de saúde</h2>{questions.map(([key,text])=><div className="q" key={key}><p>{text}</p><div className="yesno"><label><input required type="radio" name={key} checked={form[key] === true} onChange={()=>setField(key,true)} /> Sim</label><label><input required type="radio" name={key} checked={form[key] === false} onChange={()=>setField(key,false)} /> Não</label></div></div>)}</section>
    <section className="block"><h2>Informações complementares</h2><div className="grid">
      <label className="wide">Medicamentos em uso<textarea rows={3} value={String(form.medications ?? "")} onChange={(e)=>setField("medications",e.target.value)} placeholder="Informe nome, dose e frequência quando aplicável." /></label>
      <label className="wide">Alergias<textarea rows={3} value={String(form.allergies ?? "")} onChange={(e)=>setField("allergies",e.target.value)} /></label>
      <label className="wide">Condições / observações<textarea rows={4} value={String(form.health_notes ?? "")} onChange={(e)=>setField("health_notes",e.target.value)} /></label>
    </div></section>
    <section className="block"><h2>Declaração e autorização</h2><label className="consent"><input required type="checkbox" checked={form.consent === true} onChange={(e)=>setField("consent",e.target.checked)} /><span>Declaro que as informações fornecidas são verdadeiras, completas e atualizadas. Autorizo o tratamento restrito destes dados para segurança, atendimento médico e de emergência, seguro e operação da Legends Bike Race, reconhecendo que esta declaração não substitui o Atestado Médico obrigatório.</span></label><p className="privacy">Os dados de saúde são classificados como sensíveis e não ficam disponíveis publicamente. O acesso é restrito à área administrativa da Organização.</p></section>
    {message && <div className={`result${success ? " ok" : ""}`}>{message}</div>}
    <button className="submit" disabled={saving || success}>{saving ? "ENVIANDO..." : success ? "DECLARAÇÃO ENVIADA" : "ENVIAR DECLARAÇÃO À ORGANIZAÇÃO →"}</button>
  </form></div>
  </main>;
}
