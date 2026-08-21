export const paymentEventsQueueName = "payment-events";

export interface PaymentEventJobData {
  webhookEventId: string;
}
