import type { Metadata } from "next";
import { connection } from "next/server";
import { DropOffList } from "@/features/checkout-dropoffs/components/dropoff-list";
import { fetchCheckoutDropOffs } from "@/features/checkout-dropoffs/fetchers";

export const metadata: Metadata = {
  title: "Checkout drop-offs",
  description: "Merchant-selected recovery email drafts for unpaid checkouts.",
};

export default async function DropOffsPage() {
  await connection();
  const response = await fetchCheckoutDropOffs();
  return (
    <div className="page-stack">
      <header className="page-heading">
        <p className="eyebrow">Checkout recovery</p>
        <h1 className="page-title">
          Recover the orders
          <br />
          <span className="title-accent">that never paid.</span>
        </h1>
        <p className="page-description">
          These are separate from failed payments. RecoveryOS prepares a
          policy-gated email only after merchant selection; you copy and send it
          yourself until an email provider is connected.
        </p>
      </header>
      <DropOffList initialItems={response.data} />
    </div>
  );
}
