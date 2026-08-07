import { PrismaClient } from "@prisma/client";

function buildUrl(): string | undefined {
  const urlStr = process.env.DATABASE_URL;
  if (!urlStr) return undefined;

  try {
    const url = new URL(urlStr);

    // Transaction pooler (port 6543) requires pgbouncer=true
    if (url.port === "6543") {
      url.searchParams.set("pgbouncer", "true");
    }

    // Aggressive timeouts for Vercel serverless cold starts
    url.searchParams.set("connect_timeout", "10");
    url.searchParams.set("pool_timeout", "10");
    // Limit connections — Vercel spawns many lambdas simultaneously
    url.searchParams.set("connection_limit", "1");

    return url.toString();
  } catch {
    return urlStr;
  }
}

const dbUrl = buildUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// In production (Vercel), do NOT cache the client on globalThis —
// each Lambda invocation should create its own short-lived connection.
// In development, reuse to avoid "too many connections" during hot reload.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
