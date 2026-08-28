"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { TEST_MODE_DEMO_AMOUNT_PAISE } from "@recoveryos/domain";

import { publicApiUrl } from "@/config/env";
import { formatMoney } from "@/lib/formatters";

import { checkoutOrderSchema } from "../schemas";
import styles from "./checkout.module.css";

interface RazorpayCheckout {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayCheckout;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function CheckoutTrigger() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startCheckout() {
    setBusy(true);
    setError(null);

    try {
      await loadCheckoutScript();
      const response = await fetch(
        new URL("/demo/razorpay/orders", publicApiUrl),
        { method: "POST" },
      );
      const body: unknown = await response.json();
      const parsed = checkoutOrderSchema.safeParse(body);

      if (!response.ok || !parsed.success) {
        throw new Error(
          "Could not create a Razorpay Test Mode order. Add Test Mode keys first.",
        );
      }

      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) {
        throw new Error("Razorpay Checkout failed to load.");
      }

      const checkout = new RazorpayCheckout({
        amount: parsed.data.data.amountPaise,
        currency: parsed.data.data.currency,
        handler() {
          router.push("/recoveries?dataSource=RAZORPAY_TEST_MODE");
        },
        key: parsed.data.data.keyId,
        name: "Aurora Retail",
        notes: { source: "recoveryos_demo" },
        order_id: parsed.data.data.orderId,
        prefill: {
          contact: "+919000000099",
          email: "demo.customer@example.com",
          name: "Demo Customer",
        },
        theme: { color: "#3158ff" },
      });
      checkout.open();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The Test Mode checkout could not start.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.actions}>
      <button
        className="error-action"
        disabled={busy}
        onClick={() => void startCheckout()}
        type="button"
      >
        {busy
          ? "Opening checkout…"
          : `Fail a ${formatMoney(TEST_MODE_DEMO_AMOUNT_PAISE)} UPI payment`}
      </button>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load Razorpay Checkout."));
    document.body.append(script);
  });
}
