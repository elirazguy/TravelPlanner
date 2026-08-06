import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("auth_session", session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  return session;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: sessionId } });
    return null;
  }

  return session.user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  cookieStore.delete("auth_session");
}
