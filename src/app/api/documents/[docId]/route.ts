import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

type Params = { params: Promise<{ docId: string }> };

// PATCH — retag a document.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { docId } = await params;
  const body = await req.json();
  const doc = await prisma.document.update({
    where: { id: docId },
    data: { tag: body.tag },
  });
  return NextResponse.json(doc);
}

// DELETE — remove document record and the file on disk.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { docId } = await params;
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (doc) {
    try {
      await unlink(path.join(process.cwd(), "public", "uploads", doc.fileName));
    } catch {
      // file may already be gone; ignore
    }
    await prisma.document.delete({ where: { id: docId } });
  }
  return NextResponse.json({ ok: true });
}
