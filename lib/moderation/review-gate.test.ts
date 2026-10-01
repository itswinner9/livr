import { describe, expect, it } from "vitest";
import { holdReasonsFromFlags, labelHoldReason, screenReview } from "./review-gate";

const CLEAN_TITLE = "Quiet building, repairs can be slow";
const CLEAN_BODY =
  "I lived here for two years. The building was generally quiet at night. When my dishwasher stopped working, maintenance took about two weeks to fix it, though emergency issues were handled faster.";

describe("screenReview", () => {
  it("accepts clean renter text", () => {
    expect(screenReview({ title: CLEAN_TITLE, body: CLEAN_BODY })).toEqual({ ok: true });
  });

  it("flags an email address", () => {
    const result = screenReview({
      title: CLEAN_TITLE,
      body: `${CLEAN_BODY} Email me at renter@example.com for more detail.`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons).toContain("email");
  });

  it("flags a phone number", () => {
    const result = screenReview({
      title: CLEAN_TITLE,
      body: `${CLEAN_BODY} Call me at 604-555-1234 if you want more details.`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons).toContain("phone");
  });

  it("flags threatening language", () => {
    const result = screenReview({
      title: "Angry about repairs",
      body: `${CLEAN_BODY} I will kill you if this happens again after I already reported it.`,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons).toContain("threat");
  });

  it("flags a unit number leaked in the body", () => {
    const result = screenReview({
      title: CLEAN_TITLE,
      body: "I live in unit 1204 and the heating failed twice last winter in this building after I reported it.",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons).toContain("unit_in_text");
  });

  it("does not treat the word apartment alone as a unit leak", () => {
    expect(
      screenReview({
        title: CLEAN_TITLE,
        body: "The apartment was clean and maintenance took about two weeks to fix my dishwasher after I reported it.",
      }),
    ).toEqual({ ok: true });
  });

  it("accepts a short clean reply with an empty title", () => {
    expect(
      screenReview({
        title: "",
        body: "I lived here too and the lobby was usually quiet at night after ten.",
      }),
    ).toEqual({ ok: true });
  });

  it("holds spam reply bodies with an empty title", () => {
    const result = screenReview({
      title: "",
      body: "nice amaizng jobsnice amaizng jobsnice amaizng jobsnice amaizng jobs",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons).toContain("spam");
  });
});

describe("hold reason helpers", () => {
  it("reads reasons from stored flags", () => {
    expect(holdReasonsFromFlags({ reasons: ["email", "phone"] })).toEqual(["email", "phone"]);
    expect(labelHoldReason("email")).toBe("Contains an email address");
    expect(labelHoldReason("random_check")).toBe("Spot check");
  });
});
