import { PrismaClient } from "@prisma/client";

async function testUrl(url: string, label: string) {
  const client = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    const start = Date.now();
    const count = await client.userAccount.count();
    console.log(`✅ SUCCESS [${label}]: count=${count} (${Date.now() - start}ms)`);
    return true;
  } catch (e: any) {
    console.log(`❌ FAILED [${label}]: ${e?.message?.split("\n")[0]}`);
    return false;
  } finally {
    await client.$disconnect();
  }
}

async function main() {
  const password = "TravelPlanner2026";
  const ref = "uxvjsxsdtshgiaqhzjqz";

  // 1. Direct connection
  await testUrl(`postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres`, "Direct 5432");

  // 2. Direct connection with connect_timeout
  await testUrl(`postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres?connect_timeout=15&sslmode=require`, "Direct 5432 sslmode=require");

  // 3. Pooler session mode (port 5432 on pooler)
  await testUrl(`postgresql://postgres.${ref}:${password}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`, "Pooler AWS 5432");

  // 4. Pooler transaction mode (port 6543 on pooler)
  await testUrl(`postgresql://postgres.${ref}:${password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`, "Pooler AWS 6543 eu-central-1");

  // 5. Pooler transaction mode US East 1
  await testUrl(`postgresql://postgres.${ref}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`, "Pooler AWS 6543 us-east-1");

  // 6. Pooler transaction mode US West 1
  await testUrl(`postgresql://postgres.${ref}:${password}@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`, "Pooler AWS 6543 us-west-1");

  // 7. Pooler transaction mode ap-southeast-1
  await testUrl(`postgresql://postgres.${ref}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`, "Pooler AWS 6543 ap-southeast-1");

  // 8. Direct connection with pool_timeout
  await testUrl(`postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres?connection_limit=5&pool_timeout=10`, "Direct 5432 pool_timeout");
}

main();
