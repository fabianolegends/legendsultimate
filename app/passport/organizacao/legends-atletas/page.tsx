"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Card = {
  id: string;
  athlete_name: string;
  location: string | null;
  image_url: string;
  display_order: number;
  published: boolean;
};

export default function LegendsAthletesPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [ready, setReady] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [published, setPublished] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/legends-cards", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Não foi possível carregar os cards.");
      return;
    }
    setReady(payload.module_ready !== false);
    setCards(payload.cards ?? []);
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return setMessage("Selecione o arquivo do card.");
    setSending(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("athlete_name", name);
      form.set("location", location);
      form.set("image", file);
      form.set("published", String(published));
      const response = await fetch("/api/admin/legends-cards", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível enviar o card.");
      setCards((current) => [...current, payload.card]);
      setName("");
      setLocation("");
      setFile(null);
      setPublished(true);
      setMessage("Card enviado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar o card.");
    } finally {
      setSending(false);
    }
  }

  async function update(id: string, changes: Partial<Card>) {
    const response = await fetch("/api/admin/legends-cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...changes }),
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error ?? "Não foi possível atualizar o card.");
    setCards((current) => current.map((card) => card.id === id ? payload.card : card).sort((a, b) => a.display_order - b.display_order));
  }

  async function remove(card: Card) {
    if (!window.confirm(`Excluir definitivamente o card de ${card.athlete_name}?`)) return;
    const response = await fetch(`/api/admin/legends-cards?id=${encodeURIComponent(card.id)}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error ?? "Não foi possível excluir o card.");
    setCards((current) => current.filter((item) => item.id !== card.id));
  }

  return <main className="legendsCardsAdmin">
    <style>{`
      .legendsCardsAdmin{min-height:calc(100vh - 72px);padding:48px 4vw 90px;background:#0d100d;color:#f3eee5;font-family:Arial,sans-serif}.legendsCardsWrap{max-width:1420px;margin:auto}.legendsCardsAdmin .eyebrow{margin:0;color:#dc8039;font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}.legendsCardsAdmin h1{margin:12px 0 0;font-size:clamp(40px,5vw,66px);font-weight:300;line-height:.92}.legendsCardsAdmin .intro{max-width:680px;color:#aeb5aa;line-height:1.65}.legendsCardsAdmin .upload{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin:34px 0;border:1px solid #40473d;background:#151914;padding:24px}.legendsCardsAdmin .upload h2{margin:0 0 7px;font-size:22px}.legendsCardsAdmin .upload p{margin:0;color:#9da49a;font-size:13px;line-height:1.55}.legendsCardsAdmin form{display:grid;gap:12px}.legendsCardsAdmin label{display:grid;gap:7px;color:#bfc6bb;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.legendsCardsAdmin input{box-sizing:border-box;width:100%;border:1px solid #454d42;background:#0b0e0b;color:#fff;padding:13px;font:15px Arial}.legendsCardsAdmin input[type=file]{padding:10px}.legendsCardsAdmin .toggle{display:flex;align-items:center;gap:10px;letter-spacing:0;text-transform:none;font-size:13px}.legendsCardsAdmin .toggle input{width:auto}.legendsCardsAdmin button{border:1px solid #dc8039;background:#dc8039;color:#101310;padding:14px 16px;font-weight:900;letter-spacing:.05em;cursor:pointer}.legendsCardsAdmin button.secondary{background:transparent;color:#e5e8e3;border-color:#4c544a}.legendsCardsAdmin button.danger{color:#e79a75;border-color:#714735}.legendsCardsAdmin .note{margin:14px 0;padding:13px;border:1px solid #76502d;background:#24190f;color:#efb079}.legendsCardsAdmin .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}.legendsCardsAdmin .card{border:1px solid #3d453a;background:#151914;overflow:hidden}.legendsCardsAdmin .card img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block}.legendsCardsAdmin .cardBody{padding:13px}.legendsCardsAdmin .card h3{margin:0;font-size:18px}.legendsCardsAdmin .card p{min-height:18px;margin:5px 0 12px;color:#aab0a7;font-size:12px}.legendsCardsAdmin .meta{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#d98750;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.legendsCardsAdmin .order{display:flex;align-items:center;gap:5px}.legendsCardsAdmin .order input{width:44px;padding:7px;text-align:center}.legendsCardsAdmin .actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}.legendsCardsAdmin .actions button{padding:10px;font-size:10px}.legendsCardsAdmin .empty{padding:70px;border:1px dashed #4a5147;color:#989f95;text-align:center}@media(max-width:1100px){.legendsCardsAdmin .grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:720px){.legendsCardsAdmin{padding:34px 18px 70px}.legendsCardsAdmin .upload{grid-template-columns:1fr}.legendsCardsAdmin .grid{grid-template-columns:repeat(2,1fr)}}`}
    </style>
    <div className="legendsCardsWrap">
      <p className="eyebrow">Legends 2027 · conteúdo público</p>
      <h1>Cards dos atletas</h1>
      <p className="intro">Envie os cards finais em formato 3:4. Apenas os cards publicados aparecerão automaticamente no carrossel da home.</p>
      {!ready ? <div className="note">Execute a migration 032 no Supabase para ativar este painel.</div> : null}
      <section className="upload">
        <div><h2>Adicionar atleta confirmado</h2><p>JPG, PNG ou WEBP · até 15 MB · proporção recomendada 3:4.</p></div>
        <form onSubmit={submit}>
          <label>Nome do atleta<input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required /></label>
          <label>Cidade, estado ou país <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} placeholder="Ex.: Gramado, RS · Brasil" /></label>
          <label>Card 3:4<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} required /></label>
          <label className="toggle"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />Publicar no carrossel assim que enviar</label>
          <button disabled={sending || !ready}>{sending ? "ENVIANDO..." : "ENVIAR CARD"}</button>
        </form>
      </section>
      {message ? <p className="note">{message}</p> : null}
      {cards.length ? <section className="grid">{cards.map((card) => <article className="card" key={card.id}>
        <img src={card.image_url} alt={`Card de ${card.athlete_name}`} />
        <div className="cardBody"><h3>{card.athlete_name}</h3><p>{card.location ?? "Sem local informado"}</p>
          <div className="meta"><span>{card.published ? "Publicado" : "Rascunho"}</span><label className="order">Ordem <input type="number" min="0" value={card.display_order} onChange={(event) => void update(card.id, { display_order: Number(event.target.value) })} /></label></div>
          <div className="actions"><button className="secondary" onClick={() => void update(card.id, { published: !card.published })}>{card.published ? "OCULTAR" : "PUBLICAR"}</button><button className="secondary danger" onClick={() => void remove(card)}>EXCLUIR</button></div>
        </div>
      </article>)}</section> : <div className="empty">Nenhum card enviado ainda.</div>}
    </div>
  </main>;
}
