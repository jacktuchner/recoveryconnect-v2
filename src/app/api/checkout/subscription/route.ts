import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "Subscriptions are no longer available. All recordings are now free." },
    { status: 410 }
  );
}
