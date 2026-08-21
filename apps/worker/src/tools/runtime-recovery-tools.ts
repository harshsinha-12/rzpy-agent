import { createRazorpayClient } from "@recoveryos/razorpay";

import { env } from "../config/env.js";
import {
  createRecoveryExecutionTools,
  type RecoveryExecutionTools,
} from "./recovery-tools.js";

export function createRuntimeRecoveryExecutionTools(): RecoveryExecutionTools {
  if (!env.RAZORPAY_TEST_MODE_API_KEY || !env.RAZORPAY_TEST_MODE_SECRET_KEY) {
    return createRecoveryExecutionTools(null);
  }

  return createRecoveryExecutionTools(
    createRazorpayClient({
      keyId: env.RAZORPAY_TEST_MODE_API_KEY,
      keySecret: env.RAZORPAY_TEST_MODE_SECRET_KEY,
      mode: "test",
    }),
  );
}
