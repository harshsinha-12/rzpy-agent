import type { RazorpayClient } from "@recoveryos/razorpay";
import { describe, expect, it, vi } from "vitest";

import {
  createRecoveryExecutionTools,
  paymentLinkReference,
} from "./recovery-tools.js";

function client(overrides: Partial<RazorpayClient> = {}): RazorpayClient {
  return {
    createOrder: vi.fn(),
    ensurePaymentLink: vi.fn(),
    fetchPayment: vi.fn(),
    fetchPaymentLink: vi.fn(),
    findPaymentLinkByReference: vi.fn(),
    ...overrides,
  };
}

describe("recovery execution tools", () => {
  it("keeps the action-bound Payment Link reference within 40 characters", () => {
    const reference = paymentLinkReference(
      "019d1fa7-81eb-7b5d-8fc4-531a299537fd",
    );
    expect(reference).toBe("recovery_019d1fa781eb7b5d8fc4531a299537f");
    expect(reference).toHaveLength(40);
  });

  it("re-checks Test Mode payment state through Razorpay", async () => {
    const fetchPayment = vi.fn().mockResolvedValue({
      amount: 125000,
      created_at: 1,
      currency: "INR",
      id: "pay_test",
      status: "captured",
    });
    const tools = createRecoveryExecutionTools(client({ fetchPayment }));

    await expect(
      tools.recheckPayment({
        currentAmountPaise: 125000,
        currentStatus: "FAILED",
        dataSource: "RAZORPAY_TEST_MODE",
        paymentId: "pay_test",
      }),
    ).resolves.toEqual({ amountPaise: 125000, status: "CAPTURED" });
  });

  it("keeps reminders simulated with no external side effect", async () => {
    const ensurePaymentLink = vi.fn();
    const tools = createRecoveryExecutionTools(client({ ensurePaymentLink }));

    const result = await tools.execute({
      actionId: "action_test",
      actionType: "SEND_REMINDER",
      amountPaise: 125000,
      casePublicId: "RC-TEST",
      currency: "INR",
      dataSource: "RAZORPAY_TEST_MODE",
    });

    expect(result.value).toMatchObject({
      delivery: "SIMULATED",
      externalSideEffect: false,
    });
    expect(ensurePaymentLink).not.toHaveBeenCalled();
  });
});
