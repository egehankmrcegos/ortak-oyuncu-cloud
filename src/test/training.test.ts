import { describe, it, expect } from "vitest";
import { trainingOpponent, trainingVerdict, trainingClubs } from "@/lib/football-referee.server";

describe("solo training", () => {
  it("opponent is a different club that shares a verified player", () => {
    const pair = trainingOpponent("Barcelona", undefined, () => 0)!;
    expect(pair.opponent).not.toBe("Barcelona");
    expect(trainingVerdict(pair.club, pair.opponent, "x").suggestions.length).toBeGreaterThan(0);
  });
  it("avoids repeating the previous opponent when possible", () => {
    const first = trainingOpponent("Barcelona", undefined, () => 0)!;
    const options = trainingClubs();
    if (options.length > 2) expect(trainingOpponent("Barcelona", first.opponent, () => 0)!.opponent).not.toBe(first.opponent);
  });
  it("unknown answers are unverified, never wrong", () => {
    expect(trainingVerdict("Barcelona", "Paris Saint-Germain", "Uydurma Oyuncu").status).toBe("unverified");
  });
  it("Messi is correct for Barcelona and PSG", () => {
    expect(trainingVerdict("Barcelona", "Paris Saint-Germain", "Messi").status).toBe("correct");
  });
});

describe("expanded catalogue", () => {
  it("covers many clubs", () => { expect(trainingClubs().length).toBeGreaterThan(100); });
  it("accepts a misspelled Batshuayi for Beşiktaş and Dortmund", () => {
    expect(trainingVerdict("Beşiktaş", "Borussia Dortmund", "batsuai").status).toBe("correct");
  });
  it("Quaresma links Beşiktaş and Chelsea", () => {
    expect(trainingVerdict("Beşiktaş", "Chelsea", "Quaresma").status).toBe("correct");
  });
});
