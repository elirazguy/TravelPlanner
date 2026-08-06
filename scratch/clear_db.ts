import { prisma } from "../src/lib/prisma";

async function clearData() {
  await prisma.hotel.deleteMany();
  await prisma.flight.deleteMany();
  console.log("Cleared hotels and flights.");
}

clearData().catch(console.error);
