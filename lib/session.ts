import "server-only";
import { cookies } from "next/headers";
import { newSessionId, signSessionId, verifySessionToken } from "./session-token";

const COOKIE_NAME = "cvo_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short (minimum 32 characters).");
  }
  return secret;
}

export async function getSessionId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? verifySessionToken(token, sessionSecret()) : null;
}

export async function getOrCreateSessionId(): Promise<string> {
  const existing = await getSessionId();
  if (existing) return existing;

  const sessionId = newSessionId();
  (await cookies()).set(COOKIE_NAME, signSessionId(sessionId, sessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return sessionId;
}
