import { env } from "@/config/env";

export async function POST(): Promise<Response> {
  try {
    const response = await fetch(
      new URL("/demo/razorpay/orders", env.API_BASE_URL),
      {
        cache: "no-store",
        method: "POST",
      },
    );

    return new Response(response.body, {
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      },
      status: response.status,
    });
  } catch {
    return Response.json(
      {
        error: {
          code: "RAZORPAY_API_UNAVAILABLE",
          message: "RecoveryOS could not reach the Test Mode order API.",
        },
      },
      { status: 502 },
    );
  }
}
