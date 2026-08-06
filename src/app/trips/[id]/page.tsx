import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, MapPin, CalendarDays, FileDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDateRange } from "@/lib/utils";
import { TripWorkspace } from "@/components/trip/TripWorkspace";
import { EditTripModal } from "@/components/EditTripModal";
import { ShareTripButton } from "@/components/ShareTripButton";
import { CollaboratorsList, type CollaboratorUser } from "@/components/CollaboratorsList";
import { ShareInviteModal } from "@/components/ShareInviteModal";
import type { TripDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const user = await getSession();
  if (!user) redirect("/login");

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      user: true,
      collaborators: {
        include: {
          user: true,
        },
      },
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          events: { orderBy: { orderIndex: "asc" } },
          savedPlaces: true,
        },
      },
      documents: { 
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          fileName: true,
          originalName: true,
          fileUrl: true,
          fileType: true,
          sizeBytes: true,
          tag: true,
          uploadedAt: true
        }
      },
      hotels: { orderBy: { checkInDate: "asc" } },
      flights: { orderBy: { flightDate: "asc" } },
      transportation: { orderBy: { date: "asc" } },
      savedPlaces: true,
    },
  });

  if (!trip) notFound();

  const isOwner = trip.userId === user.id;
  const isCollaborator = trip.collaborators.some((c) => c.userId === user.id);
  const canAccess = isOwner || isCollaborator || trip.isPublic;

  if (!canAccess) notFound();

  // Ensure trip has an inviteCode
  let inviteCode = trip.inviteCode;
  if (!inviteCode) {
    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { inviteCode: trip.id },
    });
    inviteCode = updated.inviteCode || trip.id;
  }

  // Participants list for avatar display
  const participants: CollaboratorUser[] = [];
  if (trip.user) {
    participants.push({
      id: trip.user.id,
      name: trip.user.name,
      email: trip.user.email,
      picture: trip.user.picture,
      isOwner: true,
    });
  }
  for (const c of trip.collaborators) {
    if (c.user && c.user.id !== trip.userId) {
      participants.push({
        id: c.user.id,
        name: c.user.name,
        email: c.user.email,
        picture: c.user.picture,
        isOwner: false,
      });
    }
  }

  // Serialize dates to ISO strings for the client components.
  const dto: TripDTO = {
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    country: trip.country,
    coverImage: trip.coverImage,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    status: trip.status,
    isPublic: trip.isPublic,
    cloneCount: trip.cloneCount,
    notes: trip.notes,
    mapCenterLat: trip.mapCenterLat,
    mapCenterLng: trip.mapCenterLng,
    days: trip.days.map((d) => ({
      id: d.id,
      date: d.date.toISOString(),
      dayNumber: d.dayNumber,
      colorHex: d.colorHex,
      notes: d.notes,
      events: d.events.map((e) => ({
        id: e.id,
        dayId: e.dayId,
        title: e.title,
        description: e.description,
        startTime: e.startTime,
        endTime: e.endTime,
        category: e.category,
        locationName: e.locationName,
        address: e.address,
        lat: e.lat,
        lng: e.lng,
        placeId: e.placeId,
        orderIndex: e.orderIndex,
      })),
      savedPlaces: d.savedPlaces.map(serializePlace),
    })),
    documents: trip.documents.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      originalName: d.originalName,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      sizeBytes: d.sizeBytes,
      tag: d.tag,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
    hotels: trip.hotels.map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      phone: h.phone,
      website: h.website,
      confirmationNumber: h.confirmationNumber,
      checkInDate: h.checkInDate?.toISOString() ?? null,
      checkOutDate: h.checkOutDate?.toISOString() ?? null,
      lat: h.lat,
      lng: h.lng,
      notes: h.notes,
    })),
    flights: trip.flights.map((f) => ({
      id: f.id,
      flightNumber: f.flightNumber,
      airline: f.airline,
      departureAirport: f.departureAirport,
      arrivalAirport: f.arrivalAirport,
      flightDate: f.flightDate.toISOString(),
      notes: f.notes,
    })),
    transportation: trip.transportation.map((t) => ({
      id: t.id,
      type: t.type,
      date: t.date?.toISOString() ?? null,
      fromLocation: t.fromLocation,
      toLocation: t.toLocation,
      departureTime: t.departureTime,
      arrivalTime: t.arrivalTime,
      company: t.company,
      reference: t.reference,
      vehicle: t.vehicle,
      documents: t.documents,
      contactName: t.contactName,
      contactPhone: t.contactPhone,
      notes: t.notes,
    })),
    savedPlaces: trip.savedPlaces.map(serializePlace),
  };

  return (
    <div>
      <Link
        href={trip.status === "ARCHIVED" ? "/archive" : "/"}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800"
      >
        <ChevronRight size={16} /> חזרה ל{trip.status === "ARCHIVED" ? "ארכיון" : "טיולים"}
      </Link>

      <div className="mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-ink-900 leading-tight">
            {trip.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-ink-500">
            <span className="flex items-center gap-1 shrink-0">
              <MapPin size={13} /> {trip.destination}
            </span>
            <span className="text-ink-300">•</span>
            <span className="flex items-center gap-1 shrink-0">
              <CalendarDays size={13} />{" "}
              {formatDateRange(trip.startDate, trip.endDate)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2 pt-1 sm:pt-0">
          {/* Row 1: The 3 action buttons on one row */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-0.5 scrollbar-none">
            {(isOwner || isCollaborator) && (
              <ShareInviteModal inviteCode={inviteCode} />
            )}

            {isOwner ? (
              <>
                <ShareTripButton tripId={dto.id} initialIsPublic={trip.isPublic} />
                <EditTripModal
                  trip={{
                    id: dto.id,
                    title: dto.title,
                    destination: dto.destination,
                    notes: dto.notes,
                    startDate: dto.startDate,
                    endDate: dto.endDate,
                    coverImage: dto.coverImage,
                  }}
                />
              </>
            ) : isCollaborator ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 whitespace-nowrap">
                👥 שותף בטיול
              </span>
            ) : (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  🌐 טיול מומלץ מהקהילה
                </span>
                <Link
                  href="/community"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  חזרה לקהילה להעתקה
                </Link>
              </div>
            )}
          </div>

          {/* Row 2: Collaborator avatars + PDF Export button */}
          <div className="flex items-center gap-2.5">
            {participants.length > 0 && <CollaboratorsList users={participants} />}
            <a
              href={`/trips/${dto.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white/90 px-2.5 py-1 text-xs font-bold text-ink-700 shadow-sm hover:bg-white transition-colors whitespace-nowrap shrink-0"
              title="ייצא מסלול ל-PDF"
            >
              <FileDown size={14} /> ייצא ל-PDF
            </a>
          </div>
        </div>
      </div>

      <TripWorkspace trip={dto} />
    </div>
  );
}

function serializePlace(p: {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
  category: string | null;
  listName: string | null;
  note: string | null;
  assignedDayId: string | null;
}) {
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    placeId: p.placeId,
    category: p.category,
    listName: p.listName,
    note: p.note,
    assignedDayId: p.assignedDayId,
  };
}
