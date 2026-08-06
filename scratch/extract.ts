import { prisma } from "../src/lib/prisma";
import { processDocumentWithGemini } from "../src/lib/doc-parser";
import path from "path";
import { readFile } from "fs/promises";

async function main() {
  const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
  const docs = await prisma.document.findMany({
    where: {
      tag: { in: ["HOTEL", "FLIGHT"] },
    },
  });

  console.log(`Found ${docs.length} HOTEL/FLIGHT docs...`);
  
  for (const doc of docs) {
    try {
      console.log(`Processing: ${doc.originalName} (${doc.id})`);
      const filePath = path.join(UPLOAD_DIR, doc.fileName);
      const bytes = await readFile(filePath);
      await processDocumentWithGemini(doc.tripId, doc.tag, bytes, doc.fileType, doc.originalName);
      console.log(`✅ Extracted data from ${doc.originalName}`);
    } catch (err: any) {
      console.error(`❌ Error on ${doc.originalName}: ${err.message}`);
    }
  }

  console.log("Done!");
}

main().catch(console.error);
