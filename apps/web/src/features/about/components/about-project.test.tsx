import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AboutProject } from "./about-project";

describe("AboutProject", () => {
  it("explains the core integrations and the worker scheduling model", () => {
    const markup = renderToStaticMarkup(<AboutProject />);

    expect(markup).toContain("Razorpay Test Mode");
    expect(markup).toContain("OpenAI · GPT-5.6 Terra");
    expect(markup).toContain("PostgreSQL + Prisma");
    expect(markup).toContain("Redis + BullMQ");
    expect(markup).toContain("Reconciliation every 60 seconds");
    expect(markup).toContain("No external cron service");
    expect(markup).toContain("AI can propose. It cannot move money.");
  });
});
