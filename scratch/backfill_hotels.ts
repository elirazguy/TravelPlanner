import { prisma } from "../src/lib/prisma";
import { searchPlaces } from "../src/lib/places";

async function run() {
  const hotels = await prisma.hotel.findMany({
    where: { OR: [{ lat: null }, { lng: null }] }
  });

  console.log(`Found ${hotels.length} hotels without coordinates.`);

  for (const hotel of hotels) {
    const query = `${hotel.name} ${hotel.address || ""}`.trim();
    console.log(`Geocoding: ${query}`);
    
    // Using a broad search
    const results = await searchPlaces(query);
    if (results && results.length > 0 && results[0].lat != null && results[0].lng != null) {
      await prisma.hotel.update({
        where: { id: hotel.id },
        data: {
          lat: results[0].lat,
          lng: results[0].lng,
          address: hotel.address || results[0].address
        }
      });
      console.log(`✅ Updated ${hotel.name} -> lat: ${results[0].lat}, lng: ${results[0].lng}`);
    } else {
      console.log(`❌ Could not find coordinates for ${hotel.name}`);
    }
  }
}

run().catch(console.error).finally(() => process.exit(0));
