import "server-only";

type CheckoutInput = {
  registrationId: string;
  eventSlug: string;
  eventName: string;
  modality: "gravel_race" | "experience";
  registrationFeeCents: number;
  seniorDiscountApplied?: boolean;
  premiumKit?: {
    feeCents: number;
    jerseySize: string;
  } | null;
  expiresMinutes: number;
  maxInstallments: number;
  internalTestMode?: boolean;
  customer: {
    name: string;
    email: string;
    phone: string;
    cpfCnpj: string;
    address: string;
    addressNumber: string;
    complement?: string;
    postalCode: string;
    province: string;
  };
};

type AsaasCheckoutResponse = {
  id?: string;
  link?: string | null;
  status?: string;
  errors?: Array<{ code?: string; description?: string }>;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} não está configurada.`);
  return value;
}

function environment() {
  return process.env.ASAAS_ENVIRONMENT?.trim().toLowerCase() === "production"
    ? "production"
    : "sandbox";
}

export function isAsaasSandboxEnvironment() {
  return environment() === "sandbox";
}

export function asaasApiBaseUrl() {
  return environment() === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

export function asaasCheckoutUrl(checkoutId: string) {
  const host =
    environment() === "production"
      ? "https://asaas.com"
      : "https://sandbox.asaas.com";
  return `${host}/checkoutSession/show/${encodeURIComponent(checkoutId)}`;
}

export function asaasExternalReference(registrationId: string) {
  return `legends-registration:${registrationId}`;
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://www.legendsbikerace.com.br"
  ).replace(/\/+$/, "");
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function checkoutItemName(value: string) {
  return Array.from(value.trim()).slice(0, 30).join("");
}

export async function createAsaasCheckout(
  input: CheckoutInput,
  fetcher: typeof fetch = fetch,
) {
  const maxInstallments = Math.min(
    21,
    Math.max(1, Math.round(input.maxInstallments)),
  );
  const expiresMinutes = Math.min(
    1440,
    Math.max(10, Math.round(input.expiresMinutes)),
  );
  const callbackUrl = `${siteUrl()}/eventos/${encodeURIComponent(input.eventSlug)}/pagamento`;
  const callbackQuery = input.internalTestMode ? "?modo=teste&" : "?";
  const chargeTypes =
    maxInstallments > 1 ? ["DETACHED", "INSTALLMENT"] : ["DETACHED"];
  const payload: Record<string, unknown> = {
    billingTypes: ["PIX", "CREDIT_CARD"],
    chargeTypes,
    minutesToExpire: expiresMinutes,
    externalReference: asaasExternalReference(input.registrationId),
    callback: {
      successUrl: `${callbackUrl}${callbackQuery}resultado=sucesso`,
      cancelUrl: `${callbackUrl}${callbackQuery}resultado=cancelado`,
      expiredUrl: `${callbackUrl}${callbackQuery}resultado=expirado`,
    },
    items: [
      {
        externalReference: `registration-${input.registrationId}`,
        name: checkoutItemName(
          input.seniorDiscountApplied
            ? `Inscrição ${input.eventName} 60+`
            : `Inscrição ${input.eventName}`,
        ),
        description:
          input.modality === "experience"
            ? "Modalidade Experience"
            : "Modalidade Gravel Race",
        quantity: 1,
        value: input.registrationFeeCents / 100,
      },
      ...(input.premiumKit
        ? [
            {
              externalReference: `premium-kit-${input.registrationId}`,
              name: checkoutItemName(`Kit Premium ${input.eventName}`),
              description: `Jersey de ciclismo — tamanho ${input.premiumKit.jerseySize}`,
              quantity: 1,
              value: input.premiumKit.feeCents / 100,
            },
          ]
        : []),
    ],
    customerData: {
      name: input.customer.name,
      cpfCnpj: digits(input.customer.cpfCnpj),
      email: input.customer.email,
      phone: digits(input.customer.phone),
      address: input.customer.address,
      addressNumber: input.customer.addressNumber,
      complement: input.customer.complement || undefined,
      postalCode: digits(input.customer.postalCode),
      province: input.customer.province,
    },
  };
  if (maxInstallments > 1)
    payload.installment = { maxInstallmentCount: maxInstallments };

  const response = await fetcher(`${asaasApiBaseUrl()}/checkouts`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: required("ASAAS_API_KEY"),
      "user-agent": "Legends-Bike-Race/1.0",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = (await response
    .json()
    .catch(() => ({}))) as AsaasCheckoutResponse;
  if (!response.ok || !body.id) {
    const detail = body.errors
      ?.map((item) => item.description || item.code)
      .filter(Boolean)
      .join(" ");
    throw new Error(
      detail ||
        `O Asaas recusou a criação do checkout (HTTP ${response.status}).`,
    );
  }
  return {
    id: body.id,
    status: body.status || "ACTIVE",
    url: body.link || asaasCheckoutUrl(body.id),
    expiresAt: new Date(Date.now() + expiresMinutes * 60_000).toISOString(),
  };
}

export async function cancelAsaasCheckout(
  checkoutId: string,
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(
    `${asaasApiBaseUrl()}/checkouts/${encodeURIComponent(checkoutId)}/cancel`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        access_token: required("ASAAS_API_KEY"),
        "user-agent": "Legends-Bike-Race/1.0",
      },
      cache: "no-store",
    },
  );
  if (!response.ok && response.status !== 404) {
    const body = (await response
      .json()
      .catch(() => ({}))) as AsaasCheckoutResponse;
    const detail = body.errors
      ?.map((item) => item.description || item.code)
      .filter(Boolean)
      .join(" ");
    throw new Error(
      detail ||
        `Não foi possível cancelar o checkout Asaas (HTTP ${response.status}).`,
    );
  }
}

export function readAsaasWebhookToken() {
  return required("ASAAS_WEBHOOK_TOKEN");
}
