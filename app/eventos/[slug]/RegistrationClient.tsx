"use client";

import { useEffect, useState } from "react";
import type { RegistrationLot } from "@/lib/registration-pricing";

type EventData = {
  test_mode: boolean;
  event: {
    slug: string;
    name: string;
    description: string | null;
    location: string | null;
    starts_on: string;
    ends_on: string;
    participant_limit: number | null;
    windfit_registration_url: string | null;
    registration_open: boolean;
    is_test: boolean;
  };
  stages: Array<{
    id: string;
    stage_number: number;
    name: string;
    route_label: string | null;
    stage_date: string;
    distance_km: number | null;
    elevation_m: number | null;
  }>;
  pricing: {
    current_lot: RegistrationLot | null;
    next_lot: RegistrationLot | null;
  };
  availability: {
    registered: number;
    remaining: number | null;
    available: boolean;
    closed_by_date: boolean;
    full: boolean;
    awaiting_lot: boolean;
    lots_ended: boolean;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(`${value}T12:00:00Z`))
    .replace(" de ", " ")
    .toUpperCase();
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function RegistrationClient({
  slug,
  testMode = false,
}: {
  slug: string;
  testMode?: boolean;
}) {
  const [data, setData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(
      `/api/events/${encodeURIComponent(slug)}${testMode ? "?modo=teste" : ""}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error ?? "Evento não encontrado.");
        setData(payload);
      })
      .catch((fetchError) =>
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Evento não encontrado.",
        ),
      )
      .finally(() => setLoading(false));
  }, [slug, testMode]);

  if (loading)
    return <main className="event-loading">Carregando evento...</main>;
  if (!data)
    return (
      <main className="event-loading">
        <div>
          <h1>Evento indisponível</h1>
          <p>{error}</p>
          <a href="/">← Voltar à home</a>
        </div>
      </main>
    );

  const { event, stages, availability, pricing } = data;
  const registrationUrl = event.windfit_registration_url;
  const canRegister = availability.available && Boolean(registrationUrl);
  const currentLot = pricing.current_lot;

  return (
    <main className="public-event">
      <style>{`
        .public-event{min-height:100vh;background:#0d100d;color:#f3eee5;font-family:Arial,sans-serif}.public-event *{box-sizing:border-box}.event-loading{min-height:100vh;display:grid;place-items:center;padding:30px;background:#0d100d;color:#f3eee5;text-align:center;font-family:Arial,sans-serif}.event-loading a{color:#d07b4d}.test-banner{background:#c97849;color:#fff;padding:12px 20px;text-align:center;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.event-top{min-height:100vh;background:linear-gradient(90deg,#070907f2 0%,#070907bd 48%,#07090778 100%),url('/hero-production.jpg') center/cover;padding:30px 5vw 70px}.event-nav{display:flex;align-items:center;justify-content:space-between}.event-nav img{width:150px;height:auto}.event-nav a{color:#ddd;text-decoration:none;font-size:12px;font-weight:800;text-transform:uppercase}.event-shell{width:min(1180px,100%);margin:clamp(70px,10vh,130px) auto 0;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:clamp(38px,7vw,90px);align-items:end}.event-kicker{color:#c97849;font-size:12px;letter-spacing:.22em;font-weight:900;text-transform:uppercase}.event-copy h1{font-size:clamp(52px,7vw,94px);line-height:.88;font-weight:300;margin:16px 0 22px;text-transform:uppercase}.event-copy p{font-size:18px;line-height:1.65;color:#bdc0b9;max-width:720px}.event-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;margin-top:32px;background:#59412f;border:1px solid #59412f}.event-facts div{background:#0d100ded;padding:18px}.event-facts strong,.event-facts span{display:block}.event-facts strong{font-size:19px}.event-facts span{color:#999;font-size:9px;letter-spacing:.1em;text-transform:uppercase;margin-top:5px}.registration-card{border:1px solid #6d4931;background:#0c0f0ce8;padding:30px}.registration-card h2{margin:8px 0 10px;font-size:32px;text-transform:uppercase}.registration-card p{color:#aaa;line-height:1.6}.registration-card .price{margin:24px 0;padding-top:20px;border-top:1px solid #46382e}.registration-card .price span,.registration-card .price strong{display:block}.registration-card .price span{color:#c97849;font-size:10px;letter-spacing:.14em;text-transform:uppercase}.registration-card .price strong{margin-top:5px;font-size:34px}.windfit-button,.admin-button{display:block;margin-top:22px;padding:18px;background:#c97849;color:#fff;text-align:center;text-decoration:none;font-size:12px;font-weight:900;letter-spacing:.08em}.admin-button{background:transparent;border:1px solid #6d4931}.closed{margin-top:20px;padding:16px;border-left:3px solid #c97849;background:#22170f;color:#e3ad89;line-height:1.55}@media(max-width:800px){.event-top{min-height:100vh;padding:22px 20px 50px}.event-nav img{width:126px}.event-nav a{font-size:10px}.event-shell{margin-top:58px;grid-template-columns:1fr;gap:34px}.event-copy h1{font-size:clamp(46px,14vw,66px)}.event-copy p{font-size:15px}.event-facts{grid-template-columns:1fr 1fr}.registration-card{padding:24px}}
        .event-copy .event-kicker{font-size:24px;line-height:1.1;letter-spacing:.16em}@media(max-width:800px){.event-copy .event-kicker{font-size:20px}}
      `}</style>
      {data.test_mode ? (
        <div className="test-banner">
          Ambiente interno de teste · sem inscrição pública
        </div>
      ) : null}
      <section className="event-top">
        <nav className="event-nav">
          <a href="/" aria-label="Voltar à página inicial">
            <img src="/legends-logo-official.png" alt="Legends Bike Race" />
          </a>
          <a href="/">← Voltar à home</a>
        </nav>
        <div className="event-shell">
          <div className="event-copy">
            <div className="event-kicker">
              {formatDate(event.starts_on)} — {formatDate(event.ends_on)}
            </div>
            <h1>{event.name}</h1>
            <p>{event.description}</p>
            <div className="event-facts">
              <div>
                <strong>{event.location ?? "Serra Gaúcha"}</strong>
                <span>Local</span>
              </div>
              <div>
                <strong>{stages.length || "—"}</strong>
                <span>Etapas</span>
              </div>
              <div>
                <strong>{availability.remaining ?? "—"}</strong>
                <span>Vagas disponíveis</span>
              </div>
            </div>
          </div>
          <aside className="registration-card">
            <div className="event-kicker">
              {data.test_mode ? "Operação interna" : "Inscrição oficial"}
            </div>
            <h2>{data.test_mode ? "Evento de teste" : "Windfit"}</h2>
            {data.test_mode ? (
              <>
                <p>
                  Cadastros de teste e exceções administrativas são feitos
                  somente no Race Engine.
                </p>
                <a className="admin-button" href="/passport/organizacao/inscritos">
                  ABRIR PAINEL DE INSCRITOS →
                </a>
              </>
            ) : (
              <>
                <p>
                  A inscrição e a confirmação do pagamento são realizadas
                  exclusivamente na plataforma oficial Windfit.
                </p>
                {currentLot ? (
                  <div className="price">
                    <span>{currentLot.name}</span>
                    <strong>{formatMoney(currentLot.registration_fee_cents)}</strong>
                  </div>
                ) : null}
                {canRegister ? (
                  <a className="windfit-button" href={registrationUrl!}>
                    INSCREVA-SE PELA WINDFIT →
                  </a>
                ) : (
                  <div className="closed">
                    {availability.full
                      ? "As vagas estão esgotadas."
                      : availability.closed_by_date || availability.lots_ended
                        ? "O período de inscrições foi encerrado."
                        : availability.awaiting_lot && pricing.next_lot
                          ? `O ${pricing.next_lot.name} ainda não está aberto.`
                          : "As inscrições ainda não estão abertas."}
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
