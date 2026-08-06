import { PrismaClient } from "@prisma/client";

function getConnectionString(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Revert any port 6543 back to official working Supabase port 5432
  if (url.includes(".supabase.co:6543")) {
    url = url.replace(".supabase.co:6543", ".supabase.co:5432");
  }

  // Clean up pgbouncer param if present
  url = url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "");

  // Ensure connect_timeout=30 and pool_timeout=30 for reliable Vercel cold starts
  if (!url.includes("connect_timeout=")) {
    url += (url.includes("?") ? "&" : "?") + "connect_timeout=30&pool_timeout=30";
  }

  return url;
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
