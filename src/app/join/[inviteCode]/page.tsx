import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function JoinTripPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const user = await getSession();

  // Find trip by invite code (or by trip ID fallback)
  const trip = await prisma.trip.findFirst({
    where: {
      OR: [{ inviteCode }, { id: inviteCode }],
    },
    include: {
      collaborators: true,
    },
  });

  if (!trip) {
    notFound();
  }

  // If not authenticated, redirect to Google OAuth with return callbackUrl
  if (!user) {
    redirect(`/api/auth/google?callbackUrl=/join/${inviteCode}`);
  }

  // Check ownership and collaborator status
  const isOwner = trip.userId === user.id;
  const isCollaborator = trip.collaborators.some((c) => c.userId === user.id);

  if (!isOwner && !isCollaborator) {
    // Register user as a new collaborator for this trip
    await prisma.tripCollaborator.create({
      data: {
        tripId: trip.id,
        userId: user.id,
      },
    });
  }

  // Redirect user to the trip workspace
  redirect(`/trips/${trip.id}`);
}
