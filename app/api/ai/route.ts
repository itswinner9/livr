import { NextResponse } from "next/server";
import { askLivRank } from "@/lib/actions/ai";

export async function POST(request: Request) {
  const body = (await request.json()) as { propertyId?: string; question?: string };
  if (!body.propertyId || !body.question) {
    return NextResponse.json({ error: "Missing question." }, { status: 400 });
  }
  const result = await askLivRank(body.propertyId, body.question);
  return NextResponse.json(result);
}
