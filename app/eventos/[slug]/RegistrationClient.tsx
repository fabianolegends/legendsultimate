"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { categoryForRegistration } from "@/lib/category-rules";
import {
  APPAREL_SIZES,
  calculateRegistrationPricing,
  type RegistrationLot,
} from "@/lib/registration-pricing";
import {
  formatBrazilianPostalCode,
  lookupBrazilianPostalCode,
  normalizeBrazilianPostalCode,
} from "@/lib/viacep";

type EventData = {
  test_mode: boolean;
  payment_environment: "sandbox" | null;
  event: {
    slug: string;
    name: string;
    description: string | null;
    location: string | null;
    starts_on: string;
    ends_on: string;
    registration_source: string;
    participant_limit: number | null;
    windfit_registration_url: string | null;
    terms_url: string | null;
    access_mode: string;
    registration_open: boolean;
    registration_fee_cents: number | null;
    experience_fee_cents: number | null;
    asaas_max_installments: number | null;
    premium_kit_enabled: boolean;
    premium_kit_fee_cents: number | null;
    casual_shirt_required: boolean;
    senior_discount_enabled: boolean;
    senior_discount_percent: number;
    regulation_version: string | null;
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
    lots: RegistrationLot[];
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
type Success = {
  registration_code: string;
  full_name: string;
  email: string;
  category: string;
  modality: string;
  status: string;
  payment_status: string;
};

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "15px 16px",
  border: "1px solid #cfc2b2",
  borderRadius: "2px",
  background: "#fffdf8",
  color: "#171917",
  font: "inherit",
};
function money(cents: number | null | undefined) {
  return cents == null
    ? "A definir"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Success | null>(null);
  const [postalCodeMessage, setPostalCodeMessage] = useState("");
  const [postalCodeLoading, setPostalCodeLoading] = useState(false);
  const lastPostalCode = useRef("");
  const postalCodeRequest = useRef(0);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    modality: "gravel_race",
    cpf_cnpj: "",
    postal_code: "",
    address: "",
    address_number: "",
    address_complement: "",
    province: "",
    city: "",
    state: "",
    country: "Brasil",
    casual_shirt_size: "",
    premium_kit_selected: false,
    jersey_size: "",
    terms_accepted: false,
    privacy_accepted: false,
    website: "",
  });
  const categoryPreview = useMemo(
    () =>
      data && form.birth_date && form.gender
        ? categoryForRegistration({
            birthDate: form.birth_date,
            eventDate: data.event.starts_on,
            gender: form.gender,
            modality: form.modality,
          })
        : null,
    [data, form.birth_date, form.gender, form.modality],
  );
  const pricingPreview = useMemo(() => {
    if (!data || data.event.registration_source !== "asaas") return null;
    const baseFeeCents =
      data.pricing.current_lot?.registration_fee_cents ??
      (form.modality === "experience"
        ? (data.event.experience_fee_cents ??
          data.event.registration_fee_cents)
        : data.event.registration_fee_cents);
    if (baseFeeCents == null) return null;
    if (!form.birth_date)
      return {
        seniorEligible: false,
        seniorDiscountCents: 0,
        registrationBaseFeeCents: baseFeeCents,
        discountedRegistrationFeeCents: baseFeeCents,
        premiumKitFeeCents: form.premium_kit_selected
          ? (data.event.premium_kit_fee_cents ?? 0)
          : 0,
        totalCents:
          baseFeeCents +
          (form.premium_kit_selected
            ? (data.event.premium_kit_fee_cents ?? 0)
            : 0),
      };
    try {
      return calculateRegistrationPricing({
        baseFeeCents,
        birthDate: form.birth_date,
        eventDate: data.event.starts_on,
        seniorDiscountEnabled: data.event.senior_discount_enabled,
        seniorDiscountPercent: data.event.senior_discount_percent,
        premiumKitSelected: form.premium_kit_selected,
        premiumKitFeeCents: data.event.premium_kit_fee_cents,
      });
    } catch {
      return null;
    }
  }, [
    data,
    form.birth_date,
    form.modality,
    form.premium_kit_selected,
  ]);

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
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, testMode]);
  function update(field: string, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function fillAddressFromPostalCode(value: string) {
    const postalCode = normalizeBrazilianPostalCode(value);
    if (postalCode.length !== 8) {
      if (postalCode) setPostalCodeMessage("Informe os 8 números do CEP.");
      else setPostalCodeMessage("");
      return;
    }
    if (postalCode === lastPostalCode.current) return;
    lastPostalCode.current = postalCode;
    const requestId = ++postalCodeRequest.current;
    setPostalCodeLoading(true);
    setPostalCodeMessage("Buscando endereço...");
    try {
      const result = await lookupBrazilianPostalCode(postalCode);
      if (requestId !== postalCodeRequest.current) return;
      setForm((current) => ({
        ...current,
        postal_code: result.postalCode,
        address: result.street,
        province: result.neighborhood,
        city: result.city,
        state: result.state,
        country: result.country,
      }));
      setPostalCodeMessage(
        result.street
          ? "Endereço preenchido automaticamente."
          : "CEP localizado. Complete o endereço.",
      );
    } catch (lookupError) {
      if (requestId !== postalCodeRequest.current) return;
      lastPostalCode.current = "";
      setPostalCodeMessage(
        lookupError instanceof Error
          ? lookupError.message
          : "Não foi possível consultar o CEP.",
      );
    } finally {
      if (requestId === postalCodeRequest.current)
        setPostalCodeLoading(false);
    }
  }
  function updatePostalCode(value: string) {
    const formatted = formatBrazilianPostalCode(value);
    update("postal_code", formatted);
    const postalCode = normalizeBrazilianPostalCode(formatted);
    if (postalCode !== lastPostalCode.current) {
      postalCodeRequest.current += 1;
      setPostalCodeLoading(false);
    }
    if (postalCode.length === 8) void fillAddressFromPostalCode(formatted);
    else
      setPostalCodeMessage(
        postalCode.length ? "Informe os 8 números do CEP." : "",
      );
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(slug)}/register${testMode ? "?modo=teste" : ""}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        if (payload.redirect_url) window.location.href = payload.redirect_url;
        throw new Error(
          payload.error ?? "Não foi possível concluir a inscrição.",
        );
      }
      window.localStorage.setItem(
        "legends-pending-registration",
        JSON.stringify({
          code: payload.registration.registration_code,
          email: payload.registration.email,
          event: slug,
        }),
      );
      if (payload.checkout_url) {
        window.location.assign(payload.checkout_url);
        return;
      }
      setSuccess(payload.registration);
      setData((current) =>
        current
          ? {
              ...current,
              availability: {
                ...current.availability,
                registered: current.availability.registered + 1,
                remaining:
                  current.availability.remaining === null
                    ? null
                    : Math.max(0, current.availability.remaining - 1),
              },
            }
          : current,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir a inscrição.",
      );
    } finally {
      setSaving(false);
    }
  }
  function copyCode() {
    if (success)
      navigator.clipboard.writeText(success.registration_code).catch(() => {});
  }

  if (loading)
    return <main className="public-event loading">Carregando evento...</main>;
  if (!data)
    return (
      <main className="public-event loading">
        <div>
          <h1>Evento indisponível</h1>
          <p>{error}</p>
          <a href="/">Voltar ao site</a>
        </div>
      </main>
    );
  const { event, stages, availability } = data;
  const windfitOnly = event.registration_source === "windfit";
  const asaasCheckout = event.registration_source === "asaas";
  const selectedFee =
    data.pricing.current_lot?.registration_fee_cents ??
    (form.modality === "experience"
      ? (event.experience_fee_cents ?? event.registration_fee_cents)
      : event.registration_fee_cents);
  return (
    <main className="public-event">
      <style>{`
    .public-event{min-height:100vh;background:#0d100d;color:#f3eee5;font-family:Arial,sans-serif}
    .public-event *{box-sizing:border-box}
    .loading{display:grid;place-items:center;padding:30px}
    .test-banner{position:sticky;top:0;z-index:50;background:#e86619;color:#fff;padding:13px 20px;text-align:center;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
    .event-top{min-height:500px;background:linear-gradient(90deg,#070907f2 0%,#070907bd 46%,#07090770 100%),url('/hero-production.jpg') center/cover;padding:30px 5vw 112px}
    .event-nav{display:flex;align-items:center;justify-content:space-between}
    .event-nav img{width:170px}
    .event-nav a{color:#ddd;text-decoration:none;font-size:12px;font-weight:800;text-transform:uppercase}
    .event-hero{width:min(1180px,100%);margin:68px auto 0}
    .event-kicker{color:#c97849;font-size:12px;letter-spacing:.22em;font-weight:900;text-transform:uppercase}
    .event-hero h1{font-size:clamp(52px,7vw,94px);line-height:.88;font-weight:300;margin:16px 0 22px;max-width:950px}
    .event-hero p{font-size:18px;line-height:1.65;color:#bdc0b9;max-width:720px}
    .event-facts{display:flex;gap:26px;flex-wrap:wrap;margin-top:28px}
    .event-facts div{border-left:1px solid #c97849;padding-left:14px}
    .event-facts strong,.event-facts span{display:block}
    .event-facts strong{font-size:21px}
    .event-facts span{color:#999;font-size:10px;letter-spacing:.08em;text-transform:uppercase;margin-top:5px}
    .registration-layout{position:relative;z-index:5;width:min(1100px,calc(100% - 40px));margin:-64px auto 0;padding:0 0 100px}
    .form-panel{background:#eee5d8;color:#171917;padding:46px 52px 52px;border-top:4px solid #c97849;box-shadow:0 30px 90px rgba(0,0,0,.34)}
    .form-panel h2{font-size:clamp(38px,5vw,58px);line-height:1;font-weight:300;margin:10px 0 14px}
    .form-panel>p,.form-lead{color:#60655e;line-height:1.65}
    .form-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:28px}
    .form-heading-copy{max-width:760px}
    .secure-checkout{flex:0 0 auto;border-left:1px solid #c97849;padding:4px 0 4px 18px;color:#777064;font-size:10px;line-height:1.5;letter-spacing:.1em;text-transform:uppercase}
    .secure-checkout strong{display:block;color:#171917;font-size:15px;letter-spacing:.03em}
    .form-steps{display:grid;grid-template-columns:repeat(4,1fr);margin:32px 0 28px;border:1px solid #cfc2b2;background:#f6efe5}
    .form-step{display:flex;align-items:center;gap:10px;padding:14px 16px;border-right:1px solid #cfc2b2;color:#777064;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .form-step:last-child{border-right:0}
    .form-step span{display:grid;place-items:center;width:25px;height:25px;background:#171917;color:#f4eee5;font-size:10px}
    .form-grid{display:grid;grid-template-columns:1fr;gap:18px;margin-top:0}
    .form-section{margin:0;border:1px solid #d1c5b6;background:#f8f1e7;padding:26px}
    .section-head{display:flex;align-items:flex-start;gap:14px;margin-bottom:22px}
    .section-number{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;background:#171917;color:#f4eee5;font-size:11px;font-weight:900}
    .section-head h3{margin:0;font-size:20px;font-weight:800}
    .section-head p{margin:5px 0 0;color:#797266;font-size:12px;line-height:1.45}
    .section-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .section-grid label{display:grid;gap:8px;font-size:12px;font-weight:800}
    .wide{grid-column:1/-1}
    .field-hint{min-height:16px;color:#776d61;font-size:11px;font-weight:400}
    .category-card{grid-column:1/-1;padding:16px;border-left:3px solid #c97849;background:#fffdf8}
    .category-card.error{border-color:#a94c3f;background:#f3dcd6}
    .category-card span{font-size:12px;color:#666}
    .price-card{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:end;padding:22px 24px;background:#171917;color:#f4eee5}
    .price-card strong,.price-card span{display:block}
    .price-card-title{color:#c97849;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
    .price-lines{margin-top:11px;color:#c9c5bd;font-size:13px;line-height:1.65}
    .price-total{text-align:right}
    .price-total span{color:#aaa59d;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
    .price-total strong{margin-top:5px;color:#f4eee5;font-size:30px;font-weight:400}
    .price-note{grid-column:1/-1;margin:0;color:#8d887f;font-size:11px;line-height:1.55}
    .kit-option{grid-column:1/-1;padding:18px;border:1px solid #cfc2b2;background:#f1e7d9}
    .kit-option label{display:flex;align-items:flex-start;gap:12px}
    .kit-option input{width:18px;height:18px;margin:2px 0 0;accent-color:#c97849}
    .kit-option span{font-size:12px;font-weight:400;line-height:1.55}
    .kit-option strong{font-size:14px}
    .checks{display:grid;gap:12px;margin-bottom:16px}
    .checks label{display:flex;align-items:flex-start;gap:11px;padding:15px 16px;border:1px solid #d1c5b6;background:#fffdf8;font-weight:400;line-height:1.5}
    .checks input{width:17px;height:17px;margin:2px 0 0;accent-color:#c97849}
    .checks a{color:#9a4d26}
    .submit{width:100%;padding:20px;border:0;background:#c97849;color:white;font-size:14px;font-weight:900;letter-spacing:.08em;cursor:pointer;transition:background .2s ease,transform .2s ease}
    .submit:hover:not(:disabled){background:#b7663a;transform:translateY(-1px)}
    .submit:disabled{opacity:.52;cursor:not-allowed}
    .form-error{margin-bottom:16px;background:#f3dcd6;border:1px solid #b65b46;color:#7c2d21;padding:14px}
    .closed{padding:28px;border:1px solid #8b5427;background:#281b11;color:#efb078}
    .windfit-button,.passport-button{display:block;padding:18px;background:#c97849;color:#fff;text-align:center;text-decoration:none;font-weight:900;margin-top:22px}
    .success{border:1px solid #31734d;background:#edf5ef;padding:26px}
    .success h2{color:#255e3c}
    .access-code{border:1px dashed #c36118;background:white;padding:18px;text-align:center;margin:20px 0}
    .access-code strong{display:block;font:900 30px monospace;color:#c36118}
    .access-code button{margin-top:9px;border:0;background:transparent;color:#555;text-decoration:underline;cursor:pointer}
    .success-steps{color:#555;line-height:1.7}
    .website{position:absolute;left:-9999px}
    @media(max-width:850px){
      .test-banner{position:relative;font-size:9px;line-height:1.5;padding:11px 16px}
      .event-top{min-height:440px;padding:24px 20px 92px}
      .event-nav img{width:132px}
      .event-nav>div{gap:12px!important}
      .event-nav a{font-size:9px}
      .event-hero{margin-top:52px}
      .event-hero h1{font-size:clamp(46px,15vw,68px)}
      .event-hero p{font-size:15px}
      .event-facts{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .event-facts strong{font-size:17px}
      .registration-layout{width:min(94%,700px);margin:-46px auto 0;padding-bottom:70px}
      .form-panel{padding:30px 20px 26px}
      .form-heading{display:block}
      .secure-checkout{margin-top:18px}
      .form-steps{grid-template-columns:1fr 1fr}
      .form-step:nth-child(2){border-right:0}
      .form-step:nth-child(-n+2){border-bottom:1px solid #cfc2b2}
      .form-section{padding:20px 16px}
      .section-grid{grid-template-columns:1fr}
      .wide,.category-card,.price-card,.kit-option{grid-column:auto}
      .price-card{grid-template-columns:1fr}
      .price-total{text-align:left}
      .form-panel h2{font-size:42px}
    }
  `}</style>
      {data.test_mode ? (
        <div className="test-banner">
          Ambiente de teste interno · Asaas Sandbox · nenhum valor real será
          cobrado
        </div>
      ) : null}
      <section className="event-top">
        <nav className="event-nav">
          <a href="/">
            <img src="/legends-logo-official.png" alt="Legends" />
          </a>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <a href={`/resultados/${event.slug}`}>Resultados ao vivo</a>
            <a href="/passport/acesso">Já sou inscrito →</a>
          </div>
        </nav>
        <div className="event-hero">
          <div className="event-kicker">
            {data.test_mode
              ? "TESTE INTERNO · LEGENDS ENGINE"
              : "INSCRIÇÃO · LEGENDS PASSPORT"}
          </div>
          <h1>{event.name}</h1>
          <p>
            {event.description ||
              "Uma experiência criada para pedalar, descobrir novos percursos e compartilhar a aventura."}
          </p>
          <div className="event-facts">
            <div>
              <strong>{event.location || "A definir"}</strong>
              <span>Local</span>
            </div>
            <div>
              <strong>
                {new Date(`${event.starts_on}T12:00:00`).toLocaleDateString(
                  "pt-BR",
                )}
              </strong>
              <span>Início</span>
            </div>
            <div>
              <strong>{stages.length}</strong>
              <span>Etapas</span>
            </div>
            <div>
              <strong>{availability.remaining ?? "Sem limite"}</strong>
              <span>Vagas disponíveis</span>
            </div>
            {asaasCheckout ? (
              <div>
                <strong>{money(selectedFee)}</strong>
                <span>
                  {data.pricing.current_lot?.name ?? "Inscrição"}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <section className="registration-layout">
        <article className="form-panel">
          <div className="form-heading">
            <div className="form-heading-copy">
              <div className="event-kicker">GARANTA SUA PARTICIPAÇÃO</div>
              <h2>Complete sua inscrição</h2>
              <p className="form-lead">
                Informe seus dados, escolha os itens da inscrição e revise o
                valor antes de continuar para o pagamento.
              </p>
            </div>
            {asaasCheckout ? (
              <div className="secure-checkout">
                Checkout externo seguro
                <strong>Asaas</strong>
              </div>
            ) : null}
          </div>
          {success ? (
            <div className="success">
              <h2>Inscrição confirmada!</h2>
              <p>
                {success.full_name}, seus dados já aparecem na lista oficial do
                evento.
              </p>
              <div className="access-code">
                <span>Seu código de acesso</span>
                <strong>{success.registration_code}</strong>
                <button onClick={copyCode}>Copiar código</button>
              </div>
              <p className="success-steps">
                Guarde este código. Agora conecte sua conta Ride with GPS e use
                o código para liberar o Passport.
              </p>
              <a className="passport-button" href="/passport/acesso">
                Conectar Ride with GPS →
              </a>
            </div>
          ) : windfitOnly ? (
            <>
              <h2>Inscrição pela Windfit</h2>
              <p>
                Este evento utiliza a Windfit para inscrição e pagamento. Depois
                da confirmação, seus dados serão sincronizados automaticamente
                com o Legends Passport.
              </p>
              {event.windfit_registration_url ? (
                <a
                  className="windfit-button"
                  href={event.windfit_registration_url}
                >
                  INSCREVA-SE PELA WINDFIT →
                </a>
              ) : (
                <div className="closed">
                  O link da Windfit ainda não foi configurado.
                </div>
              )}
            </>
          ) : !availability.available ? (
            <>
              <h2>Inscrições indisponíveis</h2>
              <div className="closed">
                {availability.full
                  ? "As vagas estão esgotadas."
                  : availability.closed_by_date
                    ? "O período de inscrições foi encerrado."
                    : availability.awaiting_lot &&
                        data.pricing.next_lot
                      ? `O ${data.pricing.next_lot.name} abre em ${new Date(data.pricing.next_lot.starts_at).toLocaleDateString("pt-BR")}.`
                      : availability.lots_ended
                        ? "Todos os lotes de inscrição foram encerrados."
                    : "As inscrições ainda não estão abertas ao público."}
              </div>
            </>
          ) : (
            <>
              {data.test_mode ? (
                <p className="form-lead">
                  Simulação interna: nenhum valor real será cobrado. O fluxo
                  validará a inscrição, o webhook e o painel da organização.
                </p>
              ) : null}
              <div className="form-steps" aria-label="Etapas da inscrição">
                <div className="form-step">
                  <span>01</span>Seus dados
                </div>
                <div className="form-step">
                  <span>02</span>Inscrição
                </div>
                <div className="form-step">
                  <span>03</span>Endereço
                </div>
                <div className="form-step">
                  <span>04</span>Confirmação
                </div>
              </div>
              <form className="form-grid" onSubmit={submit}>
                <section className="form-section">
                  <div className="section-head">
                    <span className="section-number">01</span>
                    <div>
                      <h3>Dados do atleta</h3>
                      <p>
                        Informações pessoais utilizadas para sua identificação
                        no evento.
                      </p>
                    </div>
                  </div>
                  <div className="section-grid">
                    <label className="wide">
                      Nome completo
                      <input
                        style={fieldStyle}
                        required
                        autoComplete="name"
                        value={form.full_name}
                        onChange={(e) => update("full_name", e.target.value)}
                      />
                    </label>
                    <label>
                      E-mail
                      <input
                        style={fieldStyle}
                        required
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                      />
                    </label>
                    <label>
                      WhatsApp
                      <input
                        style={fieldStyle}
                        required
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </label>
                    <label>
                      Data de nascimento
                      <input
                        style={fieldStyle}
                        required
                        type="date"
                        value={form.birth_date}
                        onChange={(e) => update("birth_date", e.target.value)}
                      />
                    </label>
                    <label>
                      Gênero
                      <select
                        style={fieldStyle}
                        required
                        value={form.gender}
                        onChange={(e) => update("gender", e.target.value)}
                      >
                        <option value="">Selecione</option>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro/Prefiro não informar</option>
                      </select>
                    </label>
                  </div>
                </section>
                <section className="form-section">
                  <div className="section-head">
                    <span className="section-number">02</span>
                    <div>
                      <h3>Inscrição e kit</h3>
                      <p>
                        Selecione sua modalidade, tamanhos e itens opcionais.
                      </p>
                    </div>
                  </div>
                  <div className="section-grid">
                <label>
                  Modalidade
                  <select
                    style={fieldStyle}
                    value={form.modality}
                    onChange={(e) => update("modality", e.target.value)}
                  >
                    <option value="gravel_race">Competitiva</option>
                    <option value="experience">Experience</option>
                  </select>
                </label>
                {categoryPreview ? (
                  <div
                    className={`category-card ${
                      categoryPreview.error ? "error" : ""
                    }`}
                  >
                    <strong>
                      Categoria automática:{" "}
                      {categoryPreview.category ?? "Não elegível"}
                    </strong>
                    <br />
                    <span>
                      {categoryPreview.error ??
                        `Idade-base: ${categoryPreview.age} anos em ${event.starts_on.slice(0, 4)}`}
                    </span>
                  </div>
                ) : null}
                {event.casual_shirt_required ? (
                  <label>
                    Tamanho da camiseta casual inclusa
                    <select
                      style={fieldStyle}
                      required
                      value={form.casual_shirt_size}
                      onChange={(e) =>
                        update("casual_shirt_size", e.target.value)
                      }
                    >
                      <option value="">Selecione</option>
                      {APPAREL_SIZES.map((size) => (
                        <option value={size} key={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {event.premium_kit_enabled ? (
                  <div className="kit-option">
                    <label>
                      <input
                        type="checkbox"
                        checked={form.premium_kit_selected}
                        onChange={(e) => {
                          update("premium_kit_selected", e.target.checked);
                          if (!e.target.checked) update("jersey_size", "");
                        }}
                      />
                      <span>
                        <strong>
                          Adicionar Kit Premium —{" "}
                          {money(event.premium_kit_fee_cents)}
                        </strong>
                        <br />
                        Compra opcional, cobrada separadamente e sem incidência
                        do desconto da inscrição.
                      </span>
                    </label>
                  </div>
                ) : null}
                {form.premium_kit_selected ? (
                  <label>
                    Tamanho da jersey de ciclismo
                    <select
                      style={fieldStyle}
                      required
                      value={form.jersey_size}
                      onChange={(e) => update("jersey_size", e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {APPAREL_SIZES.map((size) => (
                        <option value={size} key={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {asaasCheckout ? (
                  <>
                    <div className="price-card">
                      <div>
                        <span className="price-card-title">
                          Resumo da inscrição
                        </span>
                        <div className="price-lines">
                          <span>
                            {data.pricing.current_lot?.name ?? "Inscrição"} ·{" "}
                            {money(
                              pricingPreview?.registrationBaseFeeCents,
                            )}
                          </span>
                          {pricingPreview?.seniorEligible ? (
                            <span>
                              Benefício 60+ · −{" "}
                              {money(pricingPreview.seniorDiscountCents)}
                            </span>
                          ) : null}
                          {form.premium_kit_selected ? (
                            <span>
                              Kit Premium ·{" "}
                              {money(pricingPreview?.premiumKitFeeCents)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="price-total">
                        <span>Total</span>
                        <strong>{money(pricingPreview?.totalCents)}</strong>
                      </div>
                    </div>
                    <p className="price-note">
                      O pagamento será realizado no checkout seguro do Asaas. O
                      desconto de 50% para atletas elegíveis incide somente
                      sobre a inscrição; itens opcionais permanecem com valor
                      integral.
                    </p>
                  </>
                ) : null}
                  </div>
                </section>
                <section className="form-section">
                  <div className="section-head">
                    <span className="section-number">03</span>
                    <div>
                      <h3>{asaasCheckout ? "CPF e endereço" : "Localização"}</h3>
                      <p>
                        {asaasCheckout
                          ? "Dados necessários para a inscrição e o checkout de pagamento."
                          : "Informe sua cidade, estado e país."}
                      </p>
                    </div>
                  </div>
                  <div className="section-grid">
                {asaasCheckout ? (
                  <>
                    <label>
                      CPF
                      <input
                        style={fieldStyle}
                        required
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="000.000.000-00"
                        value={form.cpf_cnpj}
                        onChange={(e) => update("cpf_cnpj", e.target.value)}
                      />
                    </label>
                    <label>
                      CEP
                      <input
                        style={fieldStyle}
                        required
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="00000-000"
                        value={form.postal_code}
                        maxLength={9}
                        onChange={(e) => updatePostalCode(e.target.value)}
                        onBlur={(e) =>
                          void fillAddressFromPostalCode(e.target.value)
                        }
                      />
                      <span className="field-hint" aria-live="polite">
                        {postalCodeLoading
                          ? "Buscando endereço..."
                          : postalCodeMessage}
                      </span>
                    </label>
                    <label className="wide">
                      Endereço
                      <input
                        style={fieldStyle}
                        required
                        autoComplete="address-line1"
                        placeholder="Rua, avenida ou estrada"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                      />
                    </label>
                    <label>
                      Número
                      <input
                        style={fieldStyle}
                        required
                        autoComplete="address-line2"
                        value={form.address_number}
                        onChange={(e) =>
                          update("address_number", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Complemento (opcional)
                      <input
                        style={fieldStyle}
                        value={form.address_complement}
                        onChange={(e) =>
                          update("address_complement", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Bairro
                      <input
                        style={fieldStyle}
                        required
                        autoComplete="address-level3"
                        value={form.province}
                        onChange={(e) => update("province", e.target.value)}
                      />
                    </label>
                  </>
                ) : null}
                <label>
                  Cidade
                  <input
                    style={fieldStyle}
                    required
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                  />
                </label>
                <label>
                  Estado
                  <input
                    style={fieldStyle}
                    required={asaasCheckout}
                    autoComplete="address-level1"
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                  />
                </label>
                <label>
                  País
                  <input
                    style={fieldStyle}
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                  />
                </label>
                  </div>
                </section>
                <label className="website">
                  Não preencher
                  <input
                    tabIndex={-1}
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                  />
                </label>
                <section className="form-section">
                  <div className="section-head">
                    <span className="section-number">04</span>
                    <div>
                      <h3>Confirmação</h3>
                      <p>
                        Revise os dados e aceite os documentos para continuar.
                      </p>
                    </div>
                  </div>
                  <div className="checks">
                    <label>
                      <input
                        type="checkbox"
                        required
                        checked={form.terms_accepted}
                        onChange={(e) =>
                          update("terms_accepted", e.target.checked)
                        }
                      />
                      <span>
                        Li e aceito integralmente todas as cláusulas do{" "}
                        {event.terms_url ? (
                          <a href={event.terms_url} target="_blank">
                            Regulamento Oficial e do Termo de Responsabilidade
                          </a>
                        ) : (
                          "Regulamento Oficial e do Termo de Responsabilidade do evento"
                        )}
                        {event.regulation_version
                          ? ` — versão ${event.regulation_version}.`
                          : "."}
                      </span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        required
                        checked={form.privacy_accepted}
                        onChange={(e) =>
                          update("privacy_accepted", e.target.checked)
                        }
                      />
                      <span>
                        Autorizo o tratamento dos meus dados, incluindo CPF e
                        endereço, para inscrição, pagamento, comunicação e
                        operação do evento.
                      </span>
                    </label>
                  </div>
                  {error && <div className="form-error">{error}</div>}
                  <button
                    className="submit"
                    disabled={
                      saving ||
                      !form.terms_accepted ||
                      !form.privacy_accepted ||
                      (event.casual_shirt_required &&
                        !form.casual_shirt_size) ||
                      (form.premium_kit_selected && !form.jersey_size) ||
                      Boolean(categoryPreview?.error)
                    }
                  >
                    {saving
                      ? "PREPARANDO CHECKOUT..."
                      : asaasCheckout
                        ? data.test_mode
                          ? "TESTAR PAGAMENTO NO ASAAS SANDBOX →"
                          : "CONTINUAR PARA PAGAMENTO NO ASAAS →"
                        : "CONFIRMAR INSCRIÇÃO"}
                  </button>
                </section>
              </form>
            </>
          )}
        </article>
      </section>
    </main>
  );
}
