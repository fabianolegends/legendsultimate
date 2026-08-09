"use client";

import { FormEvent, useEffect, useState } from "react";
import { useOrganizationEvent } from "../EventContext";

type SpotData = {
  id: string;
  name: string;
  participant_limit: number | null;
  public_remaining_spots: number | null;
};

export default function PublicSpotsPage() {
  const { activeEventId, activeEvent } = useOrganizationEvent();
  const [data, setData] = useState<SpotData | null>(null);
  const [remaining, setRemaining] = useState("100");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!activeEventId) { setData(null); return; }
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/public-spots?eventId=${encodeURIComponent(activeEventId)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar o contador.");
      setData(payload.event);
      setRemaining(String(payload.event.public_remaining_spots ?? payload.event.participant_limit ?? 100));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar o contador.");
      setData(null);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [activeEventId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!activeEventId) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/public-spots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: activeEventId, public_remaining_spots: Number(remaining) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível atualizar o contador.");
      setData(payload.event);
      setRemaining(String(payload.event.public_remaining_spots));
      setMessage("Contador público atualizado. A Home passará a exibir este número.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o contador.");
    } finally { setSaving(false); }
  }

  const total = data?.participant_limit ?? 100;
  const current = data?.public_remaining_spots ?? total;

  return <main className="spotsPage">
    <style>{`
      .spotsPage{min-height:100vh;background:#0d100d;color:#f3eee5;padding:58px 4vw 90px;font-family:Arial,sans-serif}.wrap{max-width:1040px;margin:auto}.kicker{color:#dd7728;font-size:12px;font-weight:900;letter-spacing:.22em;text-transform:uppercase}.spotsPage h1{font-size:clamp(42px,6vw,72px);font-weight:300;line-height:.95;margin:12px 0 16px}.lead{color:#a8aaa4;max-width:760px;font-size:16px;line-height:1.6}.panel{margin-top:34px;border:1px solid #3a4037;background:#151914;padding:30px}.counterPreview{display:grid;grid-template-columns:1fr auto;gap:30px;align-items:center;border-bottom:1px solid #353a33;padding-bottom:28px;margin-bottom:28px}.counterPreview span{display:block;color:#d9792d;font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.counterPreview strong{display:block;font-size:clamp(42px,7vw,82px);font-weight:300;line-height:.9;margin-top:8px}.counterPreview small{font-size:16px;color:#9da197}.badge{border:1px solid #d9792d;padding:13px 16px;color:#f0a367;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.form{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:end}.form label{display:grid;gap:8px;color:#999f96;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.form input{background:#0d100d;border:1px solid #495047;color:#fff;padding:15px;font-size:28px;max-width:280px}.form button{height:58px;padding:0 24px;border:1px solid #e86d1c;background:#e86d1c;color:#fff;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.form button:disabled{opacity:.55;cursor:not-allowed}.note{margin-top:20px;color:#8d938a;line-height:1.6}.message{margin-top:18px;border:1px solid #70451f;background:#271b11;color:#efb078;padding:14px}.warning{margin-top:26px;border-left:3px solid #d9792d;padding:12px 16px;background:#17130f;color:#bbbcb7;line-height:1.55}@media(max-width:720px){.spotsPage{padding:38px 18px 70px}.counterPreview,.form{grid-template-columns:1fr}.form input{max-width:none;width:100%}}
    `}</style>
    <div className="wrap">
      <p className="kicker">Site público · controle manual</p>
      <h1>Vagas restantes</h1>
      <p className="lead">Defina manualmente o número que aparece no contador da Home. O valor não é recalculado automaticamente pelas inscrições da Windfit: você controla exatamente quando e quanto deseja reduzir.</p>

      {!activeEventId ? <div className="message">Selecione um evento no topo do painel.</div> : <section className="panel">
        <div className="counterPreview">
          <div><span>{activeEvent?.name ?? data?.name ?? "Evento"}</span><strong>{loading ? "—" : current}</strong><small> vagas restantes / de {total}</small></div>
          <div className="badge">Prévia do contador público</div>
        </div>
        <form className="form" onSubmit={submit}>
          <label>Vagas restantes no site
            <input type="number" min={0} max={total} value={remaining} onChange={(e) => setRemaining(e.target.value)} disabled={loading || saving || !data}/>
          </label>
          <button type="submit" disabled={loading || saving || !data}>{saving ? "Salvando..." : "Atualizar contador"}</button>
        </form>
        <p className="note">Limite configurado para o evento: <strong>{total} vagas</strong>. Você pode informar de 0 a {total}. Exemplo: se houver 37 vagas disponíveis, informe 37 e a Home exibirá “RESTAM 37 VAGAS / DE {total}”.</p>
        <div className="warning"><strong>Importante:</strong> este contador é deliberadamente manual. Uma inscrição nova não altera o número sozinha. Isso evita divergências entre pagamentos pendentes, cortesias, cancelamentos e registros da Windfit.</div>
        {message && <div className="message">{message}</div>}
      </section>}
    </div>
  </main>;
}
