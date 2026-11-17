import { describe, expect, it } from "vitest";
import { AI_CONSENT_KEY, AI_CONSENT_VERSION, hasAIConsent, forgetLocalGameData } from "@/lib/app-privacy";

describe("game privacy", () => {
  it("requires explicit current consent, not missing or stale consent", () => {
    localStorage.clear();
    expect(hasAIConsent(localStorage)).toBe(false);
    localStorage.setItem(AI_CONSENT_KEY, "old");
    expect(hasAIConsent(localStorage)).toBe(false);
    localStorage.setItem(AI_CONSENT_KEY, AI_CONSENT_VERSION);
    expect(hasAIConsent(localStorage)).toBe(true);
  });
  it("withdraws consent and all local room identities without erasing other applications", () => {
    localStorage.clear();
    localStorage.setItem(AI_CONSENT_KEY, AI_CONSENT_VERSION);
    localStorage.setItem("omubumu:ABCDE", "identity");
    localStorage.setItem("omubumu:FGHJK", "identity");
    localStorage.setItem("unrelated", "preserve");
    forgetLocalGameData(localStorage);
    expect(hasAIConsent(localStorage)).toBe(false);
    expect(localStorage.getItem("omubumu:ABCDE")).toBeNull();
    expect(localStorage.getItem("omubumu:FGHJK")).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("preserve");
  });
});