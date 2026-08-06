import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.userAccount.findMany({
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  console.log("All User Accounts in DB:", JSON.stringify(users, null, 2));

  const trips = await prisma.trip.findMany({
    select: { id: true, title: true, userId: true },
  });
  console.log("All Trips in DB:", JSON.stringify(trips, null, 2));
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());
