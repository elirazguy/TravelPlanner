import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET — redirect to the Supabase Storage URL so the file opens in the browser.
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { fileUrl: true, originalName: true },
  });

  if (!doc || !doc.fileUrl) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Redirect to Supabase Storage public URL
  return NextResponse.redirect(doc.fileUrl);
}

// PATCH — retag a document.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const doc = await prisma.document.update({
    where: { id },
    data: { tag: body.tag },
  });
  return NextResponse.json(doc);
}

// DELETE — remove document record and file from Supabase Storage.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { fileUrl: true },
  });

  if (doc?.fileUrl) {
    // Try to delete from Supabase Storage (best-effort)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      // Extract path from URL: .../object/public/trip-documents/FILENAME
      const match = doc.fileUrl.match(/\/object\/public\/trip-documents\/(.+)$/);
      if (match) {
        const path = decodeURIComponent(match[1]);
        await fetch(
          `https://uxvjsxsdtshgiaqhzjqz.supabase.co/storage/v1/object/trip-documents/${encodeURIComponent(path)}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${serviceRoleKey}` },
          }
        ).catch(() => {});
      }
    }
  }

  await prisma.document.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
