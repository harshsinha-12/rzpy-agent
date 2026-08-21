import { describe, expect, it } from "vitest";

import {
  parseRecoveryQuery,
  recoveryHref,
  toRecoverySearchParams,
} from "./query";

describe("recovery query state", () => {
  it("parses compatible filters and sorting", () => {
    expect(
      parseRecoveryQuery({
        dataSource: "SIMULATED",
        page: "2",
        paymentMethod: "UPI",
        search: " pay_sim ",
        sortBy: "amountAtRiskPaise",
        sortOrder: "asc",
        status: "RECOVERED",
      }),
    ).toEqual({
      dataSource: "SIMULATED",
      page: 2,
      pageSize: 10,
      paymentMethod: "UPI",
      search: "pay_sim",
      sortBy: "amountAtRiskPaise",
      sortOrder: "asc",
      status: "RECOVERED",
    });
  });

  it("falls back safely when a query is invalid", () => {
    expect(parseRecoveryQuery({ page: "0", status: "NOT_A_STATE" })).toEqual({
      page: 1,
      pageSize: 10,
      sortBy: "lastUpdatedAt",
      sortOrder: "desc",
    });
  });

  it("preserves filters while changing the current page", () => {
    const query = parseRecoveryQuery({
      page: "3",
      paymentMethod: "CARD",
      search: "order_42",
    });
    const params = toRecoverySearchParams(query, { page: 1 });

    expect(params.get("page")).toBe("1");
    expect(params.get("paymentMethod")).toBe("CARD");
    expect(params.get("search")).toBe("order_42");
    expect(recoveryHref(query, { page: 1 })).toContain("paymentMethod=CARD");
  });
});
