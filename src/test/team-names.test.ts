import { describe, expect, it } from "vitest";
import { normalizeTeamName } from "@/lib/team-names";

describe("Takım adlarını düzeltme", () => {
  it.each([
    ["galatsaray", "Galatasaray"], ["fenerbahce", "Fenerbahçe"],
    ["besiktas", "Beşiktaş"], ["dortmun", "Borussia Dortmund"],
    ["GS", "Galatasaray"], ["FB", "Fenerbahçe"],
    ["BJK", "Beşiktaş"], ["PSG", "Paris Saint-Germain"],
    ["trabzon", "Trabzonspor"], ["TRABZON", "Trabzonspor"],
    ["man utd", "Manchester United"], ["barselona", "Barcelona"],
    ["totten", "Tottenham"], ["astonv", "Aston Villa"],
    ["aston v", "Aston Villa"], ["liver", "Liverpool"],
    ["galat", "Galatasaray"], ["newcas", "Newcastle United"],
  ])("%s adını %s olarak düzeltir", (input, expected) => {
    expect(normalizeTeamName(input)).toBe(expected);
  });
  it("belirsiz veya bilinmeyen isimleri farklı takımlara çevirmez", () => {
    expect(normalizeTeamName("Manchester")).toBe("Manchester");
    expect(normalizeTeamName("United")).toBe("United");
    expect(normalizeTeamName("Sakaryaspor")).toBe("Sakaryaspor");
    expect(normalizeTeamName("totsok")).toBe("totsok");
    expect(normalizeTeamName("borussia")).toBe("borussia");
    expect(normalizeTeamName("tott")).toBe("tott");
  });
});
describe("Lig takımları ve aynı takım", () => {
  it.each([
    ["feyenord", "Feyenoord"], ["ajak", "Ajax"], ["ayax", "Ajax"], ["psv", "PSV"], ["benfca", "Benfica"], ["sporting", "Sporting CP"],
    ["leverkusen", "Bayer Leverkusen"], ["marseille", "Marsilya"], ["betis", "Real Betis"],
    ["newcastle", "Newcastle United"], ["alanya", "Alanyaspor"], ["konya", "Konyaspor"], ["samsunspr", "Samsunspor"],
  ])("%s → %s", (i, e) => expect(normalizeTeamName(i)).toBe(e));
  it("farklı kulüpleri karıştırmaz", () => {
    expect(normalizeTeamName("Real Sociedad")).toBe("Real Sociedad");
    expect(normalizeTeamName("Sporting Gijon")).toBe("Sporting Gijon");
    expect(normalizeTeamName("Manchester")).toBe("Manchester");
    expect(normalizeTeamName("Almanya")).toBe("Almanya");
  });
  it("aynı takımı farklı yazımlarda tanır", async () => {
    const { sameTeam } = await import("@/lib/team-names");
    expect(sameTeam("GS", "galatasray")).toBe(true);
    expect(sameTeam("Real Madrid", "Real Betis")).toBe(false);
  });
});

import { normalizeTeamName as n2 } from "@/lib/team-names";
import { it as it2, expect as ex2 } from "vitest";
it2("chealse yazımı Chelsea olarak anlaşılır", () => {
  ex2(n2("chealse")).toBe("Chelsea");
  ex2(n2("Chelsae")).toBe("Chelsea");
});
