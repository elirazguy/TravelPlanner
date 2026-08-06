import { prisma } from "../src/lib/prisma";
import { verifyPassword } from "../src/lib/auth-crypto";

async function main() {
  const user = await prisma.userAccount.findUnique({
    where: { email: "eliraz.guy@gmail.com" },
  });

  if (!user || !user.passwordHash) {
    console.log("User not found or no password hash!");
    return;
  }

  const isValid = verifyPassword("Guy010704", user.passwordHash);
  console.log("Is password 'Guy010704' valid?", isValid);
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());
