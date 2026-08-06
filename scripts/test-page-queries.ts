import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.userAccount.findUnique({
    where: { email: "eliraz.guy@gmail.com" }
  });
  if (!user) {
    console.log("User not found!");
    return;
  }

  console.log("Found user:", user.email);

  await prisma.trip.updateMany({
    where: { userId: user.id, status: { not: "ARCHIVED" }, endDate: { lt: new Date() } },
    data: { status: "ARCHIVED" },
  });
  console.log("Archived trips");

  const trips = await prisma.trip.findMany({
    where: {
      status: { not: "ARCHIVED" },
      OR: [
        { userId: user.id },
        { collaborators: { some: { userId: user.id } } },
      ],
    },
    orderBy: { startDate: "asc" },
    include: { _count: { select: { days: true, documents: true } } },
  });
  console.log("Found planned trips:", trips.length);

  const allTrips = await prisma.trip.findMany({ 
    where: { userId: user.id },
    select: { country: true, status: true } 
  });
  console.log("Found all trips:", allTrips.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
