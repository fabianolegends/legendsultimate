import assert from "node:assert/strict";
import test from "node:test";
import { mapAsaasEventToRegistrationUpdate, registrationIdFromExternalReference } from "./asaas-webhook";

test("reconcilia a referência externa de uma inscrição", () => {
  assert.equal(
    registrationIdFromExternalReference("legends-registration:7e48819c-d20a-4a45-9ed8-7eb553d9986f"),
    "7e48819c-d20a-4a45-9ed8-7eb553d9986f",
  );
  assert.equal(registrationIdFromExternalReference("pedido-123"), null);
});

test("confirma a inscrição somente após evento pago", () => {
  const update = mapAsaasEventToRegistrationUpdate("CHECKOUT_PAID", "2026-08-20T10:00:00.000Z");
  assert.equal(update?.status, "confirmed");
  assert.equal(update?.payment_status, "paid");
  assert.equal(update?.payment_checkout_status, "PAID");
  assert.equal(update?.payment_confirmed_at, "2026-08-20T10:00:00.000Z");
});

test("libera a vaga quando o checkout expira", () => {
  const update = mapAsaasEventToRegistrationUpdate("CHECKOUT_EXPIRED", "2026-08-20T12:00:00.000Z");
  assert.equal(update?.status, "cancelled");
  assert.equal(update?.payment_status, "cancelled");
  assert.equal(update?.payment_checkout_status, "EXPIRED");
});

test("não altera a inscrição para eventos desconhecidos", () => {
  assert.equal(mapAsaasEventToRegistrationUpdate("CHECKOUT_VIEWED"), null);
});
