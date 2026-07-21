import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "legends_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type AdminRole = "owner" | "director" | "steward" | "viewer";
export type AdminPermission =
  | "users.manage"
  | "events.manage"
  | "registrations.manage"
  | "routes.manage"
  | "results.review"
  | "results.publish"
  | "audit.view"
  | "backups.create";

export type AdminSession = {
  userId: string | null;
  email: string;
  name: string;
  role: AdminRole;
  expiresAt: number;
  legacy?: boolean;
};

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  owner: ["users.manage", "events.manage", "registrations.manage", "routes.manage", "results.review", "results.publish", "audit.view", "backups.create"],
  director: ["events.manage", "registrations.manage", "routes.manage", "results.review", "results.publish", "audit.view", "backups.create"],
  steward: ["results.review", "audit.view"],
  viewer: ["audit.view"],
};

function sessionSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) throw new Error("Admin session secret is not configured.");
  return secret;
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
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
  return Boolean(expected && candidate && equalText(candidate, expected));
}

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt:${salt}:${hash}`;
}

export function verifyAdminPasswordHash(password: string, stored: string) {
  const [algorithm, salt, expected] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !expected || !password) return false;
  return equalText(scryptSync(password, salt, 64).toString("base64url"), expected);
}

export function createAdminSession(identity?: Omit<AdminSession, "expiresAt">) {
  const session: AdminSession = identity
    ? { ...identity, expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }
    : { userId: null, email: "contingencia", name: "Acesso de contingência", role: "owner", legacy: true, expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { token: `${payload}.${signature(payload)}`, maxAge: SESSION_TTL_SECONDS };
}

export function getAdminSession(token?: string | null): AdminSession | null {
  if (!token) return null;
  const [payload, receivedSignature] = token.split(".");
  if (!payload || !receivedSignature || !equalText(receivedSignature, signature(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!parsed.expiresAt || parsed.expiresAt <= Math.floor(Date.now() / 1000) || !ROLE_PERMISSIONS[parsed.role]) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function verifyAdminSession(token?: string | null) {
  return Boolean(getAdminSession(token));
}

export function hasAdminPermission(session: AdminSession | null, permission?: AdminPermission) {
  return Boolean(session && (!permission || ROLE_PERMISSIONS[session.role].includes(permission)));
}

export function adminSessionFromRequest(request: NextRequest) {
  return getAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export function isAdminRequest(request: NextRequest, permission?: AdminPermission) {
  return hasAdminPermission(adminSessionFromRequest(request), permission);
}
