import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { fileData: true, fileType: true, originalName: true },
  });

  if (!doc || !doc.fileData) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Create response with file binary data
  const headers = new Headers();
  headers.set("Content-Type", doc.fileType || "application/octet-stream");
  // Set content-disposition to inline so PDFs/images open in browser, or attachment to download
  headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(doc.originalName)}"`);

  return new NextResponse(doc.fileData, { status: 200, headers });
}
