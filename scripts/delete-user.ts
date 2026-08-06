import { prisma } from "../src/lib/prisma";

async function main() {
  const email = "eliraz.guy@gmail.com";
  
  // Find the user
  const user = await prisma.userAccount.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`User with email ${email} not found.`);
    return;
  }

  // Delete relationships
  await prisma.session.deleteMany({
    where: { userId: user.id }
  });

  await prisma.packingItem.deleteMany({
    where: { userId: user.id }
  });

  await prisma.trip.deleteMany({
    where: { userId: user.id }
  });

  // Delete the user
  await prisma.userAccount.delete({
    where: { id: user.id },
  });

  console.log(`Successfully deleted user ${email} and all associated data.`);
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());
