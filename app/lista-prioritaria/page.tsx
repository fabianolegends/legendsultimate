"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type FormState = {
  full_name: string;
  email: string;
  city: string;
  phone: string;
  expectations: string;
  website: string;
};

const emptyForm: FormState = {
  full_name: "",
  email: "",
  city: "",
  phone: "",
  expectations: "",
  website: "",
};

export default function ListaPrioritaria() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function change<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/public/priority-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível concluir o cadastro.");
      }

      setStatus("success");
      setMessage("Cadastro confirmado. Você agora faz parte da lista prioritária da Legends.");
      window.gtag?.("event", "generate_lead", {
        lead_source: "lista_prioritaria",
        form_name: "lista_prioritaria_legends",
      });
      window.fbq?.("track", "Lead", {
        content_name: "lista_prioritaria_legends",
      });
      setForm(emptyForm);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir o cadastro.");
    }
  }

  return (
    <main className="priorityPage">
      <style>{`
        .priorityPage{--paper:#f4f0db;--ink:#0b0d0c;--copper:#c67a3b;--line:rgba(198,122,59,.34);min-height:100vh;background:linear-gradient(90deg,rgba(6,8,7,.98),rgba(6,8,7,.78) 45%,rgba(6,8,7,.22)),url('/hero-production.jpg') center/cover fixed;color:#f1ece3}.wrap{width:min(1240px,calc(100% - 80px));margin:auto}
        .top{height:100px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(241,236,227,.14)}.logo{height:72px;width:auto}.back{color:var(--copper);font:600 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.15em}
        .content{min-height:calc(100vh - 100px);display:grid;grid-template-columns:.92fr 1.08fr;gap:72px;align-items:center;padding:62px 0 78px}.kicker{color:var(--copper);font:600 14px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.22em}.headline{font:700 clamp(62px,7vw,112px) 'Barlow Condensed';text-transform:uppercase;line-height:.84;margin:20px 0 28px}.lead{font-size:18px;line-height:1.7;color:#d5d9d2;max-width:610px}
        .facts{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-top:32px}.fact{background:rgba(11,13,12,.9);padding:18px}.fact strong{display:block;font:700 32px 'Barlow Condensed'}.fact span{font:500 11px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.13em;color:#aaafa7}
        .panel{background:var(--paper);color:var(--ink);padding:38px}.panelTitle{font:700 44px 'Barlow Condensed';text-transform:uppercase;line-height:.92;margin:0 0 12px}.panelIntro{color:#565a54;line-height:1.55;margin:0 0 24px}.formGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.field{display:grid;gap:7px}.field.full{grid-column:1/-1}.field label{font:700 11px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.12em;color:#555a53}.field input,.field textarea{width:100%;box-sizing:border-box;border:1px solid #b9b5a7;background:#faf7e9;color:#111;padding:14px 15px;font:inherit;outline:none}.field input:focus,.field textarea:focus{border-color:var(--copper);box-shadow:0 0 0 2px rgba(198,122,59,.15)}.field textarea{min-height:118px;resize:vertical}.website{position:absolute;left:-10000px;opacity:0;pointer-events:none}
        .button{width:100%;border:0;background:var(--copper);color:#fff;padding:18px 22px;font:700 14px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.12em;margin-top:18px;cursor:pointer}.button:disabled{opacity:.62;cursor:wait}.feedback{padding:13px 15px;margin:16px 0 0;font-size:14px;line-height:1.45}.feedback.success{background:#dce8d8;color:#21451f;border:1px solid #9abb94}.feedback.error{background:#f1ddd2;color:#702d18;border:1px solid #d29b7e}.note{font-size:11px;color:#777b75;text-align:center;line-height:1.5;margin:13px 0 0}
        @media(max-width:900px){.wrap{width:calc(100% - 32px)}.top{height:82px}.logo{height:58px}.content{min-height:auto;grid-template-columns:1fr;gap:42px;padding:60px 0}.panel{padding:30px 22px}}
        @media(max-width:560px){.formGrid{grid-template-columns:1fr}.field.full{grid-column:auto}.headline{font-size:58px}.panelTitle{font-size:38px}}
      `}</style>

      <nav className="top wrap">
        <a href="/"><img className="logo" src="/legends-logo-official.png" alt="Legends" /></a>
        <a className="back" href="/">← Voltar à home</a>
      </nav>

      <section className="content wrap">
        <div>
          <p className="kicker">Inscrições 2027</p>
          <h1 className="headline">Escolha sua jornada Legends.</h1>
          <p className="lead">
            Entre para a lista prioritária e receba primeiro o link de abertura das
            inscrições, os hotéis conveniados e as atualizações oficiais da primeira edição.
          </p>
          <div className="facts">
            <div className="fact"><strong>100</strong><span>vagas Ultimate</span></div>
            <div className="fact"><strong>50</strong><span>vagas Short</span></div>
            <div className="fact"><strong>04</strong><span>etapas Ultimate</span></div>
            <div className="fact"><strong>02</strong><span>etapas Short</span></div>
          </div>
        </div>

        <aside className="panel">
          <p className="kicker">Lista prioritária</p>
          <h2 className="panelTitle">Quero receber as informações primeiro.</h2>
          <p className="panelIntro">
            Conte quem você é e o que espera desta experiência. A organização usará
            esses dados para preparar a prova e entrar em contato com você.
          </p>

          <form onSubmit={submit}>
            <div className="formGrid">
              <div className="field full">
                <label htmlFor="full_name">Nome completo</label>
                <input id="full_name" required minLength={3} maxLength={120} autoComplete="name" value={form.full_name} onChange={(event) => change("full_name", event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input id="email" required type="email" maxLength={180} autoComplete="email" value={form.email} onChange={(event) => change("email", event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="phone">Telefone / WhatsApp</label>
                <input id="phone" required type="tel" minLength={8} maxLength={30} autoComplete="tel" placeholder="+55 (51) 99999-9999" value={form.phone} onChange={(event) => change("phone", event.target.value)} />
              </div>
              <div className="field full">
                <label htmlFor="city">Cidade</label>
                <input id="city" required minLength={2} maxLength={120} autoComplete="address-level2" placeholder="Cidade / Estado / País" value={form.city} onChange={(event) => change("city", event.target.value)} />
              </div>
              <div className="field full">
                <label htmlFor="expectations">O que você espera de uma prova neste estilo?</label>
                <textarea id="expectations" required minLength={10} maxLength={1000} placeholder="Conte o que tornaria esta experiência inesquecível para você." value={form.expectations} onChange={(event) => change("expectations", event.target.value)} />
              </div>
              <div className="website" aria-hidden="true">
                <label htmlFor="website">Site</label>
                <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => change("website", event.target.value)} />
              </div>
            </div>

            <button className="button" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Enviando…" : "Entrar para a lista prioritária →"}
            </button>

            {message ? (
              <p className={`feedback ${status === "success" ? "success" : "error"}`} role="status">
                {message}
              </p>
            ) : null}

            <p className="note">
              Ao enviar, você autoriza a organização a entrar em contato sobre a Legends.
              Seus dados não serão publicados.
            </p>
          </form>
        </aside>
      </section>
    </main>
  );
}
