import { describe, expect, it } from "vitest";
import {
  authReturnPath,
  googleCallbackUrl,
  googleStartPath,
  oauthCallbackForwardPath,
  oauthErrorMessage,
  publicRequestOrigin,
} from "./oauth";

describe("google oauth helpers", () => {
  it("keeps post-login destinations on this site", () => {
    expect(googleStartPath("/rate")).toBe("/auth/google?next=%2Frate");
    expect(googleStartPath("/rate", "signup")).toBe("/auth/google?next=%2Frate&intent=signup");
    expect(googleStartPath("https://evil.example")).toBe("/auth/google");
    expect(googleCallbackUrl("/admin", "login", "https://livrank.ca")).toBe(
      "https://livrank.ca/auth/callback?next=%2Fadmin",
    );
    expect(googleCallbackUrl("//evil.example", "login", "https://livrank.ca")).toContain("next=%2Faccount");
    expect(
      publicRequestOrigin(
        new Request("http://127.0.0.1/auth/google", {
          headers: { "x-forwarded-host": "livrank.ca", "x-forwarded-proto": "https" },
        }),
      ),
    ).toBe("https://livrank.ca");
    expect(authReturnPath("signup")).toBe("/signup");
    expect(authReturnPath("login")).toBe("/login");
  });

  it("sends a homepage Google return to the auth callback", () => {
    expect(
      oauthCallbackForwardPath(
        "/",
        new URLSearchParams("code=88007ada-b6b0-4dbe-89c2-3cf49e174cb6"),
      ),
    ).toBe("/auth/callback?code=88007ada-b6b0-4dbe-89c2-3cf49e174cb6&next=%2Faccount");
    expect(oauthCallbackForwardPath("/auth/callback", new URLSearchParams("code=88007ada-b6b0-4dbe-89c2-3cf49e174cb6"))).toBeNull();
    expect(oauthCallbackForwardPath("/", new URLSearchParams("code=not-a-login"))).toBeNull();
  });

  it("explains failed Google sign-in without leaking internals", () => {
    expect(oauthErrorMessage("google")).toMatch(/Google sign-in/);
    expect(oauthErrorMessage("auth")).toMatch(/not configured/);
    expect(oauthErrorMessage(null)).toBeNull();
  });
});
