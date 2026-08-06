import { DatabaseSync } from "node:sqlite";
import path from "path";
import { prisma as postgresPrisma } from "../src/lib/prisma";

function parseDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return !isNaN(d.getTime()) ? d : null;
}

async function migrateData() {
  console.log("Starting data migration from dev.db to Supabase PostgreSQL...");

  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const sqlite = new DatabaseSync(dbPath);

  try {
    // 1. Users
    const users = sqlite.prepare("SELECT * FROM UserAccount").all() as any[];
    console.log(`Migrating ${users.length} users...`);
    for (const u of users) {
      await postgresPrisma.userAccount.upsert({
        where: { id: u.id },
        update: {
          email: u.email,
          name: u.name,
          picture: u.picture,
          passwordHash: u.passwordHash,
          googleAccessToken: u.googleAccessToken,
          googleRefreshToken: u.googleRefreshToken,
          tokenExpiresAt: parseDate(u.tokenExpiresAt),
          updatedAt: parseDate(u.updatedAt) || new Date(),
        },
        create: {
          id: u.id,
          email: u.email,
          name: u.name,
          picture: u.picture,
          passwordHash: u.passwordHash,
          googleAccessToken: u.googleAccessToken,
          googleRefreshToken: u.googleRefreshToken,
          tokenExpiresAt: parseDate(u.tokenExpiresAt),
          updatedAt: parseDate(u.updatedAt) || new Date(),
        },
      });
    }

    // 2. Trips
    const trips = sqlite.prepare("SELECT * FROM Trip").all() as any[];
    console.log(`Migrating ${trips.length} trips...`);
    for (const t of trips) {
      await postgresPrisma.trip.upsert({
        where: { id: t.id },
        update: {
          userId: t.userId,
          title: t.title,
          destination: t.destination,
          country: t.country,
          coverImage: t.coverImage,
          startDate: parseDate(t.startDate) || new Date(),
          endDate: parseDate(t.endDate) || new Date(),
          status: t.status,
          isPublic: Boolean(t.isPublic),
          cloneCount: t.cloneCount,
          inviteCode: t.inviteCode,
          notes: t.notes,
          mapCenterLat: t.mapCenterLat,
          mapCenterLng: t.mapCenterLng,
          createdAt: parseDate(t.createdAt) || new Date(),
          updatedAt: parseDate(t.updatedAt) || new Date(),
        },
        create: {
          id: t.id,
          userId: t.userId,
          title: t.title,
          destination: t.destination,
          country: t.country,
          coverImage: t.coverImage,
          startDate: parseDate(t.startDate) || new Date(),
          endDate: parseDate(t.endDate) || new Date(),
          status: t.status,
          isPublic: Boolean(t.isPublic),
          cloneCount: t.cloneCount,
          inviteCode: t.inviteCode,
          notes: t.notes,
          mapCenterLat: t.mapCenterLat,
          mapCenterLng: t.mapCenterLng,
          createdAt: parseDate(t.createdAt) || new Date(),
          updatedAt: parseDate(t.updatedAt) || new Date(),
        },
      });
    }

    // 3. Days
    const days = sqlite.prepare("SELECT * FROM Day").all() as any[];
    console.log(`Migrating ${days.length} days...`);
    for (const d of days) {
      await postgresPrisma.day.upsert({
        where: { id: d.id },
        update: {
          tripId: d.tripId,
          date: parseDate(d.date) || new Date(),
          dayNumber: d.dayNumber,
          colorHex: d.colorHex,
          notes: d.notes,
        },
        create: {
          id: d.id,
          tripId: d.tripId,
          date: parseDate(d.date) || new Date(),
          dayNumber: d.dayNumber,
          colorHex: d.colorHex,
          notes: d.notes,
        },
      });
    }

    // 4. Events
    const events = sqlite.prepare("SELECT * FROM Event").all() as any[];
    console.log(`Migrating ${events.length} events...`);
    for (const e of events) {
      await postgresPrisma.event.upsert({
        where: { id: e.id },
        update: {
          dayId: e.dayId,
          title: e.title,
          description: e.description || e.notes || null,
          startTime: e.startTime || e.time || null,
          endTime: e.endTime || null,
          category: e.category || "ACTIVITY",
          locationName: e.locationName || e.location || null,
          address: e.address || null,
          lat: e.lat,
          lng: e.lng,
          placeId: e.placeId || null,
          orderIndex: e.orderIndex ?? e.order ?? 0,
        },
        create: {
          id: e.id,
          dayId: e.dayId,
          title: e.title,
          description: e.description || e.notes || null,
          startTime: e.startTime || e.time || null,
          endTime: e.endTime || null,
          category: e.category || "ACTIVITY",
          locationName: e.locationName || e.location || null,
          address: e.address || null,
          lat: e.lat,
          lng: e.lng,
          placeId: e.placeId || null,
          orderIndex: e.orderIndex ?? e.order ?? 0,
        },
      });
    }

    // 5. Hotels
    const hotels = sqlite.prepare("SELECT * FROM Hotel").all() as any[];
    console.log(`Migrating ${hotels.length} hotels...`);
    for (const h of hotels) {
      await postgresPrisma.hotel.upsert({
        where: { id: h.id },
        update: {
          tripId: h.tripId,
          name: h.name,
          address: h.address,
          phone: h.phone || null,
          website: h.website || null,
          checkInDate: parseDate(h.checkIn || h.checkInDate),
          checkOutDate: parseDate(h.checkOut || h.checkOutDate),
          confirmationNumber: h.confirmationCode || h.confirmationNumber || null,
          lat: h.lat,
          lng: h.lng,
          notes: h.notes,
        },
        create: {
          id: h.id,
          tripId: h.tripId,
          name: h.name,
          address: h.address,
          phone: h.phone || null,
          website: h.website || null,
          checkInDate: parseDate(h.checkIn || h.checkInDate),
          checkOutDate: parseDate(h.checkOut || h.checkOutDate),
          confirmationNumber: h.confirmationCode || h.confirmationNumber || null,
          lat: h.lat,
          lng: h.lng,
          notes: h.notes,
        },
      });
    }

    // 6. Flights
    const flights = sqlite.prepare("SELECT * FROM Flight").all() as any[];
    console.log(`Migrating ${flights.length} flights...`);
    for (const f of flights) {
      await postgresPrisma.flight.upsert({
        where: { id: f.id },
        update: {
          tripId: f.tripId,
          flightNumber: f.flightNumber,
          airline: f.airline,
          departureAirport: f.departureAirport,
          arrivalAirport: f.arrivalAirport,
          flightDate: parseDate(f.flightDate) || new Date(),
          notes: f.notes,
        },
        create: {
          id: f.id,
          tripId: f.tripId,
          flightNumber: f.flightNumber,
          airline: f.airline,
          departureAirport: f.departureAirport,
          arrivalAirport: f.arrivalAirport,
          flightDate: parseDate(f.flightDate) || new Date(),
          notes: f.notes,
        },
      });
    }

    // 7. Documents
    const documents = sqlite.prepare("SELECT * FROM Document").all() as any[];
    console.log(`Migrating ${documents.length} documents...`);
    for (const doc of documents) {
      const fileName = doc.fileName || doc.filename || doc.originalName || "doc.pdf";
      const fileUrl = doc.fileUrl || `/uploads/${fileName}`;
      const fileType = doc.fileType || doc.mimeType || "application/pdf";

      await postgresPrisma.document.upsert({
        where: { id: doc.id },
        update: {
          tripId: doc.tripId,
          fileName: fileName,
          originalName: doc.originalName || fileName,
          fileUrl: fileUrl,
          fileType: fileType,
          sizeBytes: doc.sizeBytes || 0,
          tag: doc.tag || "OTHER",
          uploadedAt: parseDate(doc.uploadedAt) || new Date(),
        },
        create: {
          id: doc.id,
          tripId: doc.tripId,
          fileName: fileName,
          originalName: doc.originalName || fileName,
          fileUrl: fileUrl,
          fileType: fileType,
          sizeBytes: doc.sizeBytes || 0,
          tag: doc.tag || "OTHER",
          uploadedAt: parseDate(doc.uploadedAt) || new Date(),
        },
      });
    }

    // 8. SavedPlaces
    const savedPlaces = sqlite.prepare("SELECT * FROM SavedPlace").all() as any[];
    console.log(`Migrating ${savedPlaces.length} saved places...`);
    for (const sp of savedPlaces) {
      await postgresPrisma.savedPlace.upsert({
        where: { id: sp.id },
        update: {
          tripId: sp.tripId,
          name: sp.name,
          address: sp.address,
          category: sp.category || "OTHER",
          lat: sp.lat,
          lng: sp.lng,
          note: sp.note,
          assignedDayId: sp.assignedDayId,
        },
        create: {
          id: sp.id,
          tripId: sp.tripId,
          name: sp.name,
          address: sp.address,
          category: sp.category || "OTHER",
          lat: sp.lat,
          lng: sp.lng,
          note: sp.note,
          assignedDayId: sp.assignedDayId,
        },
      });
    }

    // 9. Transportation
    const transportations = sqlite.prepare("SELECT * FROM Transportation").all() as any[];
    console.log(`Migrating ${transportations.length} transportations...`);
    for (const tr of transportations) {
      await postgresPrisma.transportation.upsert({
        where: { id: tr.id },
        update: {
          tripId: tr.tripId,
          type: tr.type || "OTHER",
          date: parseDate(tr.date),
          fromLocation: tr.fromLocation,
          toLocation: tr.toLocation,
          departureTime: tr.departureTime,
          arrivalTime: tr.arrivalTime,
          company: tr.company,
          reference: tr.reference,
          vehicle: tr.vehicle,
          documents: tr.documents,
          contactName: tr.contactName,
          contactPhone: tr.contactPhone,
          notes: tr.notes,
        },
        create: {
          id: tr.id,
          tripId: tr.tripId,
          type: tr.type || "OTHER",
          date: parseDate(tr.date),
          fromLocation: tr.fromLocation,
          toLocation: tr.toLocation,
          departureTime: tr.departureTime,
          arrivalTime: tr.arrivalTime,
          company: tr.company,
          reference: tr.reference,
          vehicle: tr.vehicle,
          documents: tr.documents,
          contactName: tr.contactName,
          contactPhone: tr.contactPhone,
          notes: tr.notes,
        },
      });
    }

    // 10. PackingItems
    const packingItems = sqlite.prepare("SELECT * FROM PackingItem").all() as any[];
    console.log(`Migrating ${packingItems.length} packing items...`);
    for (const p of packingItems) {
      await postgresPrisma.packingItem.upsert({
        where: { id: p.id },
        update: {
          userId: p.userId,
          text: p.text || p.name || "",
          order: p.order || 0,
        },
        create: {
          id: p.id,
          userId: p.userId,
          text: p.text || p.name || "",
          order: p.order || 0,
        },
      });
    }

    // 11. ConsultResult
    const consultResults = sqlite.prepare("SELECT * FROM ConsultResult").all() as any[];
    console.log(`Migrating ${consultResults.length} consult results...`);
    for (const cr of consultResults) {
      await postgresPrisma.consultResult.upsert({
        where: { id: cr.id },
        update: {
          tripId: cr.tripId,
          userId: cr.userId,
          skill: cr.skill,
          content: cr.content,
          updatedAt: parseDate(cr.updatedAt) || new Date(),
        },
        create: {
          id: cr.id,
          tripId: cr.tripId,
          userId: cr.userId,
          skill: cr.skill,
          content: cr.content,
          updatedAt: parseDate(cr.updatedAt) || new Date(),
        },
      });
    }

    // 12. TripCollaborator
    const collaborators = sqlite.prepare("SELECT * FROM TripCollaborator").all() as any[];
    console.log(`Migrating ${collaborators.length} collaborators...`);
    for (const col of collaborators) {
      await postgresPrisma.tripCollaborator.upsert({
        where: { id: col.id },
        update: {
          tripId: col.tripId,
          userId: col.userId,
          joinedAt: parseDate(col.joinedAt) || new Date(),
        },
        create: {
          id: col.id,
          tripId: col.tripId,
          userId: col.userId,
          joinedAt: parseDate(col.joinedAt) || new Date(),
        },
      });
    }

    console.log("🎉 SUCCESS: All user accounts, trips, days, events, flights, hotels, and documents migrated to Supabase!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    sqlite.close();
    await postgresPrisma.$disconnect();
  }
}

migrateData();
