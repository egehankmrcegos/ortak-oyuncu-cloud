import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fetchTff, parseTffFixtures, parseTffMatch, type TffAppearance } from "./football-tff.server";

// Source rights and identities remain pending. This job never changes judging input.
export async function stageTffAppearances(db: SupabaseClient<Database>, rows: TffAppearance[]) {
  if (!rows.length) return 0;
  const players = [...new Map(rows.map(r => [r.playerId, {
    id: r.playerId, name: r.playerName, source_url: `https://www.tff.org/Default.aspx?pageId=30&kisiId=${r.tffPlayerId}`,
    license: "Rights review pending; no redistribution licence established",
  }])).values()];
  const clubs = [...new Map(rows.map(r => [r.clubId, {
    id: r.clubId, name: `TFF club ${r.tffClubId}`, country_code: "TR",
    source_url: `https://www.tff.org/Default.aspx?pageId=28&kulupId=${r.tffClubId}`,
    license: "Rights review pending; no redistribution licence established",
  }])).values()];
  for (const result of [await db.from("football_clubs").upsert(clubs, { onConflict: "id", ignoreDuplicates: true }),
    await db.from("football_players").upsert(players, { onConflict: "id", ignoreDuplicates: true })]) {
    if (result.error) throw new Error("Football staging references could not be saved");
  }
  const { error } = await db.from("football_careers").upsert(rows.map(r => ({
    id: `tff:${r.matchId}:${r.tffClubId}:${r.tffPlayerId}`, player_id: r.playerId, club_id: r.clubId,
    start_date: r.playedOn, end_date: r.playedOn, reported_appearances: 1,
    source_url: r.sourceUrl, retrieved_at: new Date().toISOString(), review_status: "pending",
    review_method: "tff_match_starter_or_entered_pending_identity_and_rights", evidence: { ...r },
    evidence_license: "TFF rights reserved; usage review pending",
  })), { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error("Football staging evidence could not be saved");
  return rows.length;
}

export async function syncFootballSources(db: SupabaseClient<Database>, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  // Rotate across the season; two match pages per day, no unbounded callback loop.
  const slot = Math.floor(now.getTime() / 86400000);
  const week = slot % 34 + 1;
  const matches = parseTffFixtures(await fetchTff(`Default.aspx?pageID=198&hafta=${week}`), today);
  const offset = Math.floor(slot / 34) % Math.max(1, matches.length);
  const chosen = [...matches.slice(offset), ...matches.slice(0, offset)].slice(0, 2);
  const results = await Promise.allSettled(chosen.map(async id =>
    parseTffMatch(await fetchTff(`Default.aspx?pageId=29&macId=${id}`), id, today)));
  const rows = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
  const collected = await stageTffAppearances(db, rows);
  return { week, checkedMatches: chosen.length, collected, failures: results.filter(r => r.status === "rejected").length,
    judgingChanged: false, reviewRequired: true };
}