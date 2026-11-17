import { describe, expect, it } from "vitest";
import { chooseRandomTeams, randomPools } from "@/lib/random-teams";
import { isKnownClub } from "@/lib/team-names";

describe("Rastgele takım modu", () => {
  it.each(["easy", "medium", "hard"] as const)("%s zorluğunda iki farklı gerçek kulüp seçer", difficulty => {
    const pair = chooseRandomTeams(difficulty, [], () => 0);
    expect(pair).toHaveLength(2);
    expect(pair?.[0]).not.toBe(pair?.[1]);
    expect(pair?.every(team => randomPools[difficulty].includes(team) && isKnownClub(team))).toBe(true);
  });
  it("maçta kullanılan takımı kısaltmayla da tekrar seçmez", () => {
    expect(chooseRandomTeams("easy", ["GS", "fener"], () => 0)).toEqual(["Beşiktaş", "Trabzonspor"]);
  });
  it("havuz tükenince tekrar takım kullandırmaz", () => {
    expect(chooseRandomTeams("easy", [...randomPools.easy].slice(1), () => 0)).toBeNull();
  });
  it("rövanşta boş kullanılanlar listesiyle takımları yeniden açar", () => {
    expect(chooseRandomTeams("easy", [], () => 0)).toEqual(["Galatasaray", "Fenerbahçe"]);
  });
});