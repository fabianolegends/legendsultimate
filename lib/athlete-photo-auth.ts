import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ATHLETE_PHOTO_COOKIE = "legends_athlete_photo_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type AthletePhotoSession = {
  registrationId: string;
  eventId: string;
  email: string;
  fullName: string;
  expiresAt: number;
};

function secret() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!value) throw new Error("A chave de sessão da área do atleta não está configurada.");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function equal(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function createAthletePhotoSession(
  identity: Omit<AthletePhotoSession, "expiresAt">,
) {
  const session: AthletePhotoSession = {
    ...identity,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, maxAge: SESSION_TTL_SECONDS };
}

export function readAthletePhotoSession(token?: string | null) {
  if (!token) return null;
  const [payload, receivedSignature] = token.split(".");
  if (!payload || !receivedSignature || !equal(receivedSignature, sign(payload))) return null;
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AthletePhotoSession;
    if (
      !session.registrationId ||
      !session.eventId ||
      !session.email ||
      !session.expiresAt ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    )
      return null;
    return session;
  } catch {
    return null;
  }
}

export function athletePhotoSessionFromRequest(request: NextRequest) {
  return readAthletePhotoSession(
    request.cookies.get(ATHLETE_PHOTO_COOKIE)?.value,
  );
}

export function setAthletePhotoSessionCookie(
  response: NextResponse,
  token: string,
  maxAge: number,
) {
  response.cookies.set(ATHLETE_PHOTO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearAthletePhotoSessionCookie(response: NextResponse) {
  response.cookies.set(ATHLETE_PHOTO_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function loginAttemptKey(email: string, ip: string) {
  return createHmac("sha256", secret())
    .update(`${email.toLowerCase()}:${ip}`)
    .digest("hex");
}

export function secureCredentialMatch(candidate: string, expected: string) {
  return equal(candidate, expected);
}
