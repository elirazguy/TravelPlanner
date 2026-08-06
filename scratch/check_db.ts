import { prisma } from "../src/lib/prisma";

async function checkData() {
  const hotels = await prisma.hotel.findMany();
  const flights = await prisma.flight.findMany();
  
  console.log("Hotels:", hotels);
  console.log("Flights:", flights);
}

checkData().catch(console.error);
