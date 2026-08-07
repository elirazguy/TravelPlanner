import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processDocumentWithGemini } from "@/lib/doc-parser";

type Params = { params: Promise<{ id: string }> };

// Upload a file to Supabase Storage using the REST API (no SDK required).
async function uploadToSupabaseStorage(
  bytes: Buffer,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  const supabaseUrl = `https://uxvjsxsdtshgiaqhzjqz.supabase.co`;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  const bucket = "trip-documents";
  const storagePath = `${Date.now()}-${fileName}`;

  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(storagePath)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": mimeType || "application/octet-stream",
        "x-upsert": "true",
      },
      body: new Uint8Array(bytes) as BodyInit,
    }
  );

  if (!uploadRes.ok) return null;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(storagePath)}`;
}

// POST /api/trips/[id]/documents — multipart upload of files.
// Tries Supabase Storage first; falls back to DB bytes if key not configured.
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

      // Try Supabase Storage first
      const storageUrl = await uploadToSupabaseStorage(bytes, safeBase, file.type).catch(() => null);

      let doc;
      if (storageUrl) {
        // Store only the URL — no binary data in DB
        doc = await prisma.document.create({
          data: {
            tripId,
            fileName: safeBase,
            originalName: file.name,
            fileUrl: storageUrl,
            fileType: file.type || "application/octet-stream",
            sizeBytes: bytes.length,
            tag,
          },
        });
      } else {
        // Fallback: store binary in DB (requires fileData column in Supabase)
        try {
          const rawDoc = await prisma.document.create({
            data: {
              tripId,
              fileName: safeBase,
              originalName: file.name,
              fileUrl: "",
              fileType: file.type || "application/octet-stream",
              sizeBytes: bytes.length,
              // @ts-ignore — fileData column must exist in the DB (run ALTER TABLE)
              fileData: bytes,
              tag,
            },
          });
          doc = await prisma.document.update({
            where: { id: rawDoc.id },
            data: { fileUrl: `/api/documents/${rawDoc.id}` },
          });
        } catch (dbErr: any) {
          return NextResponse.json(
            {
              error:
                "לא הוגדר SUPABASE_SERVICE_ROLE_KEY בסביבת Vercel, ועמודת fileData אינה קיימת בבסיס הנתונים. פעל לפי ההוראות להגדרת Supabase Storage.",
            },
            { status: 500 }
          );
        }
      }

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
