import { describe, expect, it } from "vitest";
import { verbatimReviewQuotes } from "./quotes";

const QUIET =
  "I lived in unit 1204 for two years as a former renter. The suite was generally quiet at night. Maintenance took about two weeks for a dishwasher repair, but the lobby and elevators were kept clean.";

const SPAM_JOBS =
  "nice amaizng jobsnice amaizng jobsnice amaizng jobsnice amaizng jobsnice amaizng jobsnice amaizng jobsnice amaizng jobsnice amaizng jobs";

const SPAM_KEYS = "232332233223dfsf sdf sd fsdfdsfsf sd fsd f dsfsdfsdfsdfdsf";

describe("verbatimReviewQuotes", () => {
  it("keeps a readable renter sentence", () => {
    expect(verbatimReviewQuotes([{ review_body: QUIET }])).toEqual([
      "I lived in unit 1204 for two years as a former renter.",
    ]);
  });

  it("skips repeated-token and keyboard-smash bodies", () => {
    expect(verbatimReviewQuotes([{ review_body: SPAM_JOBS }, { review_body: SPAM_KEYS }])).toEqual([]);
  });

  it("falls through to a later readable review", () => {
    expect(verbatimReviewQuotes([{ review_body: SPAM_JOBS }, { review_body: QUIET }])).toEqual([
      "I lived in unit 1204 for two years as a former renter.",
    ]);
  });
});
