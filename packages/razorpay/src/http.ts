export interface RazorpayHttp {
  fetch: typeof fetch;
}

export class RazorpayApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RazorpayApiError";
  }
}

export function isTransientRazorpayStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

export interface RazorpayRequest {
  request(path: string, init?: RequestInit): Promise<unknown>;
}

export function createRazorpayRequest(
  authorization: string,
  http: RazorpayHttp,
): RazorpayRequest {
  return {
    async request(path, init = {}) {
      const response = await http.fetch(`https://api.razorpay.com${path}`, {
        ...init,
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
          ...init.headers,
        },
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        throw new RazorpayApiError(
          "Razorpay API request failed.",
          response.status,
        );
      }

      return body;
    },
  };
}
