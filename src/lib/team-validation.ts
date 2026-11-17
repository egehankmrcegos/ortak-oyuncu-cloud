import { isKnownClub, normalizeTeamName } from "./team-names";

export type ClubEvidence = { exists: boolean; sources: string[] };
export async function validateClub(value: string, lookup: (team: string) => Promise<ClubEvidence>): Promise<string> {
  const team = normalizeTeamName(value);
  if (isKnownClub(team)) return team;
  const result = await lookup(team);
  if (!result.exists || !result.sources.some(url => { try { return new URL(url).protocol === "https:"; } catch { return false; } })) {
    throw new Error("Bu adla bir futbol kulübü doğrulanamadı. Lütfen var olan bir takımın adını yaz.");
  }
  return team;
}