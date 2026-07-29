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
  padding: "14px",
  border: "1px solid #b9ad9c",
  background: "#fffaf2",
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
    .public-event{min-height:100vh;background:#0d100d;color:#f3eee5;font-family:Arial,sans-serif}.public-event *{box-sizing:border-box}.loading{display:grid;place-items:center;padding:30px}.test-banner{position:sticky;top:0;z-index:50;background:#e86619;color:#fff;padding:13px 20px;text-align:center;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.event-top{min-height:420px;background:linear-gradient(90deg,#070907f2,#070907a8),url('/hero-production.jpg') center/cover;padding:30px 5vw 58px}.event-nav{display:flex;align-items:center;justify-content:space-between}.event-nav img{width:170px}.event-nav a{color:#ddd;text-decoration:none;font-size:12px;font-weight:800;text-transform:uppercase}.event-hero{width:min(1400px,100%);margin:76px auto 0}.event-kicker{color:#e0792e;font-size:12px;letter-spacing:.22em;font-weight:900;text-transform:uppercase}.event-hero h1{font-size:clamp(52px,7vw,104px);line-height:.88;font-weight:300;margin:16px 0 24px}.event-hero p{font-size:19px;line-height:1.65;color:#bdc0b9;max-width:760px}.event-facts{display:flex;gap:28px;flex-wrap:wrap;margin-top:28px}.event-facts div{border-left:1px solid #b95e23;padding-left:14px}.event-facts strong,.event-facts span{display:block}.event-facts strong{font-size:23px}.event-facts span{color:#999;font-size:11px;text-transform:uppercase;margin-top:4px}.registration-layout{width:min(1400px,90%);margin:0 auto;padding:70px 0 100px;display:grid;grid-template-columns:.75fr 1.25fr;gap:36px;align-items:start}.stage-panel{border:1px solid #383d36;background:#151814;padding:28px}.stage-panel h2,.form-panel h2{font-size:34px;font-weight:400;margin:8px 0 20px}.stage-row{padding:17px 0;border-top:1px solid #383d36}.stage-row strong,.stage-row span{display:block}.stage-row span{color:#999;font-size:13px;margin-top:6px}.availability{margin-top:24px;border:1px solid #70451f;background:#25190f;padding:18px;color:#efb078}.form-panel{background:#eee5d8;color:#171917;padding:34px}.form-panel>p{color:#60655e;line-height:1.6}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:24px}.form-grid label{display:grid;gap:7px;font-size:12px;font-weight:800}.field-hint{min-height:16px;color:#776d61;font-size:11px;font-weight:400}.wide{grid-column:1/-1}.checks{grid-column:1/-1;display:grid;gap:10px;border-top:1px solid #c8bcac;padding-top:17px}.checks label{display:flex;grid-template-columns:auto 1fr;align-items:start;font-weight:400;line-height:1.45}.checks input{margin-top:3px}.submit{grid-column:1/-1;padding:18px;border:0;background:#e86619;color:white;font-size:16px;font-weight:900;cursor:pointer}.submit:disabled{opacity:.6}.form-error{grid-column:1/-1;background:#f3dcd6;border:1px solid #b65b46;color:#7c2d21;padding:14px}.closed{padding:28px;border:1px solid #8b5427;background:#281b11;color:#efb078}.windfit-button,.passport-button{display:block;padding:18px;background:#e86619;color:#fff;text-align:center;text-decoration:none;font-weight:900;margin-top:22px}.success{border:1px solid #31734d;background:#edf5ef;padding:26px}.success h2{color:#255e3c}.access-code{border:1px dashed #c36118;background:white;padding:18px;text-align:center;margin:20px 0}.access-code strong{display:block;font:900 30px monospace;color:#c36118}.access-code button{margin-top:9px;border:0;background:transparent;color:#555;text-decoration:underline;cursor:pointer}.success-steps{color:#555;line-height:1.7}.website{position:absolute;left:-9999px}@media(max-width:850px){.registration-layout{grid-template-columns:1fr;width:min(94%,700px);padding:45px 0 70px}.event-top{padding-inline:22px}.event-nav img{width:140px}.event-hero{margin-top:55px}.form-grid{grid-template-columns:1fr}.wide,.checks,.submit,.form-error{grid-column:auto}.form-panel{padding:24px}.event-facts{gap:16px}}
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
        <aside className="stage-panel">
          <div className="event-kicker">PROGRAMAÇÃO</div>
          <h2>Etapas do evento</h2>
          {stages.map((stage) => (
            <div className="stage-row" key={stage.id}>
              <strong>
                Dia {stage.stage_number} · {stage.name}
              </strong>
              <span>
                {new Date(`${stage.stage_date}T12:00:00`).toLocaleDateString(
                  "pt-BR",
                )}{" "}
                · {stage.route_label || "Percurso a definir"}
              </span>
              {stage.distance_km ? (
                <span>
                  {stage.distance_km} km · {stage.elevation_m ?? "—"} m+
                </span>
              ) : null}
            </div>
          ))}
          <div className="availability">
            <strong>{availability.registered} inscritos</strong>
            <br />
            {availability.remaining === null
              ? "Evento sem limite definido."
              : `${availability.remaining} vagas ainda disponíveis.`}
          </div>
        </aside>
        <article className="form-panel">
          <div className="event-kicker">GARANTA SUA PARTICIPAÇÃO</div>
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
              <h2>Inscreva-se</h2>
              <p>
                {asaasCheckout
                  ? data.test_mode
                    ? `Preencha os dados e simule o checkout no Asaas Sandbox. O pagamento é fictício e será usado apenas para validar a inscrição, o webhook e o painel da organização.`
                    : `Preencha seus dados e continue para o ambiente seguro do Asaas. Pagamento por Pix ou cartão${(event.asaas_max_installments ?? 1) > 1 ? ` em até ${event.asaas_max_installments}x` : ""}. A vaga só será confirmada após o pagamento.`
                  : "Preencha seus dados. Sua categoria será definida automaticamente pelo ano-base do evento."}
              </p>
              <form className="form-grid" onSubmit={submit}>
                <label className="wide">
                  Nome completo
                  <input
                    style={fieldStyle}
                    required
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
                    className="wide"
                    style={{
                      padding: 14,
                      border: "1px solid #c8bcac",
                      background: categoryPreview.error ? "#f3dcd6" : "#fffaf2",
                    }}
                  >
                    <strong>
                      Categoria automática:{" "}
                      {categoryPreview.category ?? "Não elegível"}
                    </strong>
                    <br />
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {categoryPreview.error ??
                        `Idade-base: ${categoryPreview.age} anos em ${event.starts_on.slice(0, 4)}`}
                    </span>
                  </div>
                ) : null}
                {asaasCheckout ? (
                  <div
                    className="wide"
                    style={{
                      padding: 16,
                      border: "1px solid #b65c17",
                      background: "#fff7ec",
                    }}
                  >
                    <strong>
                      {data.pricing.current_lot?.name ?? "Inscrição"}:{" "}
                      {money(pricingPreview?.registrationBaseFeeCents)}
                    </strong>
                    {pricingPreview?.seniorEligible ? (
                      <>
                        <br />
                        <span style={{ color: "#9a4313" }}>
                          Benefício 60+ na inscrição: −{" "}
                          {money(pricingPreview.seniorDiscountCents)}
                        </span>
                      </>
                    ) : null}
                    {form.premium_kit_selected ? (
                      <>
                        <br />
                        <span>
                          Kit Premium:{" "}
                          {money(pricingPreview?.premiumKitFeeCents)}
                        </span>
                      </>
                    ) : null}
                    <br />
                    <strong>
                      Total: {money(pricingPreview?.totalCents)}
                    </strong>
                    <br />
                    <span style={{ fontSize: 12, color: "#666" }}>
                      O pagamento será realizado fora do Legends Engine, no
                      checkout hospedado pelo Asaas. CPF e endereço serão usados
                      na inscrição e enviados ao checkout seguro.
                    </span>
                    {pricingPreview?.seniorEligible ? (
                      <span
                        style={{
                          display: "block",
                          marginTop: 8,
                          fontSize: 12,
                          color: "#666",
                        }}
                      >
                        O desconto de 50% incide somente sobre a inscrição. O Kit
                        Premium mantém o valor integral. Poderá ser solicitado
                        documento com foto para comprovação da idade.
                      </span>
                    ) : null}
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
                  <div
                    className="wide"
                    style={{
                      padding: 16,
                      border: "1px solid #c8bcac",
                      background: "#f5ecdf",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        gridTemplateColumns: "auto 1fr",
                        alignItems: "start",
                        gap: 10,
                      }}
                    >
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
                <label className="website">
                  Não preencher
                  <input
                    tabIndex={-1}
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                  />
                </label>
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
              </form>
            </>
          )}
        </article>
      </section>
    </main>
  );
}
