import { describe, expect, it } from "vitest";

import {
  actionTypes,
  failureCategories,
  policyDecisions,
  recoveryCaseStatuses,
} from "./enums.js";

describe("recovery domain enums", () => {
  it("covers the Step 2 seed case states", () => {
    expect(recoveryCaseStatuses).toEqual(
      expect.arrayContaining([
        "RECOVERED",
        "WAITING",
        "STOPPED",
        "ESCALATED",
        "EXHAUSTED",
      ]),
    );
  });

  it("covers the bounded recovery actions and policy decisions", () => {
    expect(actionTypes).toEqual([
      "WAIT",
      "CREATE_PAYMENT_LINK",
      "SEND_REMINDER",
      "ALTERNATIVE_METHOD",
      "ESCALATE",
      "STOP",
    ]);
    expect(policyDecisions).toEqual(["APPROVED", "DENIED"]);
    expect(failureCategories).toContain("MERCHANT_ERROR");
  });
});
