import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const items = await prisma.packingItem.findMany({
    where: { userId: user.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const initialUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture,
  };

  const initialItems = items.map((item) => ({
    id: item.id,
    text: item.text,
    order: item.order,
    createdAt: item.createdAt.toISOString(),
  }));

  return <SettingsClient initialUser={initialUser} initialItems={initialItems} />;
}
