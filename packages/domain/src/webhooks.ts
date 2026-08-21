export const webhookProcessingStatuses = [
  "RECEIVED",
  "QUEUED",
  "PROCESSED",
  "IGNORED",
  "FAILED",
] as const;
export type WebhookProcessingStatus =
  (typeof webhookProcessingStatuses)[number];
