export function createApiLogger() {
  return {
    level: "info" as const,
    redact: {
      censor: "[Redacted]",
      paths: [
        "req.headers.authorization",
        'req.headers["x-razorpay-signature"]',
        "req.headers.cookie",
        "*.keySecret",
        "*.webhookSecret",
        "*.card",
        "*.vpa",
        "*.email",
        "*.contact",
      ],
    },
    serializers: {
      req(request: { id: string; method: string; url: string }) {
        return {
          id: request.id,
          method: request.method,
          url: request.url,
        };
      },
    },
  };
}
