import assert from "node:assert/strict";
import test from "node:test";
import {
  activeRegistrationLot,
  calculateRegistrationPricing,
  isApparelSize,
  nextRegistrationLot,
  registrationLotForMode,
  type RegistrationLot,
} from "./registration-pricing";

const lots: RegistrationLot[] = [
  {
    id: "lot-1",
    name: "Lote 01",
    starts_at: "2026-08-18T03:00:00.000Z",
    ends_at: "2026-09-21T02:59:59.000Z",
    registration_fee_cents: 119900,
    display_order: 1,
  },
  {
    id: "lot-2",
    name: "Lote 02",
    starts_at: "2026-09-21T03:00:00.000Z",
    ends_at: "2026-12-11T02:59:59.000Z",
    registration_fee_cents: 139900,
    display_order: 2,
  },
];

test("seleciona o lote ativo e o próximo lote", () => {
  assert.equal(
    activeRegistrationLot(lots, new Date("2026-08-20T12:00:00.000Z"))?.id,
    "lot-1",
  );
  assert.equal(
    nextRegistrationLot(lots, new Date("2026-08-01T12:00:00.000Z"))?.id,
    "lot-1",
  );
});

test("modo interno usa o primeiro lote antes da abertura sem mudar as datas", () => {
  const beforeOpening = new Date("2026-07-29T12:00:00.000Z");
  assert.equal(registrationLotForMode(lots, { now: beforeOpening }), null);
  assert.equal(
    registrationLotForMode(lots, {
      now: beforeOpening,
      internalTestMode: true,
    })?.id,
    "lot-1",
  );
  assert.equal(lots[0].starts_at, "2026-08-18T03:00:00.000Z");
});

test("aplica 50% apenas à inscrição de pessoa com 60 anos", () => {
  const pricing = calculateRegistrationPricing({
    baseFeeCents: 119900,
    birthDate: "1967-04-22",
    eventDate: "2027-04-22",
    seniorDiscountEnabled: true,
    seniorDiscountPercent: 50,
    premiumKitSelected: true,
    premiumKitFeeCents: 34900,
  });
  assert.equal(pricing.age, 60);
  assert.equal(pricing.seniorEligible, true);
  assert.equal(pricing.seniorDiscountCents, 59950);
  assert.equal(pricing.discountedRegistrationFeeCents, 59950);
  assert.equal(pricing.premiumKitFeeCents, 34900);
  assert.equal(pricing.totalCents, 94850);
});

test("não antecipa o benefício antes do aniversário de 60 anos", () => {
  const pricing = calculateRegistrationPricing({
    baseFeeCents: 119900,
    birthDate: "1967-04-23",
    eventDate: "2027-04-22",
    seniorDiscountEnabled: true,
    premiumKitSelected: false,
  });
  assert.equal(pricing.age, 59);
  assert.equal(pricing.seniorDiscountCents, 0);
  assert.equal(pricing.totalCents, 119900);
});

test("valida somente os tamanhos oficiais", () => {
  assert.equal(isApparelSize("PP"), true);
  assert.equal(isApparelSize("GG"), true);
  assert.equal(isApparelSize("XG"), false);
});
