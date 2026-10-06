import { describe, expect, it } from "vitest";
import {
  authReturnPath,
  googleCallbackUrl,
  googleStartPath,
  isAllowedOAuthUrl,
  oauthCallbackForwardPath,
  oauthCookieOptions,
  oauthErrorMessage,
  publicRequestOrigin,
} from "./oauth";

describe("google oauth helpers", () => {
  it("keeps post-login destinations on this site", () => {
    expect(googleStartPath("/rate")).toBe("/auth/google?next=%2Frate");
    expect(googleStartPath("/rate", "signup")).toBe("/auth/google?next=%2Frate&intent=signup");
    expect(googleStartPath("https://evil.example")).toBe("/auth/google");
    expect(googleCallbackUrl("/admin", "login", "https://livrank.ca")).toBe(
      "https://livrank.ca/auth/callback?return=%2Fadmin",
    );
    expect(googleCallbackUrl("/auth/callback", "login", "https://livrank.ca")).toContain("return=%2Faccount");
    expect(googleCallbackUrl("//evil.example", "login", "https://livrank.ca")).toContain("return=%2Faccount");
    expect(
      publicRequestOrigin(
        new Request("http://127.0.0.1/auth/google", {
          headers: { "x-forwarded-host": "livrank.ca", "x-forwarded-proto": "https" },
        }),
      ),
    ).toBe("https://livrank.ca");
    expect(
      publicRequestOrigin(
        new Request("http://localhost:3000/auth/google", {
          headers: { host: "livrank.ca", "x-forwarded-proto": "https" },
        }),
      ),
    ).toBe("https://livrank.ca");
    expect(
      publicRequestOrigin(
        new Request("http://localhost:3000/auth/google", {
          headers: { origin: "https://livrank.ca" },
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
    ).toBe("/auth/callback?code=88007ada-b6b0-4dbe-89c2-3cf49e174cb6&return=%2Faccount");
    expect(
      oauthCallbackForwardPath(
        "/account",
        new URLSearchParams("code=6c2ece1a-c652-4417-9780-2ffac012756a&next=%2Faccount&intent=signup"),
      ),
    ).toBe("/auth/callback?code=6c2ece1a-c652-4417-9780-2ffac012756a&return=%2Faccount&intent=signup");
    expect(oauthCallbackForwardPath("/auth/callback", new URLSearchParams("code=88007ada-b6b0-4dbe-89c2-3cf49e174cb6"))).toBeNull();
    expect(oauthCallbackForwardPath("/auth/callback/", new URLSearchParams("code=88007ada-b6b0-4dbe-89c2-3cf49e174cb6"))).toBeNull();
    expect(
      oauthCallbackForwardPath(
        "/account",
        new URLSearchParams("code=88007ada-b6b0-4dbe-89c2-3cf49e174cb6&next=%2Fauth%2Fcallback"),
      ),
    ).toBe("/auth/callback?code=88007ada-b6b0-4dbe-89c2-3cf49e174cb6&return=%2Faccount");
    expect(oauthCallbackForwardPath("/", new URLSearchParams("code=not-a-login"))).toBeNull();
  });

  it("explains failed Google sign-in without leaking internals", () => {
    expect(oauthErrorMessage("google")).toMatch(/Google sign-in/);
    expect(oauthErrorMessage("auth")).toMatch(/not configured/);
    expect(oauthErrorMessage(null)).toBeNull();
  });

  it("only follows Google or Supabase OAuth URLs", () => {
    expect(isAllowedOAuthUrl("https://ejnufckxsvsebfsrhmet.supabase.co/auth/v1/authorize")).toBe(true);
    expect(isAllowedOAuthUrl("https://accounts.google.com/o/oauth2/v2/auth")).toBe(true);
    expect(isAllowedOAuthUrl("https://evil.example/auth")).toBe(false);
    expect(oauthCookieOptions("https://livrank.ca")).toEqual({ path: "/", sameSite: "lax", secure: true });
    expect(oauthCookieOptions("http://localhost:3000").secure).toBe(false);
  });
});
