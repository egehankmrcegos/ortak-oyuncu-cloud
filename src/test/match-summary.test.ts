import { expect, it } from "vitest";
import { buildMatchSummary } from "@/lib/match-summary";

it("maçın bütün turlarını cevapları ve yanlış nedenleriyle sıralar", () => {
  const rounds = [2, 1].map(round_no => ({ round_no, match_start_round: 1, team_a: "Galatasaray", team_b: "Barcelona", winner_player_id: null, answer: null, outcome: "skipped" }));
  const attempts = [{ id: "a", round_no: 1, nickname: "Ali", answer: "Messi", correct: false, explanation: "Galatasaray A takımında oynamadı", created_at: "2026-11-13" }];
  const result = buildMatchSummary(rounds, attempts, 1);
  expect(result.map(round => round.round_no)).toEqual([1, 2]);
  expect(result[0]?.attempts[0]).toEqual(attempts[0]);
  expect(result[1]?.attempts).toEqual([]);
});
it("rövanş özetine önceki maçı dahil etmez", () => {
  const rounds = [1, 4].map(round_no => ({ round_no, match_start_round: round_no, team_a: null, team_b: null, winner_player_id: null, answer: null, outcome: "skipped" }));
  expect(buildMatchSummary(rounds, [], 4).map(round => round.round_no)).toEqual([4]);
});