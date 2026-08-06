import { PrismaClient } from '@prisma/client';

const directClient = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:TravelPlanner2026@db.uxvjsxsdtshgiaqhzjqz.supabase.co:5432/postgres"
    }
  }
});

const poolerClient = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.uxvjsxsdtshgiaqhzjqz:TravelPlanner2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function test() {
  console.log("Testing Direct Connection...");
  try {
    const usersCount1 = await directClient.userAccount.count();
    console.log("Direct Success! Users count:", usersCount1);
  } catch (e: any) {
    console.error("Direct Failed:", e.message);
  } finally {
    await directClient.$disconnect();
  }

  console.log("\nTesting Pooler Connection...");
  try {
    const usersCount2 = await poolerClient.userAccount.count();
    console.log("Pooler Success! Users count:", usersCount2);
  } catch (e: any) {
    console.error("Pooler Failed:", e.message);
  } finally {
    await poolerClient.$disconnect();
  }
}

test();
