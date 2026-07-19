import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "legends_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function sessionSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) throw new Error("Admin session secret is not configured.");
  return secret;
}

function signature(expiresAt: number) {
  return createHmac("sha256", sessionSecret())
    .update(`legends-admin:${expiresAt}`)
    .digest("base64url");
}

function equalText(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function isAdminPasswordConfigured() {
  return Boolean(process.env.LEGENDS_ADMIN_PASSWORD?.trim());
}

export function verifyAdminPassword(candidate: string) {
  const expected = process.env.LEGENDS_ADMIN_PASSWORD?.trim();
  if (!expected || !candidate) return false;
  return equalText(candidate, expected);
}

export function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return {
    token: `${expiresAt}.${signature(expiresAt)}`,
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function verifyAdminSession(token?: string | null) {
  if (!token) return false;
  const [expiresRaw, receivedSignature] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000) || !receivedSignature) {
    return false;
  }
  return equalText(receivedSignature, signature(expiresAt));
}

export function isAdminRequest(request: NextRequest) {
  return verifyAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}
