import { describe, expect, it } from "vitest";
import { parseRoomCode, requireRoomCode, roomInviteUrl } from "@/lib/room-code";

describe("room invitation codes", () => {
  it("recovers the reported H2KWK invitation without treating its text as a code", () => {
    expect(parseRoomCode("H2KWK Futbol oyununa gel! Oda kodu: H2KWK")).toBe("H2KWK");
    expect(parseRoomCode(encodeURIComponent("H2KWK Futbol oyununa gel! Oda kodu: H2KWK"))).toBe("H2KWK");
  });
  it("accepts plain codes and complete invite links", () => {
    expect(parseRoomCode(" h2kwk ")).toBe("H2KWK");
    expect(parseRoomCode("https://ortak-oyuncu.lovable.app/oda/H2KWK")).toBe("H2KWK");
  });
  it("never guesses a code from invalid or conflicting invitation text", () => {
    expect(parseRoomCode("H2KWK Futbol oyununa gel! Oda kodu: ABCDE")).toBeNull();
    expect(parseRoomCode("H2KWKgarbage")).toBeNull();
    expect(parseRoomCode("rastgele yazı")).toBeNull();
    expect(() => requireRoomCode("abcdefghi")).toThrow("Davet bağlantısı geçersiz");
  });
  it("generates only a canonical invitation URL", () => {
    expect(roomInviteUrl("https://ortak-oyuncu.lovable.app", "h2kwk")).toBe("https://ortak-oyuncu.lovable.app/oda/H2KWK");
  });
});