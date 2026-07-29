import assert from "node:assert/strict";
import test from "node:test";
import {
  formatBrazilianPostalCode,
  normalizeBrazilianPostalCode,
  parseViaCepResponse,
} from "./viacep";

test("normaliza e formata CEP brasileiro", () => {
  assert.equal(normalizeBrazilianPostalCode("95.150-000"), "95150000");
  assert.equal(formatBrazilianPostalCode("95150000"), "95150-000");
  assert.equal(formatBrazilianPostalCode("9515"), "9515");
});

test("converte a resposta do ViaCEP em campos separados", () => {
  assert.deepEqual(
    parseViaCepResponse({
      cep: "01001-000",
      logradouro: "Praça da Sé",
      bairro: "Sé",
      localidade: "São Paulo",
      uf: "SP",
    }),
    {
      postalCode: "01001-000",
      street: "Praça da Sé",
      neighborhood: "Sé",
      city: "São Paulo",
      state: "SP",
      country: "Brasil",
    },
  );
});

test("rejeita CEP inexistente ou resposta incompleta", () => {
  assert.equal(parseViaCepResponse({ erro: true }), null);
  assert.equal(parseViaCepResponse({ cep: "01001-000" }), null);
});
