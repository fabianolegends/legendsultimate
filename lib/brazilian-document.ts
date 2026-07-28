export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function hasValidCheckDigits(value: string, factors: number[]) {
  const sum = factors.reduce(
    (total, factor, index) => total + Number(value[index]) * factor,
    0,
  );
  const remainder = sum % 11;
  const digit = remainder < 2 ? 0 : 11 - remainder;
  return digit === Number(value[factors.length]);
}

export function isValidCpf(value: string) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  return (
    hasValidCheckDigits(cpf, [10, 9, 8, 7, 6, 5, 4, 3, 2]) &&
    hasValidCheckDigits(cpf, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  );
}

export function isValidCnpj(value: string) {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  return (
    hasValidCheckDigits(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) &&
    hasValidCheckDigits(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  );
}

export function isValidCpfCnpj(value: string) {
  const document = digitsOnly(value);
  return document.length === 11 ? isValidCpf(document) : isValidCnpj(document);
}
