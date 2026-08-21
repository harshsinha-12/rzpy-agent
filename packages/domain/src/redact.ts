const SENSITIVE_KEY_PATTERN =
  /secret|password|authorization|token|apikey|keysecret|card|vpa|cvv|pan|contact|email|phone|otp|signature/i;

const REDACTED = "[Redacted]";

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSecrets);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        isSensitiveKey(key) ? REDACTED : redactSecrets(nested),
      ]),
    );
  }

  return value;
}
