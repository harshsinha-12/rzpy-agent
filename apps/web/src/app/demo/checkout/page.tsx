import type { Metadata } from "next";
import Link from "next/link";

import { CheckoutTrigger } from "@/features/demo-checkout/components/checkout-trigger";
import { fetchCheckoutStatus } from "@/features/demo-checkout/fetchers";

import styles from "@/features/demo-checkout/components/checkout.module.css";

export const metadata: Metadata = {
  description: "Trigger a Razorpay Test Mode failed payment into RecoveryOS.",
  title: "Test Mode checkout",
};

export default async function DemoCheckoutPage() {
  const status = await fetchCheckoutStatus();

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Razorpay Test Mode</p>
          <h1 className="page-title">
            Send a real failure
            <br />
            <span className="title-accent">into Reported Issues.</span>
          </h1>
          <p className="page-description">
            Checkout uses Razorpay Test Mode, not live money. Failed payments
            are labelled RAZORPAY_TEST_MODE so they never look like merchant
            revenue.
          </p>
        </div>
      </header>
      <section className={`surface ${styles.panel}`}>
        {status.configured ? (
          <>
            <ol className={styles.steps}>
              <li>Open checkout and pay with UPI ID failure@razorpay.</li>
              <li>
                Razorpay sends payment.failed to{" "}
                <code>POST /webhooks/razorpay</code>.
              </li>
              <li>
                Open{" "}
                <Link
                  className={styles.link}
                  href="/recoveries?dataSource=RAZORPAY_TEST_MODE"
                >
                  Reported Issues
                </Link>{" "}
                and look for the RAZORPAY_TEST_MODE row.
              </li>
            </ol>
            <CheckoutTrigger />
          </>
        ) : (
          <ol className={styles.steps}>
            <li>
              Create Test Mode API keys at{" "}
              <a className={styles.link} href={status.keySetupUrl}>
                the Razorpay dashboard
              </a>
              .
            </li>
            <li>
              Put <code>RAZORPAY_TEST_MODE_API_KEY</code> and{" "}
              <code>RAZORPAY_TEST_MODE_SECRET_KEY</code> in the untracked{" "}
              <code>.env</code> file.
            </li>
            <li>
              Create a webhook at{" "}
              <a className={styles.link} href={status.webhookSetupUrl}>
                Webhooks
              </a>{" "}
              for payment.failed, payment.authorized, and payment.captured. Use
              a public HTTPS URL to <code>/webhooks/razorpay</code> and store
              the webhook secret as <code>RAZORPAY_WEBHOOK_SECRET</code>.
            </li>
            <li>
              Restart the API, then return here to open Test Mode checkout.
            </li>
          </ol>
        )}
      </section>
    </div>
  );
}
