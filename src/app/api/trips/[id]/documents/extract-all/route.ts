import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processDocumentWithGemini } from "@/lib/doc-parser";
import path from "path";
import { readFile } from "fs/promises";

type Params = { params: Promise<{ id: string }> };

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// POST /api/trips/[id]/documents/extract-all
// Re-runs Gemini extraction on all HOTEL/FLIGHT documents for this trip
export async function POST(_req: NextRequest, { params }: Params) {
  const { id: tripId } = await params;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  // Fetch all HOTEL and FLIGHT documents for this trip
  const docs = await prisma.document.findMany({
    where: {
      tripId,
      tag: { in: ["HOTEL", "FLIGHT"] },
    },
  });

  if (docs.length === 0) {
    return NextResponse.json({ message: "אין מסמכים מסוג מלון/טיסה לחילוץ" });
  }

  let extracted = 0;
  const errors: string[] = [];

  for (const doc of docs) {
    try {
      const filePath = path.join(UPLOAD_DIR, doc.fileName);
      const bytes = await readFile(filePath);
      await processDocumentWithGemini(tripId, doc.tag, bytes, doc.fileType, doc.originalName);
      extracted++;
    } catch (err: any) {
      errors.push(`${doc.originalName}: ${err.message}`);
    }
  }

  return NextResponse.json({
    message: `חולצו נתונים מ-${extracted} מסמכים`,
    extracted,
    errors,
  });
}
