import { describe, expect, it } from "vitest";
import { careerCanJudge, sharedCatalogPlayers, resolveCatalogPlayer, type CatalogCareer } from "@/lib/football-catalog";

const today = "2026-11-14";
const career: CatalogCareer = {
  player_id: "Q615", club_id: "Q7156", start_date: "2004-01-01", end_date: "2021-01-01",
  reported_appearances: 520, review_status: "verified", verified_source_url: "https://www.fcbarcelona.com/",
};

describe("free-data catalogue safety", () => {
  it("matches a unique player name but never guesses an ambiguous surname or description", () => {
    const players = [{ id: "m", name: "Lionel Messi" }, { id: "a", name: "Cristiano Ronaldo" }, { id: "b", name: "Ronaldo Nazario" }];
    expect(resolveCatalogPlayer("messi", players)).toBe("m");
    expect(resolveCatalogPlayer("Ronaldo", players)).toBeNull();
    expect(resolveCatalogPlayer("AHÇ", players)).toBeNull();
    expect(resolveCatalogPlayer("kaleci adını hatırlamıyorum", players)).toBeNull();
  });
  it("does not let pending imports replace the sourced referee", () => {
    expect(careerCanJudge({ ...career, review_status: "pending" }, today)).toBe(false);
  });
  it("excludes careers ending before 1985", () => {
    expect(careerCanJudge({ ...career, start_date: "1970-01-01", end_date: "1984-12-31" }, today)).toBe(false);
    expect(careerCanJudge({ ...career, start_date: "1984-01-01", end_date: "1985-01-01" }, today)).toBe(true);
  });
  it("requires positive appearances rather than membership only", () => {
    expect(careerCanJudge({ ...career, reported_appearances: 0 }, today)).toBe(false);
    expect(careerCanJudge({ ...career, reported_appearances: null }, today)).toBe(false);
  });
  it("does not accept future transfers", () => {
    expect(careerCanJudge({ ...career, start_date: "2027-01-01" }, today)).toBe(false);
  });
  it("requires evidence for both clubs and deduplicates loan periods", () => {
    const paris = { ...career, club_id: "Q483020", reported_appearances: 58 };
    expect(sharedCatalogPlayers([career, paris, paris], "Q7156", "Q483020", today)).toEqual(["Q615"]);
    expect(sharedCatalogPlayers([career, { ...paris, review_status: "pending" }], "Q7156", "Q483020", today)).toEqual([]);
  });
});