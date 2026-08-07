import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processDocumentWithGemini } from "@/lib/doc-parser";

type Params = { params: Promise<{ id: string }> };

// Upload a file to Supabase Storage using the REST API (no SDK required).
async function uploadToSupabaseStorage(
  bytes: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const supabaseUrl = `https://uxvjsxsdtshgiaqhzjqz.supabase.co`;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
  }

  const bucket = "trip-documents";
  const path = `${Date.now()}-${fileName}`;

  // Upload file to Supabase Storage
  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(path)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": mimeType || "application/octet-stream",
        "x-upsert": "true",
      },
      body: new Uint8Array(bytes),
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => uploadRes.statusText);
    throw new Error(`Supabase Storage upload failed (${uploadRes.status}): ${errText}`);
  }

  // Return the public URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(path)}`;
}

// POST /api/trips/[id]/documents — multipart upload of files to Supabase Storage.
export async function POST(req: NextRequest, { params }: Params) {
  try {
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

      // Upload to Supabase Storage
      let fileUrl: string;
      try {
        fileUrl = await uploadToSupabaseStorage(bytes, safeBase, file.type);
      } catch (storageErr: any) {
        return NextResponse.json(
          { error: `שגיאה בהעלאה לאחסון: ${storageErr.message}` },
          { status: 500 }
        );
      }

      // Save document metadata to DB (no binary data – just the URL)
      const doc = await prisma.document.create({
        data: {
          tripId,
          fileName: safeBase,
          originalName: file.name,
          fileUrl,
          fileType: file.type || "application/octet-stream",
          sizeBytes: bytes.length,
          tag,
        },
      });

      created.push(doc);

      // Auto-extract hotel / flight info with Gemini (best-effort, non-blocking)
      processDocumentWithGemini(tripId, tag, bytes, file.type, file.name).catch(() => {});
    }

    return NextResponse.json(created, { status: 201 });
  } catch (globalErr: any) {
    return NextResponse.json(
      { error: globalErr.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
