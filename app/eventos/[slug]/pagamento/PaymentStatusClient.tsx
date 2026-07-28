"use client";

import { useCallback, useEffect, useState } from "react";

type StoredRegistration = { code?: string; email?: string; event?: string };
type StatusPayload = {
  event: { name: string };
  registration: {
    registration_code: string;
    full_name: string;
    category: string;
    modality: string;
    status: string;
    payment_status: string;
    payment_checkout_url: string | null;
    payment_checkout_status: string | null;
    payment_expires_at?: string | null;
  };
};

function title(result: string, paymentStatus?: string) {
  if (paymentStatus === "paid") return "Pagamento confirmado";
  if (result === "cancelado") return "Pagamento não concluído";
  if (result === "expirado") return "O checkout expirou";
  return "Estamos confirmando seu pagamento";
}

export default function PaymentStatusClient({ slug, result }: { slug: string; result: string }) {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    const raw = window.localStorage.getItem("legends-pending-registration");
    let stored: StoredRegistration | null = null;
    try {
      stored = raw ? JSON.parse(raw) as StoredRegistration : null;
    } catch {
      window.localStorage.removeItem("legends-pending-registration");
    }
    if (!stored?.code || !stored.email || stored.event !== slug) {
      setMessage("Não encontramos os dados desta inscrição neste aparelho. Consulte o e-mail usado no cadastro ou fale com a organização.");
      setChecking(false);
      return;
    }
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(slug)}/registration-status?code=${encodeURIComponent(stored.code)}&email=${encodeURIComponent(stored.email)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível consultar a inscrição.");
      setPayload(body);
      setMessage("");
      if (["paid", "cancelled", "refunded", "failed", "chargeback"].includes(body.registration.payment_status)) setChecking(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível consultar a inscrição.");
      setChecking(false);
    }
  }, [slug]);

  useEffect(() => {
    void check();
    const timer = window.setInterval(() => {
      if (checking) void check();
    }, 3500);
    return () => window.clearInterval(timer);
  }, [check, checking]);

  const registration = payload?.registration;
  const paid = registration?.payment_status === "paid";
  return <main className="payment-return">
    <style>{`
      .payment-return{min-height:100vh;display:grid;place-items:center;padding:28px;background:linear-gradient(135deg,#080a08e8,#080a08f4),url('/hero-production.jpg') center/cover;color:#f3eee5;font-family:Arial,sans-serif}.payment-card{width:min(650px,100%);border:1px solid #4a4f46;background:#111410ee;padding:clamp(26px,5vw,54px)}.logo{width:150px;margin-bottom:38px}.kicker{color:#e2752b;letter-spacing:.2em;font-size:11px;font-weight:900}.payment-card h1{font-size:clamp(38px,7vw,68px);line-height:.94;text-transform:uppercase;margin:14px 0 22px}.payment-card p{color:#b9bdb5;line-height:1.65}.confirmed{border-left:4px solid #3f9a68;padding:15px 18px;background:#10261a}.pending{border-left:4px solid #e2752b;padding:15px 18px;background:#2a1b10}.code{margin-top:22px;border:1px dashed #725033;padding:18px}.code strong{display:block;font:900 25px monospace;color:#efa66f;margin-top:7px}.actions{display:grid;gap:10px;margin-top:24px}.actions a,.actions button{padding:16px;text-align:center;text-decoration:none;font-weight:900;border:0;cursor:pointer}.primary{background:#e86619;color:white}.secondary{background:transparent;color:#e9e3da;border:1px solid #5b6057!important}.message{color:#efb078!important}.spinner{display:inline-block;width:9px;height:9px;border-radius:50%;background:#e86619;margin-right:8px;animation:pulse 1s infinite alternate}@keyframes pulse{to{opacity:.25}}
    `}</style>
    <article className="payment-card">
      <a href="/"><img className="logo" src="/legends-logo-official.png" alt="Legends Bike Race"/></a>
      <div className="kicker">LEGENDS PASSPORT · ASAAS</div>
      <h1>{title(result, registration?.payment_status)}</h1>
      {paid ? <div className="confirmed">
        <strong>Sua vaga está garantida.</strong>
        <p>O Legends Engine recebeu a confirmação financeira do Asaas e liberou sua inscrição.</p>
      </div> : <div className="pending">
        {checking ? <p><span className="spinner"/>Aguardando o retorno seguro do Asaas. Esta página será atualizada automaticamente.</p> : <p>O pagamento ainda não foi confirmado. Sua inscrição permanece sem elegibilidade até o webhook financeiro chegar.</p>}
      </div>}
      {registration ? <div className="code"><span>Código da inscrição</span><strong>{registration.registration_code}</strong><p>{registration.full_name} · {registration.category}</p></div> : null}
      {message ? <p className="message">{message}</p> : null}
      <div className="actions">
        {!paid && registration?.payment_status === "pending" && registration.payment_checkout_url ? <a className="primary" href={registration.payment_checkout_url}>RETOMAR PAGAMENTO NO ASAAS →</a> : null}
        {paid ? <a className="primary" href="/passport/acesso">ACESSAR O LEGENDS PASSPORT →</a> : <button className="secondary" type="button" onClick={() => { setChecking(true); void check(); }}>VERIFICAR NOVAMENTE</button>}
        <a className="secondary" href={`/eventos/${encodeURIComponent(slug)}`}>VOLTAR AO EVENTO</a>
      </div>
    </article>
  </main>;
}
