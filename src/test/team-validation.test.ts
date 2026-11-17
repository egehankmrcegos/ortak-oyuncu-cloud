import { describe, expect, it, vi } from "vitest";
import { validateClub } from "@/lib/team-validation";

describe("Gerçek takım seçimi", () => {
  it("var olmayan takımı reddeder", async () => {
    await expect(validateClub("Zzzzz Hayali Futbol 999", async () => ({ exists: false, sources: [] }))).rejects.toThrow("Lütfen var olan bir takımın adını yaz");
  });
  it("bilinen takım kısaltmasını arama yapmadan kabul eder", async () => {
    const lookup = vi.fn();
    expect(await validateClub("GS", lookup)).toBe("Galatasaray");
    expect(lookup).not.toHaveBeenCalled();
  });
  it("Trabzon seçimini Trabzonspor olarak arama yapmadan kabul eder", async () => {
    const lookup = vi.fn(async () => ({ exists: false, sources: [] }));
    expect(await validateClub("trabzon", lookup)).toBe("Trabzonspor");
    expect(lookup).not.toHaveBeenCalled();
  });
  it("listede olmayan gerçek kulübü kaynakla kabul eder", async () => {
    expect(await validateClub("Sakaryaspor", async () => ({ exists: true, sources: ["https://www.sakaryaspor.org.tr/"] }))).toBe("Sakaryaspor");
  });
  it("kaynaksız doğrulamayı kabul etmez", async () => {
    await expect(validateClub("Hayali Kulüp", async () => ({ exists: true, sources: [] }))).rejects.toThrow();
  });
  it.each([["totten", "Tottenham"], ["astonv", "Aston Villa"]])("%s kısaltmasını gerçek takım olarak kabul eder", async (input, expected) => {
    const lookup = vi.fn(async () => ({ exists: false, sources: [] }));
    expect(await validateClub(input, lookup)).toBe(expected);
    expect(lookup).not.toHaveBeenCalled();
  });
  it("totsok adını Tottenham saymaz ve doğrulanmadığında reddeder", async () => {
    const lookup = vi.fn(async () => ({ exists: false, sources: [] }));
    await expect(validateClub("totsok", lookup)).rejects.toThrow("Lütfen var olan bir takımın adını yaz");
    expect(lookup).toHaveBeenCalledWith("totsok");
  });
});