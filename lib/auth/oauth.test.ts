import { describe, expect, it } from "vitest";
import { authReturnPath, googleCallbackUrl, googleStartPath, oauthErrorMessage } from "./oauth";

describe("google oauth helpers", () => {
  it("keeps post-login destinations on this site", () => {
    expect(googleStartPath("/rate")).toBe("/auth/google?next=%2Frate");
    expect(googleStartPath("/rate", "signup")).toBe("/auth/google?next=%2Frate&intent=signup");
    expect(googleStartPath("https://evil.example")).toBe("/auth/google");
    expect(googleCallbackUrl("/admin")).toContain("/auth/callback?next=%2Fadmin");
    expect(googleCallbackUrl("//evil.example")).toContain("next=%2Faccount");
    expect(authReturnPath("signup")).toBe("/signup");
    expect(authReturnPath("login")).toBe("/login");
  });

  it("explains failed Google sign-in without leaking internals", () => {
    expect(oauthErrorMessage("google")).toMatch(/Google sign-in/);
    expect(oauthErrorMessage("auth")).toMatch(/not configured/);
    expect(oauthErrorMessage(null)).toBeNull();
  });
});
