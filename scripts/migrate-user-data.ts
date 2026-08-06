import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth-crypto";

async function main() {
  console.log("Starting user data migration...");

  const targetEmail = "eliraz.guy@gmail.com";
  const targetName = "גיא אלירז";
  const targetPassword = "Guy010704";

  const passwordHash = hashPassword(targetPassword);

  // 1. Create or update target user account
  let targetUser = await prisma.userAccount.findUnique({
    where: { email: targetEmail },
  });

  if (targetUser) {
    console.log(`Updating existing target user: ${targetUser.id}`);
    targetUser = await prisma.userAccount.update({
      where: { id: targetUser.id },
      data: {
        name: targetName,
        passwordHash,
      },
    });
  } else {
    console.log(`Creating new target user for ${targetEmail}...`);
    targetUser = await prisma.userAccount.create({
      data: {
        email: targetEmail,
        name: targetName,
        passwordHash,
      },
    });
  }

  console.log(`Target user ID is: ${targetUser.id}`);

  // 2. Transfer all trips to target user
  const tripResult = await prisma.trip.updateMany({
    where: {
      OR: [
        { userId: { not: targetUser.id } },
        { userId: null },
      ],
    },
    data: {
      userId: targetUser.id,
    },
  });
  console.log(`Migrated ${tripResult.count} trips to ${targetEmail}`);

  // 3. Transfer all packing items to target user
  const packingResult = await prisma.packingItem.updateMany({
    where: {
      OR: [
        { userId: { not: targetUser.id } },
        { userId: null },
      ],
    },
    data: {
      userId: targetUser.id,
    },
  });
  console.log(`Migrated ${packingResult.count} packing items to ${targetEmail}`);

  // 4. Transfer all consult results to target user
  const consultResult = await prisma.consultResult.updateMany({
    where: {
      OR: [
        { userId: { not: targetUser.id } },
        { userId: null },
      ],
    },
    data: {
      userId: targetUser.id,
    },
  });
  console.log(`Migrated ${consultResult.count} consult results to ${targetEmail}`);

  console.log("Migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
