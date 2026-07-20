import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type EncryptedToken = {
  ciphertext: string;
  iv: string;
  tag: string;
};

function encryptionKey() {
  const configured = process.env.ACTIVITY_TOKEN_ENCRYPTION_KEY?.trim();
  if (configured) {
    const base64 = Buffer.from(configured, "base64");
    if (base64.length === 32) return base64;
    if (/^[0-9a-f]{64}$/i.test(configured)) return Buffer.from(configured, "hex");
    throw new Error("ACTIVITY_TOKEN_ENCRYPTION_KEY deve conter 32 bytes em base64 ou 64 caracteres hexadecimais.");
  }

  const clientSecret = process.env.RIDE_WITH_GPS_CLIENT_SECRET?.trim();
  if (!clientSecret) throw new Error("A chave de criptografia das atividades não está configurada.");
  return createHash("sha256").update(`legends-activity-token:${clientSecret}`).digest();
}

export function encryptActivityToken(token: string): EncryptedToken {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptActivityToken(input: EncryptedToken) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(input.iv, "base64"));
  decipher.setAuthTag(Buffer.from(input.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(input.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
