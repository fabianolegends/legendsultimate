export type BrazilianPostalAddress = {
  postalCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  country: "Brasil";
};

export function normalizeBrazilianPostalCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatBrazilianPostalCode(value: string) {
  const digits = normalizeBrazilianPostalCode(value);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

export function parseViaCepResponse(
  payload: unknown,
): BrazilianPostalAddress | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  if (data.erro === true || data.erro === "true") return null;
  const postalCode = formatBrazilianPostalCode(String(data.cep ?? ""));
  const city = String(data.localidade ?? "").trim();
  const state = String(data.uf ?? "").trim().toUpperCase();
  if (!postalCode || !city || state.length !== 2) return null;
  return {
    postalCode,
    street: String(data.logradouro ?? "").trim(),
    neighborhood: String(data.bairro ?? "").trim(),
    city,
    state,
    country: "Brasil",
  };
}

export async function lookupBrazilianPostalCode(
  value: string,
): Promise<BrazilianPostalAddress> {
  const postalCode = normalizeBrazilianPostalCode(value);
  if (postalCode.length !== 8)
    throw new Error("Informe um CEP válido com 8 números.");
  const response = await fetch(
    `https://viacep.com.br/ws/${postalCode}/json/`,
    { cache: "no-store" },
  );
  if (!response.ok)
    throw new Error("Não foi possível consultar o CEP agora.");
  const address = parseViaCepResponse(await response.json());
  if (!address) throw new Error("CEP não encontrado.");
  return address;
}
