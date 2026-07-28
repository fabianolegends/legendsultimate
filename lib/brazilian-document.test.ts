import assert from "node:assert/strict";
import test from "node:test";
import {
  digitsOnly,
  isValidCnpj,
  isValidCpf,
  isValidCpfCnpj,
} from "./brazilian-document";

test("remove a formatação de documentos", () => {
  assert.equal(digitsOnly("249.715.637-92"), "24971563792");
});

test("valida CPF e rejeita sequências repetidas", () => {
  assert.equal(isValidCpf("249.715.637-92"), true);
  assert.equal(isValidCpf("249.715.637-91"), false);
  assert.equal(isValidCpf("111.111.111-11"), false);
});

test("valida CNPJ", () => {
  assert.equal(isValidCnpj("11.222.333/0001-81"), true);
  assert.equal(isValidCnpj("11.222.333/0001-80"), false);
});

test("aceita CPF ou CNPJ", () => {
  assert.equal(isValidCpfCnpj("24971563792"), true);
  assert.equal(isValidCpfCnpj("11222333000181"), true);
  assert.equal(isValidCpfCnpj("123"), false);
});
