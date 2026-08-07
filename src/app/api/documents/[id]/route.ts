import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { fileUrl: true, fileType: true, originalName: true },
  });

  if (!doc) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // If stored in Supabase Storage, redirect to the public URL
  if (doc.fileUrl && doc.fileUrl.startsWith("http")) {
    return NextResponse.redirect(doc.fileUrl);
  }

  // Legacy: try to read from DB bytes (fileData column)
  const docWithData = await (prisma as any).document.findUnique({
    where: { id },
    select: { fileData: true, fileType: true, originalName: true },
  });

  if (!docWithData?.fileData) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", docWithData.fileType || "application/octet-stream");
  headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(docWithData.originalName)}"`);
  return new NextResponse(docWithData.fileData, { status: 200, headers });
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

// DELETE — remove document record.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.document.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
