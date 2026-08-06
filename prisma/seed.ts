import { PrismaClient } from "@prisma/client";
import { colorForDay } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sample trips...");

  // ── Upcoming trip: Tokyo ──────────────────────────────────────────────────
  const tokyoStart = new Date();
  tokyoStart.setDate(tokyoStart.getDate() + 30);
  const tokyoEnd = new Date(tokyoStart);
  tokyoEnd.setDate(tokyoEnd.getDate() + 4); // 5 days

  const tokyo = await prisma.trip.create({
    data: {
      title: "Cherry Blossoms in Tokyo",
      destination: "Tokyo, Japan",
      country: "Japan",
      startDate: tokyoStart,
      endDate: tokyoEnd,
      status: "UPCOMING",
      notes: "First time in Japan. Love food, design, and quiet temples.",
      mapCenterLat: 35.6762,
      mapCenterLng: 139.6503,
      coverImage:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
      days: {
        create: Array.from({ length: 5 }).map((_, i) => {
          const d = new Date(tokyoStart);
          d.setDate(d.getDate() + i);
          return { date: d, dayNumber: i + 1, colorHex: colorForDay(i + 1) };
        }),
      },
      hotels: {
        create: [
          {
            name: "Park Hyatt Tokyo",
            address: "3-7-1-2 Nishi Shinjuku, Shinjuku-ku, Tokyo 163-1055",
            phone: "+81 3-5322-1234",
            website: "https://www.hyatt.com/park-hyatt/tyoph-park-hyatt-tokyo",
            confirmationNumber: "PHT-88231",
            checkInDate: tokyoStart,
            checkOutDate: tokyoEnd,
            lat: 35.6855,
            lng: 139.6907,
          },
        ],
      },
      flights: {
        create: [
          {
            flightNumber: "JL44",
            airline: "Japan Airlines",
            departureAirport: "LHR",
            arrivalAirport: "HND",
            flightDate: tokyoStart,
          },
        ],
      },
    },
    include: { days: true },
  });

  const d1 = tokyo.days.find((d) => d.dayNumber === 1)!;
  const d2 = tokyo.days.find((d) => d.dayNumber === 2)!;

  await prisma.event.createMany({
    data: [
      {
        dayId: d1.id,
        title: "Senso-ji Temple",
        category: "SIGHTSEEING",
        startTime: "09:30",
        locationName: "Senso-ji",
        address: "2-3-1 Asakusa, Taito City, Tokyo",
        lat: 35.7148,
        lng: 139.7967,
        orderIndex: 0,
      },
      {
        dayId: d1.id,
        title: "Lunch — Tonkatsu in Asakusa",
        category: "FOOD",
        startTime: "12:30",
        locationName: "Asakusa",
        lat: 35.7119,
        lng: 139.7965,
        orderIndex: 1,
      },
      {
        dayId: d2.id,
        title: "teamLab Planets",
        category: "ACTIVITY",
        startTime: "10:00",
        locationName: "Toyosu",
        lat: 35.6494,
        lng: 139.7895,
        orderIndex: 0,
      },
    ],
  });

  // ── Archived trip: Rome ───────────────────────────────────────────────────
  const romeStart = new Date();
  romeStart.setMonth(romeStart.getMonth() - 6);
  const romeEnd = new Date(romeStart);
  romeEnd.setDate(romeEnd.getDate() + 3);

  await prisma.trip.create({
    data: {
      title: "Long Weekend in Rome",
      destination: "Rome, Italy",
      country: "Italy",
      startDate: romeStart,
      endDate: romeEnd,
      status: "ARCHIVED",
      notes: "History, pasta, and people-watching.",
      mapCenterLat: 41.9028,
      mapCenterLng: 12.4964,
      coverImage:
        "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
      days: {
        create: Array.from({ length: 4 }).map((_, i) => {
          const d = new Date(romeStart);
          d.setDate(d.getDate() + i);
          return { date: d, dayNumber: i + 1, colorHex: colorForDay(i + 1) };
        }),
      },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
