import { PrismaClient } from "@prisma/client";

function getConnectionString(): string | undefined {
  const urlStr = process.env.DATABASE_URL;
  if (!urlStr) return undefined;

  try {
    const url = new URL(urlStr);

    // Clean up pgbouncer param if present
    url.searchParams.delete("pgbouncer");

    // Ensure timeouts for reliable Vercel cold starts
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "30");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
    }

    return url.toString();
  } catch (e) {
    return urlStr;
  }
}

const dbUrl = getConnectionString();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
