import { ageOnDate } from "@/lib/category-rules";

export const APPAREL_SIZES = ["PP", "P", "M", "G", "GG"] as const;
export type ApparelSize = (typeof APPAREL_SIZES)[number];

export type RegistrationLot = {
  id: string;
  event_id?: string;
  name: string;
  starts_at: string;
  ends_at: string;
  registration_fee_cents: number;
  display_order: number;
};

export function isApparelSize(value: unknown): value is ApparelSize {
  return APPAREL_SIZES.includes(String(value) as ApparelSize);
}

export function activeRegistrationLot(
  lots: RegistrationLot[],
  now = new Date(),
) {
  const timestamp = now.getTime();
  return (
    lots.find(
      (lot) =>
        new Date(lot.starts_at).getTime() <= timestamp &&
        new Date(lot.ends_at).getTime() >= timestamp,
    ) ?? null
  );
}

export function nextRegistrationLot(
  lots: RegistrationLot[],
  now = new Date(),
) {
  const timestamp = now.getTime();
  return (
    [...lots]
      .filter((lot) => new Date(lot.starts_at).getTime() > timestamp)
      .sort(
        (left, right) =>
          new Date(left.starts_at).getTime() -
          new Date(right.starts_at).getTime(),
      )[0] ?? null
  );
}

export function calculateRegistrationPricing(input: {
  baseFeeCents: number;
  birthDate: string;
  eventDate: string;
  seniorDiscountEnabled: boolean;
  seniorDiscountPercent?: number | null;
  premiumKitSelected: boolean;
  premiumKitFeeCents?: number | null;
}) {
  const age = ageOnDate(input.birthDate, input.eventDate);
  if (age === null) throw new Error("Data de nascimento inválida.");
  const seniorEligible = input.seniorDiscountEnabled && age >= 60;
  const discountPercent = seniorEligible
    ? Math.min(100, Math.max(0, input.seniorDiscountPercent ?? 50))
    : 0;
  // Arredondar para cima garante que um valor com centavos ímpares nunca
  // resulte em desconto inferior ao percentual mínimo configurado.
  const seniorDiscountCents = seniorEligible
    ? Math.ceil((input.baseFeeCents * discountPercent) / 100)
    : 0;
  const premiumKitFeeCents = input.premiumKitSelected
    ? Math.max(0, input.premiumKitFeeCents ?? 0)
    : 0;
  const discountedRegistrationFeeCents =
    input.baseFeeCents - seniorDiscountCents;
  return {
    age,
    seniorEligible,
    discountPercent,
    registrationBaseFeeCents: input.baseFeeCents,
    seniorDiscountCents,
    discountedRegistrationFeeCents,
    premiumKitFeeCents,
    totalCents: discountedRegistrationFeeCents + premiumKitFeeCents,
  };
}
