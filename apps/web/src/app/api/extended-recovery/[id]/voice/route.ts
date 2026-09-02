import { env } from "@/config/env";

type RouteContext = { params: Promise<{ id: string }> };

function voiceUrl(id: string): URL {
  return new URL(
    `/extended-recovery/${encodeURIComponent(id)}/voice`,
    env.API_BASE_URL,
  );
}

function unavailableResponse(): Response {
  return Response.json(
    {
      error: {
        code: "VOICE_API_UNAVAILABLE",
        message: "RecoveryOS could not reach the voice-generation API.",
      },
    },
    { status: 502 },
  );
}

export async function POST(
  _request: Request,
  { params }: RouteContext,
): Promise<Response> {
  const { id } = await params;

  try {
    const response = await fetch(voiceUrl(id), {
      cache: "no-store",
      method: "POST",
    });

    if (!response.ok) {
      return new Response(response.body, {
        headers: {
          "content-type":
            response.headers.get("content-type") ?? "application/json",
        },
        status: response.status,
      });
    }

    return Response.json({
      audioUrl: `/api/extended-recovery/${encodeURIComponent(id)}/voice`,
    });
  } catch {
    return unavailableResponse();
  }
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<Response> {
  const { id } = await params;

  try {
    const response = await fetch(voiceUrl(id), { cache: "no-store" });

    return new Response(response.body, {
      headers: {
        "cache-control": "private, no-store",
        "content-type":
          response.headers.get("content-type") ?? "application/octet-stream",
      },
      status: response.status,
    });
  } catch {
    return unavailableResponse();
  }
}
