import "server-only";
import { headers } from "next/headers";
import { db } from "./db";
import { sessionSecret } from "./session";
import { hashIp } from "./session-token";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function limitFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

async function clientIpHash() {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return hashIp(ip, sessionSecret());
}

export async function consumeLlmQuota(sessionId: string): Promise<boolean> {
  const ipHash = await clientIpHash();
  const now = Date.now();
  const lastHour = new Date(now - HOUR_MS);

  const [bySession, byIp, global] = await Promise.all([
    db.usageEvent.count({ where: { sessionId, createdAt: { gte: lastHour } } }),
    db.usageEvent.count({ where: { ipHash, createdAt: { gte: lastHour } } }),
    db.usageEvent.count({ where: { createdAt: { gte: new Date(now - DAY_MS) } } }),
  ]);

  if (global >= limitFromEnv("RATE_LIMIT_GLOBAL_DAY", 500)) {
    console.warn("[rate-limit] global daily cap reached");
    return false;
  }
  if (
    bySession >= limitFromEnv("RATE_LIMIT_PER_SESSION_HOUR", 10) ||
    byIp >= limitFromEnv("RATE_LIMIT_PER_IP_HOUR", 30)
  ) {
    return false;
  }

  await db.usageEvent.create({ data: { sessionId, ipHash } });
  return true;
}
