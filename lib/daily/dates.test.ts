import { describe, expect, it } from "vitest";
import { currentYearMonth, daysUntil, monthLabel, parseDateOnly } from "./dates";

describe("daily dates", () => {
  it("parses calendar dates without timezone drift", () => {
    expect(parseDateOnly("2026-10-02")?.getFullYear()).toBe(2026);
    expect(parseDateOnly("2026-10-02")?.getMonth()).toBe(9);
    expect(parseDateOnly("2026-10-32")).toBeNull();
  });

  it("counts days from a fixed local date", () => {
    const from = new Date(2026, 9, 2);
    expect(daysUntil("2026-10-02", from)).toBe(0);
    expect(daysUntil("2026-10-05", from)).toBe(3);
    expect(daysUntil("2026-09-30", from)).toBe(-2);
  });

  it("labels the current month", () => {
    expect(monthLabel(2026, 10)).toContain("2026");
    expect(currentYearMonth(new Date(2026, 9, 2))).toEqual({ year: 2026, month: 10 });
  });
});
