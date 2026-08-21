import type { ActionType, DataSource, PaymentStatus } from "@recoveryos/domain";
import type { RazorpayClient, RazorpayPaymentLink } from "@recoveryos/razorpay";

export interface PaymentRecheck {
  amountPaise: number;
  status: PaymentStatus;
}

export interface ExecuteToolInput {
  actionId: string;
  actionType: ActionType;
  amountPaise: number;
  casePublicId: string;
  currency: string;
  dataSource: DataSource;
}

export interface ExecuteToolOutput {
  razorpayReference: string | null;
  value: Record<string, unknown>;
}

export interface RecoveryExecutionTools {
  execute(input: ExecuteToolInput): Promise<ExecuteToolOutput>;
  recheckPayment(input: {
    currentAmountPaise: number;
    currentStatus: PaymentStatus;
    dataSource: DataSource;
    paymentId: string;
  }): Promise<PaymentRecheck>;
  verifyPaymentLink(paymentLinkId: string): Promise<RazorpayPaymentLink>;
}

export function paymentLinkReference(actionId: string): string {
  const normalized = actionId.replaceAll(/[^a-zA-Z0-9]/g, "");
  return `recovery_${normalized.slice(0, 31)}`;
}

function mappedPaymentStatus(status: string): PaymentStatus {
  if (status === "captured") return "CAPTURED";
  if (status === "authorized") return "AUTHORIZED";
  if (status === "failed") return "FAILED";
  return "CREATED";
}

function simulatedOutput(actionType: ActionType): ExecuteToolOutput {
  const descriptions: Partial<Record<ActionType, string>> = {
    ALTERNATIVE_METHOD:
      "Alternative payment method suggestion recorded; no customer message was sent.",
    ESCALATE: "Case routed to the simulated operations escalation path.",
    SEND_REMINDER:
      "Reminder recorded in simulation; no customer message was sent.",
    STOP: "Automated recovery stopped for this case.",
    WAIT: "Recovery paused until the next scheduled evaluation.",
  };
  return {
    razorpayReference: null,
    value: {
      delivery: "SIMULATED",
      description: descriptions[actionType] ?? "Simulated action completed.",
      externalSideEffect: false,
    },
  };
}

export function createRecoveryExecutionTools(
  razorpay: RazorpayClient | null,
): RecoveryExecutionTools {
  function configuredClient(): RazorpayClient {
    if (!razorpay) {
      throw new Error(
        "Set RAZORPAY_TEST_MODE_API_KEY and RAZORPAY_TEST_MODE_SECRET_KEY before executing Test Mode recovery actions.",
      );
    }
    return razorpay;
  }

  return {
    async execute(input) {
      if (input.actionType !== "CREATE_PAYMENT_LINK") {
        return simulatedOutput(input.actionType);
      }
      if (input.dataSource !== "RAZORPAY_TEST_MODE") {
        return {
          ...simulatedOutput(input.actionType),
          value: {
            delivery: "SIMULATED",
            description: "Payment Link creation simulated for fixture data.",
            externalSideEffect: false,
          },
        };
      }
      if (input.currency !== "INR") {
        throw new Error("Recovery Payment Links currently support INR only.");
      }

      const referenceId = paymentLinkReference(input.actionId);
      const result = await configuredClient().ensurePaymentLink({
        amountPaise: input.amountPaise,
        currency: "INR",
        description: `Recovery for ${input.casePublicId}`,
        notes: {
          recovery_action_id: input.actionId,
          recovery_case_id: input.casePublicId,
        },
        referenceId,
      });
      return {
        razorpayReference: result.paymentLink.id,
        value: {
          created: result.created,
          externalSideEffect: true,
          notificationsEnabled: false,
          paymentLinkId: result.paymentLink.id,
          referenceId,
          shortUrl: result.paymentLink.short_url,
          status: result.paymentLink.status,
        },
      };
    },

    async recheckPayment(input) {
      if (input.dataSource === "SIMULATED") {
        return {
          amountPaise: input.currentAmountPaise,
          status: input.currentStatus,
        };
      }
      const payment = await configuredClient().fetchPayment(input.paymentId);
      return {
        amountPaise: payment.amount,
        status: mappedPaymentStatus(payment.status),
      };
    },

    verifyPaymentLink: (paymentLinkId) =>
      configuredClient().fetchPaymentLink(paymentLinkId),
  };
}
