import { NextRequest, NextResponse } from "next/server";
import { runPlannerChat } from "@/lib/planner-ai";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getSession();
  
  // Basic check that trip exists
  const trip = await prisma.trip.findUnique({
    where: { id },
  });
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const messages = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const reply = await runPlannerChat(id, messages);
    
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Planner API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
