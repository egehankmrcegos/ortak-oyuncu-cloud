export type AppearanceEvidence = {
  provider: string;
  playerId: string;
  clubId: string;
  matchId: string;
  playedOn: string;
  role: "starter" | "entered" | "bench";
  sourceUrl: string;
  identityVerified: boolean;
  usageApproved: boolean;
};

// A squad listing or a transfer never establishes a first-team appearance.
export function evidenceCanPromote(row: AppearanceEvidence, today: string): boolean {
  return row.identityVerified && row.usageApproved &&
    (row.role === "starter" || row.role === "entered") &&
    /^\d{4}-\d{2}-\d{2}$/.test(row.playedOn) &&
    row.playedOn >= "1985-01-01" && row.playedOn <= today &&
    row.sourceUrl.startsWith("https://") && !!row.matchId && !!row.playerId && !!row.clubId;
}

export function mergeAppearanceEvidence(previous: AppearanceEvidence[], incoming: AppearanceEvidence[]) {
  const rows = new Map(previous.map(row => [evidenceKey(row), row]));
  for (const row of incoming) rows.set(evidenceKey(row), row);
  return [...rows.values()];
}

function evidenceKey(row: AppearanceEvidence) {
  return JSON.stringify([row.provider, row.playerId, row.clubId, row.matchId]);
}