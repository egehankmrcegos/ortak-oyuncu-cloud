export type SummaryAttempt = { id: string; round_no: number; nickname: string; answer: string; correct: boolean; explanation: string | null; created_at: string };
export type SummaryRound = { round_no: number; match_start_round: number; team_a: string | null; team_b: string | null; winner_player_id: string | null; answer: string | null; outcome: string; attempts: SummaryAttempt[] };

export function buildMatchSummary<T extends Omit<SummaryRound, "attempts">>(rounds: T[], attempts: SummaryAttempt[], start: number) {
  return rounds.filter(round => round.match_start_round === start && round.round_no >= start)
    .sort((a, b) => a.round_no - b.round_no)
    .map(round => ({ ...round, attempts: attempts.filter(attempt => attempt.round_no === round.round_no) }));
}