import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBookingEmails } from "@/lib/gmail";
import { parseBookingEmailWithGemini } from "@/lib/booking-parser";

type Params = { params: Promise<{ id: string }> };

// POST /api/trips/[id]/hotels/sync-booking — auto-sync Booking.com hotels via Gmail & Gemini
export async function POST(req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;

  // 1. Check if trip exists
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { hotels: true },
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // 2. Fetch confirmation emails from Gmail (support Hebrew & English)
  let emails: any[] = [];
  try {
    emails = await fetchBookingEmails('booking.com OR Booking OR "הזמנה" OR "מאושרת"');
  } catch (err: any) {
    if (err.message === "GMAIL_AUTH_REQUIRED") {
      const origin = req.nextUrl.origin || "http://localhost:3000";
      return NextResponse.json({
        authRequired: true,
        authUrl: `${origin}/api/auth/google?tripId=${tripId}`,
      });
    }
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  if (emails.length === 0) {
    return NextResponse.json({
      syncedCount: 0,
      totalEmailsFound: 0,
      message: 'לא נמצאו אישורי הזמנות מ-Booking.com ב-Gmail',
    });
  }

  // 3. Collect existing confirmation numbers and hotel names for deduplication
  const existingRefs = new Set<string>();
  const existingNames = new Set<string>();

  for (const h of trip.hotels) {
    if (h.confirmationNumber) existingRefs.add(h.confirmationNumber.trim());
    if (h.name) existingNames.add(h.name.trim().toLowerCase());
  }

  let syncedCount = 0;
  const createdHotels: any[] = [];

  // Prepare trip context for Gemini
  const startDateStr = trip.startDate.toISOString().split("T")[0];
  const endDateStr = trip.endDate.toISOString().split("T")[0];
  const tripContext = {
    destination: `${trip.destination}, ${trip.country}`,
    startDate: startDateStr,
    endDate: endDateStr,
  };

  // Date range buffer (5 days margin before startDate and after endDate)
  const bufferMs = 5 * 24 * 60 * 60 * 1000;
  const minAllowedDate = new Date(trip.startDate.getTime() - bufferMs);
  const maxAllowedDate = new Date(trip.endDate.getTime() + bufferMs);

  // 4. Parse emails with Gemini LLM & insert non-duplicate hotels
  for (const email of emails) {
    const extracted = await parseBookingEmailWithGemini(email.subject, email.bodyText, tripContext);
    if (!extracted || !extracted.hotel_name) continue;

    const ref = extracted.booking_reference;
    const nameLower = extracted.hotel_name.toLowerCase();

    // Check duplicate by booking_reference or name
    if (ref && existingRefs.has(ref)) continue;
    if (existingNames.has(nameLower)) continue;

    // Convert dates
    const checkIn = extracted.check_in ? new Date(extracted.check_in) : null;
    const checkOut = extracted.check_out ? new Date(extracted.check_out) : null;

    // Validate that extracted dates overlap/fall within the trip's date range
    if (checkIn && !isNaN(checkIn.getTime())) {
      if (checkIn < minAllowedDate || checkIn > maxAllowedDate) {
        continue; // Skip hotel outside trip date range
      }
    }
    if (checkOut && !isNaN(checkOut.getTime())) {
      if (checkOut < minAllowedDate || checkOut > maxAllowedDate) {
        continue; // Skip hotel outside trip date range
      }
    }

    let notesStr = "";
    if (extracted.room_type) notesStr += `חדר: ${extracted.room_type}. `;
    if (extracted.total_price) notesStr += `מחיר: ${extracted.total_price} ${extracted.currency || ""}`.trim();

    const created = await prisma.hotel.create({
      data: {
        tripId,
        name: extracted.hotel_name,
        address: extracted.address || null,
        checkInDate: checkIn && !isNaN(checkIn.getTime()) ? checkIn : null,
        checkOutDate: checkOut && !isNaN(checkOut.getTime()) ? checkOut : null,
        confirmationNumber: ref || null,
        notes: notesStr.trim() || null,
      },
    });

    if (ref) existingRefs.add(ref);
    existingNames.add(nameLower);
    syncedCount++;
    createdHotels.push(created);
  }

  return NextResponse.json({
    syncedCount,
    totalEmailsFound: emails.length,
    hotels: createdHotels,
  });
}
