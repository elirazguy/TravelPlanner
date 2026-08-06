import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { processDocumentWithGemini } from "@/lib/doc-parser";

type Params = { params: Promise<{ id: string }> };

// POST /api/trips/[id]/documents — multipart upload of an unlimited number of
// files, each tagged for the Documents Vault.
export async function POST(req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  const form = await req.formData();
  const tag = (form.get("tag") as string) || "OTHER";
  const files = form.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const created = [];
  for (const file of files) {
    if (!(file instanceof File)) continue;
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    
    // Create the document first to get the auto-generated ID
    const doc = await prisma.document.create({
      data: {
        tripId,
        fileName: safeBase,
        originalName: file.name,
        fileUrl: "", // We'll update this next
        fileType: file.type || "application/octet-stream",
        sizeBytes: bytes.length,
        fileData: bytes, // Save binary in DB!
        tag,
      },
    });

    // Update the URL to point to our new DB-serving endpoint
    const finalDoc = await prisma.document.update({
      where: { id: doc.id },
      data: { fileUrl: `/api/documents/${doc.id}` }
    });

    created.push(finalDoc);

    // Auto-extract hotel / flight info synchronously so it's ready when upload completes
    await processDocumentWithGemini(tripId, tag, bytes, file.type, file.name);
  }

  return NextResponse.json(created, { status: 201 });
}
