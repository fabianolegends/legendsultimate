"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Athlete = {
  full_name: string;
  email: string;
  bib_number?: string | null;
  category?: string | null;
  journey_format?: string | null;
  event_name: string;
};
type Submission = {
  id: string;
  status: "pending" | "approved" | "card_created";
  face_photo_url?: string | null;
  cycling_photo_url?: string | null;
  submitted_at: string;
  updated_at: string;
};

const statusLabels = {
  pending: "Fotos recebidas · em análise",
  approved: "Fotos aprovadas",
  card_created: "Card produzido",
};

export default function AthletePhotosPage() {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [face, setFace] = useState<File | null>(null);
  const [cycling, setCycling] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState("");
  const [cyclingPreview, setCyclingPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/athlete/photos", { cache: "no-store" });
    const payload = await response.json();
    if (response.status === 401) {
      window.location.href = "/passport/acesso";
      return;
    }
    if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar a área de fotos.");
    setAthlete(payload.athlete);
    setSubmission(payload.submission);
    setFacePreview(payload.submission?.face_photo_url ?? "");
    setCyclingPreview(payload.submission?.cycling_photo_url ?? "");
  }

  useEffect(() => {
    load().catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, []);

  function chooseFile(file: File | undefined, type: "face" | "cycling") {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setMessage("Cada foto pode ter no máximo 12 MB.");
      return;
    }
    setMessage("");
    const preview = URL.createObjectURL(file);
    if (type === "face") {
      setFace(file);
      setFacePreview(preview);
    } else {
      setCycling(file);
      setCyclingPreview(preview);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!face || !cycling) {
      setMessage("Selecione as duas fotos antes de enviar.");
      return;
    }
    if (!consent) {
      setMessage("Confirme a autorização de uso das imagens.");
      return;
    }
    setSending(true);
    setMessage("Enviando suas fotos em segurança...");
    try {
      const prepareResponse = await fetch("/api/athlete/photos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          face: { name: face.name, type: face.type, size: face.size },
          cycling: { name: cycling.name, type: cycling.type, size: cycling.size },
        }),
      });
      const prepared = await prepareResponse.json();
      if (!prepareResponse.ok) throw new Error(prepared.error ?? "Não foi possível preparar o envio.");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabaseKey) throw new Error("O armazenamento de fotos não está configurado.");
      const storage = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from(prepared.bucket);
      const faceUpload = await storage.uploadToSignedUrl(prepared.face.path, prepared.face.token, face, { contentType: face.type });
      if (faceUpload.error) throw faceUpload.error;
      const cyclingUpload = await storage.uploadToSignedUrl(prepared.cycling.path, prepared.cycling.token, cycling, { contentType: cycling.type });
      if (cyclingUpload.error) throw cyclingUpload.error;
      const response = await fetch("/api/athlete/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          face_path: prepared.face.path,
          cycling_path: prepared.cycling.path,
          face_name: face.name,
          cycling_name: cycling.name,
          consent: "accepted",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível concluir o envio das fotos.");
      setMessage("Fotos recebidas! Agora elas seguirão para a criação do seu card.");
      setFace(null);
      setCycling(null);
      setConsent(false);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar as fotos.");
    } finally {
      setSending(false);
    }
  }

  async function logout() {
    await fetch("/api/athlete/photo-logout", { method: "POST" });
    window.location.href = "/passport/acesso";
  }

  return (
    <main className="photo-area">
      <style>{`
        .photo-area{--copper:#d07127;--paper:#ede4d6;--ink:#111411;min-height:100vh;background:#0c0f0c;color:#f4eee4;font-family:Arial,sans-serif}.photo-nav{min-height:78px;padding:0 5vw;border-bottom:1px solid #343930;display:flex;align-items:center;justify-content:space-between;gap:20px;position:sticky;top:0;background:rgba(12,15,12,.96);backdrop-filter:blur(12px);z-index:20}.photo-nav img{width:150px}.photo-nav div{display:flex;align-items:center;gap:18px}.photo-nav span{font-size:12px;color:#b7bbb4}.photo-nav button{border:0;background:transparent;color:var(--copper);font-weight:900;text-transform:uppercase;cursor:pointer}.photo-shell{width:min(1180px,calc(100% - 40px));margin:auto;padding:64px 0 100px}.photo-hero{display:grid;grid-template-columns:1.1fr .9fr;gap:70px;align-items:end;margin-bottom:40px}.eyebrow{color:var(--copper);font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}.photo-hero h1{font:700 clamp(48px,7vw,84px)/.9 'Barlow Condensed',Arial,sans-serif;text-transform:uppercase;margin:14px 0}.photo-hero h1 em{display:block;color:var(--copper);font-style:normal}.photo-hero>p{color:#aeb3aa;line-height:1.75;font-size:16px}.athlete-summary{display:grid;grid-template-columns:2fr 1fr 1fr;background:#151914;border:1px solid #363c34;margin-bottom:24px}.athlete-summary div{padding:18px;border-right:1px solid #363c34}.athlete-summary div:last-child{border:0}.athlete-summary span,.athlete-summary strong{display:block}.athlete-summary span{font-size:9px;color:#858c82;letter-spacing:.12em;text-transform:uppercase;margin-bottom:7px}.status{border:1px solid #76502d;background:#24190f;color:#efb079;padding:16px 18px;margin-bottom:24px;font-weight:800}.status.approved,.status.card_created{border-color:#31543b;background:#111e15;color:#79c891}.instructions{background:var(--paper);color:var(--ink);padding:34px;margin-bottom:20px}.instructions h2{font:700 34px 'Barlow Condensed',Arial;text-transform:uppercase;margin:0 0 8px}.instructions>p{color:#666b64;line-height:1.6;margin:0}.upload-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:28px}.upload-card{border:1px solid #c3b6a5;background:#f6efe5;padding:20px}.upload-card header{display:flex;align-items:center;gap:13px;margin-bottom:15px}.number{display:grid;place-items:center;width:36px;height:36px;background:var(--copper);color:#fff;border-radius:50%;font-weight:900}.upload-card h3{margin:0;font:700 23px 'Barlow Condensed',Arial;text-transform:uppercase}.upload-card header span{display:block;color:#75786f;font-size:11px;margin-top:3px}.model{position:relative;height:350px;background:#161a16;border:1px solid #42483f;overflow:hidden;display:grid;place-items:center}.model img{width:100%;height:100%;object-fit:cover}.model.face img{object-position:center 22%}.model.empty:before{content:'+';font-size:70px;color:#d07127;font-weight:200}.model.empty:after{content:'PRÉVIA DA FOTO';position:absolute;bottom:22px;color:#8d9389;font-size:10px;font-weight:900;letter-spacing:.18em}.tips{display:grid;gap:7px;margin:16px 0;color:#52574f;font-size:12px}.tips span:before{content:'✓';color:#c15f17;font-weight:900;margin-right:8px}.file-button{display:block;border:1px solid #c15f17;padding:15px;text-align:center;color:#9d4912;font-weight:900;text-transform:uppercase;cursor:pointer}.file-button input{display:none}.file-name{display:block;margin-top:9px;color:#777b73;font-size:11px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.consent{display:flex;align-items:flex-start;gap:12px;margin:22px 0;padding:18px;border:1px solid #c6b9a7;background:#f6efe5;color:#454a43;line-height:1.55;font-size:13px}.consent input{margin-top:3px;accent-color:var(--copper)}.submit{width:100%;border:0;background:var(--copper);color:#fff;padding:19px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.submit:disabled{opacity:.55}.message{margin-top:18px;border:1px solid #8d653e;background:#251b12;color:#efc092;padding:16px;line-height:1.5}.privacy{color:#777c75;font-size:11px;line-height:1.6;margin-top:18px}.loading{min-height:60vh;display:grid;place-items:center;color:#b6bbb3}@media(max-width:820px){.photo-hero{grid-template-columns:1fr;gap:18px}.upload-grid{grid-template-columns:1fr}.athlete-summary{grid-template-columns:1fr}.athlete-summary div{border-right:0;border-bottom:1px solid #363c34}.model{height:320px}.photo-nav span{display:none}.photo-shell{padding-top:42px}.instructions{padding:24px 18px}}
      `}</style>
      <nav className="photo-nav">
        <a href="/"><img src="/legends-logo-official.png" alt="Legends Bike Race" /></a>
        <div><span>{athlete?.full_name ?? "Área do atleta"}</span><button onClick={logout}>Sair</button></div>
      </nav>
      {loading ? <div className="loading">Carregando sua área...</div> : (
        <div className="photo-shell">
          <header className="photo-hero">
            <div><p className="eyebrow">Área do atleta · Seu card Legends</p><h1>Envie suas<em>melhores fotos.</em></h1></div>
            <p>Queremos apresentar cada participante da Legends. Envie duas imagens em boa qualidade: uma que mostre claramente o seu rosto e outra de corpo inteiro pedalando.</p>
          </header>
          {athlete ? <section className="athlete-summary"><div><span>Participante</span><strong>{athlete.full_name}</strong></div><div><span>Formato</span><strong>{athlete.journey_format === "short" ? "Legends Short" : "Legends Ultimate"}</strong></div><div><span>Categoria</span><strong>{athlete.category ?? "A confirmar"}</strong></div></section> : null}
          {submission ? <div className={`status ${submission.status}`}>{statusLabels[submission.status]} · enviado em {new Date(submission.updated_at).toLocaleDateString("pt-BR")}. Você pode substituir as imagens abaixo.</div> : null}
          <form className="instructions" onSubmit={submit}>
            <h2>Duas fotos obrigatórias</h2>
            <p>Escolha arquivos originais, sem prints de tela, marcas d’água ou filtros exagerados. Formatos aceitos: JPG, PNG ou WEBP, até 12 MB por foto.</p>
            <div className="upload-grid">
              <article className="upload-card">
                <header><span className="number">1</span><div><h3>Foto de rosto</h3><span>Selfie ou retrato recente</span></div></header>
                <div className={`model face ${facePreview ? "" : "empty"}`}>{facePreview ? <img src={facePreview} alt="Prévia da foto de rosto" /> : null}</div>
                <div className="tips"><span>Rosto visível e bem iluminado</span><span>Sem capacete ou óculos escuros</span><span>Preferência por fundo simples</span></div>
                <label className="file-button">{face ? "Trocar foto" : "Selecionar foto de rosto"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event.target.files?.[0], "face")} /></label>
                <span className="file-name">{face?.name ?? (submission ? "Selecione novamente para substituir" : "Nenhum arquivo selecionado")}</span>
              </article>
              <article className="upload-card">
                <header><span className="number">2</span><div><h3>Foto pedalando</h3><span>Corpo inteiro e bicicleta</span></div></header>
                <div className={`model ${cyclingPreview ? "" : "empty"}`}>{cyclingPreview ? <img src={cyclingPreview} alt="Prévia da foto pedalando" /> : null}</div>
                <div className="tips"><span>Atleta e bicicleta inteiros no quadro</span><span>Imagem nítida, com boa resolução</span><span>Evite pelotão cobrindo o participante</span></div>
                <label className="file-button">{cycling ? "Trocar foto" : "Selecionar foto pedalando"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event.target.files?.[0], "cycling")} /></label>
                <span className="file-name">{cycling?.name ?? (submission ? "Selecione novamente para substituir" : "Nenhum arquivo selecionado")}</span>
              </article>
            </div>
            <label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Autorizo a Threerace Sports e a Legends Bike Race a utilizar estas imagens para criar e divulgar meu card de participante e conteúdos relacionados ao evento.</span></label>
            <button className="submit" disabled={sending}>{sending ? "ENVIANDO FOTOS..." : submission ? "SUBSTITUIR AS DUAS FOTOS" : "ENVIAR AS DUAS FOTOS"}</button>
            {message ? <div className="message">{message}</div> : null}
            <p className="privacy">As imagens ficam em armazenamento privado e são acessadas apenas pela equipe autorizada da organização. Para substituir uma foto, envie novamente o conjunto completo.</p>
          </form>
        </div>
      )}
    </main>
  );
}
