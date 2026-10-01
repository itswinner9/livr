import { afterEach, describe, expect, it, vi } from "vitest";
import { decideReviewVisibility, REVIEW_SPOT_CHECK_RATE } from "./auto-approve";

const CLEAN_TITLE = "Quiet building, repairs can be slow";
const CLEAN_BODY =
  "I lived here for two years. The building was generally quiet at night. When my dishwasher stopped working, maintenance took about two weeks to fix it, though emergency issues were handled faster.";

vi.mock("@/lib/env", () => ({
  hasOpenRouter: () => false,
}));

describe("decideReviewVisibility", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("always holds flagged reviews", async () => {
    const result = await decideReviewVisibility({
      title: CLEAN_TITLE,
      body: `${CLEAN_BODY} Email me at renter@example.com for more detail.`,
    });
    expect(result).toEqual({ publish: false, reasons: ["email"] });
  });

  it("auto-publishes most clean reviews", async () => {
    vi.spyOn(Math, "random").mockReturnValue(REVIEW_SPOT_CHECK_RATE);
    const result = await decideReviewVisibility({ title: CLEAN_TITLE, body: CLEAN_BODY });
    expect(result).toEqual({ publish: true, reasons: [] });
  });

  it("holds about 10% of clean reviews as a spot check", async () => {
    vi.spyOn(Math, "random").mockReturnValue(REVIEW_SPOT_CHECK_RATE - 0.0001);
    const result = await decideReviewVisibility({ title: CLEAN_TITLE, body: CLEAN_BODY });
    expect(result).toEqual({ publish: false, reasons: ["random_check"] });
  });
});
