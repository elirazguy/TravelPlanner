import { PrismaClient } from "@prisma/client";

async function testConnection(url: string, name: string) {
  console.log(`Testing connection for ${name}: ${url}`);
  const client = new PrismaClient({
    datasources: {
      db: { url },
    },
  });

  try {
    const userCount = await client.userAccount.count();
    console.log(`✅ [${name}] Success! User count: ${userCount}`);
  } catch (err: any) {
    console.error(`❌ [${name}] Failed:`, err?.message || err);
  } finally {
    await client.$disconnect();
  }
}

async function main() {
  const direct5432 = "postgresql://postgres:TravelPlanner2026@db.uxvjsxsdtshgiaqhzjqz.supabase.co:5432/postgres";
  const pooler6543 = "postgresql://postgres:TravelPlanner2026@db.uxvjsxsdtshgiaqhzjqz.supabase.co:6543/postgres?pgbouncer=true";
  const pooler6543WithLimit = "postgresql://postgres:TravelPlanner2026@db.uxvjsxsdtshgiaqhzjqz.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1";
  const poolerAws = "postgresql://postgres.uxvjsxsdtshgiaqhzjqz:TravelPlanner2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

  await testConnection(direct5432, "Direct 5432");
  await testConnection(pooler6543, "Pooler 6543");
  await testConnection(pooler6543WithLimit, "Pooler 6543 with limit");
  await testConnection(poolerAws, "Pooler AWS 6543");
}

main();
