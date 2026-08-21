import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyRazorpayWebhookSignature(options: {
  rawBody: string;
  secret: string;
  signature: string;
}): boolean {
  if (!options.secret || !options.signature) {
    return false;
  }

  const expected = createHmac("sha256", options.secret)
    .update(options.rawBody)
    .digest("hex");
  const actualBuffer = Buffer.from(options.signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function signRazorpayWebhookPayload(
  rawBody: string,
  secret: string,
): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}
