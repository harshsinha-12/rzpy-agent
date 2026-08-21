import { randomUUID } from "node:crypto";

import { PAISA_PER_RUPEE } from "@recoveryos/domain";

import { serviceUnavailableError } from "../../../lib/errors.js";
import type { DemoCheckoutService, DemoRazorpayOrders } from "./types.js";

export const RAZORPAY_KEY_SETUP_URL =
  "https://dashboard.razorpay.com/app/websiteapp-settings/api-keys";
export const RAZORPAY_WEBHOOK_SETUP_URL =
  "https://dashboard.razorpay.com/app/webhooks";

const DEMO_AMOUNT_PAISE = 4999 * PAISA_PER_RUPEE;

export function createDemoCheckoutService(options: {
  keyId: string;
  orders?: DemoRazorpayOrders;
}): DemoCheckoutService {
  return {
    async createOrder() {
      if (!options.keyId || !options.orders) {
        throw serviceUnavailableError(
          "RAZORPAY_NOT_CONFIGURED",
          `Add Razorpay Test Mode keys from ${RAZORPAY_KEY_SETUP_URL} to the local .env file.`,
        );
      }

      const order = await options.orders.createOrder({
        amountPaise: DEMO_AMOUNT_PAISE,
        currency: "INR",
        notes: { source: "recoveryos_demo" },
        receipt: `recoveryos_${randomUUID().slice(0, 8)}`,
      });

      return {
        amountPaise: order.amount,
        currency: "INR",
        keyId: options.keyId,
        orderId: order.id,
      };
    },

    getStatus() {
      return {
        configured: Boolean(options.keyId && options.orders),
        keySetupUrl: RAZORPAY_KEY_SETUP_URL,
        mode: "test",
        webhookSetupUrl: RAZORPAY_WEBHOOK_SETUP_URL,
      };
    },
  };
}
