import { afterEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

const context = { params: Promise.resolve({ id: "voice-case-1" }) };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("voice proxy route", () => {
  it("generates voice through the API and returns a same-origin audio URL", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { audioUrl: "/extended-recovery/voice-case-1/voice" },
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(new Request("http://localhost"), context);

    await expect(response.json()).resolves.toEqual({
      audioUrl: "/api/extended-recovery/voice-case-1/voice",
    });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/extended-recovery/voice-case-1/voice",
      }),
      { cache: "no-store", method: "POST" },
    );
  });

  it("streams stored audio through the same-origin route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(new Uint8Array([1, 2, 3]), {
            headers: { "content-type": "audio/mpeg" },
            status: 200,
          }),
      ),
    );

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    );
  });

  it("returns a useful gateway error when the API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network unavailable");
      }),
    );

    const response = await POST(new Request("http://localhost"), context);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VOICE_API_UNAVAILABLE",
        message: "RecoveryOS could not reach the voice-generation API.",
      },
    });
  });
});
