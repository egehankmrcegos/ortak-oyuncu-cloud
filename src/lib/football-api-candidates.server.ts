import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { normalizeTeamName } from "@/lib/team-names";
import { playerNameKey } from "@/lib/football-catalog";

const API = "https://www.thesportsdb.com/api/v1/json/123";
type PlayerRow = { idPlayer?: string; strPlayer?: string; strTeam?: string | null };
type FormerTeam = { strFormerTeam?: string | null };

/** Query the free football API only on a local catalogue miss. API results are staged as pending candidates and never score an answer. */
export async function findExternalCareerCandidate(
  db: SupabaseClient<Database>,
  teamA: string,
  teamB: string,
  answer: string,
): Promise<boolean> {
  const key = playerNameKey(answer);
  if (key.length < 3) return false;

  const existing = await db.from("football_api_candidates").select("club_names")
    .eq("provider", "thesportsdb").eq("player_key", key).limit(20);
  if (!existing.error && existing.data?.length) {
    const clubs = existing.data.flatMap(row => row.club_names).map(normalizeTeamName);
    return clubs.includes(normalizeTeamName(teamA)) && clubs.includes(normalizeTeamName(teamB));
  }

  const queryUrl = `${API}/searchplayers.php?p=${encodeURIComponent(answer)}`;
  try {
    const searchResponse = await fetch(queryUrl, { signal: AbortSignal.timeout(3500) });
    if (!searchResponse.ok) return false;
    const search = await searchResponse.json() as { player?: PlayerRow[] | null };
    const player = search.player?.[0];
    if (!player?.idPlayer || !player.strPlayer) return false;

    const formerUrl = `${API}/lookupformerteams.php?id=${encodeURIComponent(player.idPlayer)}`;
    const formerResponse = await fetch(formerUrl, { signal: AbortSignal.timeout(3500) });
    if (!formerResponse.ok) return false;
    const former = await formerResponse.json() as { formerteams?: FormerTeam[] | null };
    const clubNames = [...new Set([player.strTeam, ...(former.formerteams ?? []).map(team => team.strFormerTeam)]
      .filter((name): name is string => !!name?.trim()))];

    const { error } = await db.from("football_api_candidates").upsert({
      provider: "thesportsdb",
      external_id: player.idPlayer,
      player_name: player.strPlayer,
      player_key: key,
      club_names: clubNames,
      source_url: `https://www.thesportsdb.com/player/${encodeURIComponent(player.idPlayer)}`,
      review_status: "pending",
      retrieved_at: new Date().toISOString(),
    }, { onConflict: "provider,external_id", ignoreDuplicates: true });
    if (error) return false;

    const normalized = clubNames.map(normalizeTeamName);
    return normalized.includes(normalizeTeamName(teamA)) && normalized.includes(normalizeTeamName(teamB));
  } catch {
    // External service failures never change the game's answer verdict.
    return false;
  }
}
