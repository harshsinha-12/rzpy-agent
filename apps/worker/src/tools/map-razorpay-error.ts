import {
  isTransientRazorpayStatus,
  RazorpayApiError,
} from "@recoveryos/razorpay";
import { TransientRecoveryError } from "@recoveryos/recovery-engine";

export function rethrowRecoveryToolError(error: unknown): never {
  if (
    error instanceof RazorpayApiError &&
    isTransientRazorpayStatus(error.status)
  ) {
    throw new TransientRecoveryError(
      `Razorpay API returned HTTP ${error.status}.`,
    );
  }

  throw error;
}
