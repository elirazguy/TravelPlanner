import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getPlacePhoto } from "@/lib/places";
import { pickCoverSubject, generateCoverImage } from "@/lib/gemini";

// POST /api/generate-cover
// Creates a trip cover that matches the destination AND the traveler's style:
//   1. Generate a bespoke image with AI (Imagen / Gemini) from destination + notes.
//   2. If image generation isn't available, fall back to a real Google Places photo.
export async function POST(req: NextRequest) {
  const { destination, notes } = await req.json();
  if (!destination) {
    return NextResponse.json({ error: "destination is required" }, { status: 400 });
  }

  let buf: Buffer | null = null;
  let ext = "jpg";
  let method = "";

  // 1) AI generation — best quality and the only way to truly match a style
  //    like "sailing between the islands".
  try {
    const gen = await generateCoverImage(destination, notes);
    if (gen?.base64) {
      buf = Buffer.from(gen.base64, "base64");
      ext = gen.mime.includes("png") ? "png" : "jpg";
      method = "generated";
    }
  } catch {
    buf = null;
  }

  // 2) Fallback — a real photo from Google Places (style-aware subject).
  if (!buf) {
    let subject: string | null = null;
    try {
      subject = await pickCoverSubject(destination, notes);
    } catch {
      subject = null;
    }
    const queries = [subject, destination].filter(
      (q): q is string => !!q && q.trim().length > 0
    );
    let photoUri: string | null = null;
    for (const q of queries) {
      photoUri = await getPlacePhoto(q);
      if (photoUri) break;
    }
    if (photoUri) {
      const imgRes = await fetch(photoUri).catch(() => null);
      if (imgRes?.ok) {
        buf = Buffer.from(await imgRes.arrayBuffer());
        ext = "jpg";
        method = "photo";
      }
    }
  }

  if (!buf) {
    return NextResponse.json(
      { error: "Could not create a cover image for this destination" },
      { status: 502 }
    );
  }

  const fileName = `cover-${Date.now()}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "covers");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, fileName), buf);

  return NextResponse.json({ url: `/uploads/covers/${fileName}`, method });
}
