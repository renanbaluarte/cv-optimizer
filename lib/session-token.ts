import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function hmac(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function newSessionId() {
  return randomUUID();
}

export function signSessionId(sessionId: string, secret: string) {
  return `${sessionId}.${hmac(sessionId, secret)}`;
}

export function verifySessionToken(token: string, secret: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [sessionId, signature] = parts;
  if (!UUID_V4.test(sessionId)) return null;

  const expected = Buffer.from(hmac(sessionId, secret));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? sessionId : null;
}

export function hashIp(ip: string, secret: string) {
  return hmac(`ip:${ip}`, secret);
}
