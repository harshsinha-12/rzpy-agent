import { NextResponse } from "next/server";
import { env } from "@/config/env";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const response = await fetch(
    new URL(
      `/checkout/drop-offs/${encodeURIComponent(id)}/draft`,
      env.API_BASE_URL,
    ),
    { cache: "no-store", method: "POST" },
  );
  return NextResponse.json(await response.json(), { status: response.status });
}
