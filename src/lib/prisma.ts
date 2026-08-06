import { PrismaClient } from "@prisma/client";

function getConnectionString(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Convert Supabase direct port 5432 to connection pooler port 6543 for Vercel serverless
  if (url.includes(".supabase.co:5432")) {
    url = url.replace(".supabase.co:5432", ".supabase.co:6543");
    if (!url.includes("pgbouncer=true")) {
      url += (url.includes("?") ? "&" : "?") + "pgbouncer=true&connection_limit=1";
    }
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
