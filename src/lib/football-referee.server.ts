import compact from "./data/football-catalog.json";
import { careerCanJudge, resolveCatalogPlayer, playerNameKey } from "./football-catalog";
import { reviewedSupplement } from "./data/football-supplement";
import { normalizeTeamName } from "./team-names";
import { verdictSchema } from "./game-rules";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { findExternalCareerCandidate } from "@/lib/football-api-candidates.server";

type Verdict = { correct: boolean; player: string; explanation: string; sources: string[]; verification?: "verified" | "unverified" };
// Compact rows: [playerId, clubId, startYear, leagueMatches, sourcePath].
const reviewed = {
  clubs: (compact.clubs as [string, string][]).map(([id, name]) => ({ id, name })),
  careers: (compact.careers as [string, string, number, number, string][]).map(([player_id, club_id, year, caps, src]) => ({
    player_id, club_id, start_date: `${year}-01-01`, end_date: null, reported_appearances: caps, review_status: "verified",
    verified_source_url: src.startsWith("https://") ? src : compact.sourcePrefix + src,
  })),
};
for (const [player_id, clubName, year, n, url] of reviewedSupplement) {
  const club = reviewed.clubs.find(c => c.name === clubName);
  if (club) reviewed.careers.push({ player_id, club_id: club.id, start_date: `${year}-01-01`, end_date: null, reported_appearances: n, review_status: "verified", verified_source_url: url });
}
const caps = new Map<string, number>();
for (const c of reviewed.careers) caps.set(c.player_id, (caps.get(c.player_id) ?? 0) + c.reported_appearances);
const playerWeight = (id: string) => caps.get(id) ?? 0;
const cachePlayers = (compact.players as [string, string][]).map(([id, name]) => ({ id, name }));
const today = () => new Date().toISOString().slice(0, 10);

export function pairKey(a: string, b: string) {
  return JSON.stringify([normalizeTeamName(a), normalizeTeamName(b)].sort());
}

// Club -> eligible players index, rebuilt once per day (catalogue has tens of thousands of careers).
let index: { day: string; byClub: Map<string, Map<string, string[]>> } | null = null;
function clubIndex(today: string) {
  if (index?.day === today) return index.byClub;
  const byClub = new Map<string, Map<string, string[]>>();
  for (const c of reviewed.careers) {
    if (!careerCanJudge(c, today)) continue;
    const players = byClub.get(c.club_id) ?? new Map<string, string[]>();
    players.set(c.player_id, [...(players.get(c.player_id) ?? []), c.verified_source_url]);
    byClub.set(c.club_id, players);
  }
  index = { day: today, byClub };
  return byClub;
}
const clubByName = new Map(reviewed.clubs.map(c => [c.name, c]));
const playerById = new Map(cachePlayers.map(p => [p.id, p]));

function sharedCount(a: string, b: string, today: string) {
  const idx = clubIndex(today);
  const A = idx.get(clubByName.get(a)?.id ?? ""), B = idx.get(clubByName.get(b)?.id ?? "");
  if (!A || !B || a === b) return 0;
  let n = 0; for (const id of A.keys()) if (B.has(id)) n++;
  return n;
}

export function catalogSuggestions(a: string, b: string, today: string): Array<Omit<Verdict, "correct">> {
  const clubA = clubByName.get(normalizeTeamName(a));
  const clubB = clubByName.get(normalizeTeamName(b));
  if (!clubA || !clubB || clubA.id === clubB.id) return [];
  const idx = clubIndex(today);
  const A = idx.get(clubA.id), B = idx.get(clubB.id);
  if (!A || !B) return [];
  const out: Array<Omit<Verdict, "correct">> = [];
  for (const [id, srcA] of A) {
    const srcB = B.get(id); const player = playerById.get(id);
    if (!srcB || !player) continue;
    out.push({ player: player.name, explanation: `${player.name}, ${clubA.name} ve ${clubB.name} A takımlarında resmi lig maçlarına çıktı. Kariyer yılı ve maç sayısı iki açık veri kaynağında karşılaştırıldı.`, sources: [...new Set([...srcA, ...srcB])] });
  }
  return out;
}

export function supportedClub(team: string) {
  const name = normalizeTeamName(team);
  const club = clubByName.get(name); return !!club && clubIndex(today()).has(club.id);
}

export function chooseSupportedPair(difficulty: "easy" | "medium" | "hard", used: string[], random = Math.random): [string,string] | null {
  const names = reviewed.clubs.map(c => c.name).filter(n => !used.some(u => normalizeTeamName(u) === n));
  const pairs: [string,string][] = [];
  for (let i=0;i<names.length;i++) for (let j=i+1;j<names.length;j++) {
    const a=names[i], b=names[j];
    if(a && b && sharedCount(a,b,today()) > 0) pairs.push([a,b]);
  }
  pairs.sort((a,b) => sharedCount(b[0],b[1],today()) - sharedCount(a[0],a[1],today()));
  const third = Math.max(1,Math.ceil(pairs.length/3));
  const offset = difficulty === "easy" ? 0 : difficulty === "medium" ? third : third*2;
  const pool = pairs.slice(offset,offset+third);
  const choices = pool.length ? pool : pairs;
  return choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))] ?? null;
}

/** Resolve a typed name, preferring this pair's eligible players ("krause" -> Kruse when Kruse fits the pair). */
function pairHit(a: string, b: string, answer: string) {
  const all = catalogSuggestions(a, b, today());
  const pool = cachePlayers.filter(p => all.some(v => v.player === p.name));
  const id = resolveCatalogPlayer(answer, pool, playerWeight) ?? resolveCatalogPlayer(answer, cachePlayers, playerWeight);
  const name = cachePlayers.find(p => p.id === id)?.name;
  return { all, hit: name ? all.find(v => v.player === name) : undefined };
}

export async function judgeWithCatalog(db: SupabaseClient<Database>, a: string, b: string, answer: string): Promise<Verdict> {
  const local = pairHit(a, b, answer).hit;
  if(local) return {...local,correct:true};
  const {data,error} = await db.from("football_verdict_cache").select("player, explanation, sources").eq("pair_key",pairKey(a,b)).eq("player_key",playerNameKey(answer)).maybeSingle();
  if(error) throw new Error("Kayıtlar şu anda okunamadı; cevabın yanlış sayılmadı.");
  if(data) {
    const parsed=verdictSchema.safeParse({...data,correct:true});
    if(parsed.success && parsed.data.sources.length && parsed.data.sources.every(s=>s.startsWith("https://"))) return parsed.data;
  }
  const apiCandidate = await findExternalCareerCandidate(db, a, b, answer);
  if (apiCandidate) {
    throw new Error("Ücretsiz futbol API'sinde bu oyuncu için iki takım da aday olarak bulundu. Kayıt doğrulama havuzuna eklendi; henüz doğrulanmadığı için yanlış sayılmadı.");
  }
  const why = careerExplanation(a, b, answer);
  if (why) throw new Error(`${why} Yanlış sayılmadı; başka bir futbolcu deneyebilir veya pas diyebilirsin.`);
  throw new Error("Bu cevap mevcut kayıtlardan doğrulanamadı; yanlış sayılmadı. Başka bir futbolcu adı deneyebilir veya pas diyebilirsin.");
}type WDClaim = { mainsnak?: { datavalue?: { value?: { id?: string } } }; qualifiers?: Record<string, Array<{ datavalue?: { value?: { time?: string } } }>> };
/** Verify a missing answer with dated Wikidata claims and AI, then cache sourced positives. */
export async function judgeWithFallback(db: SupabaseClient<Database>, a: string, b: string, answer: string): Promise<Verdict> {
  try { return await judgeWithCatalog(db, a, b, answer); }
  catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Kayıtlar şu anda okunamadı")) throw error;
    try {
      const search = async (name: string, kind: "player" | "club") => {
        const url = new URL("https://www.wikidata.org/w/api.php");
        url.search = new URLSearchParams({ action: "wbsearchentities", search: name, language: "en", format: "json", limit: "6" }).toString();
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!response.ok) return [] as Array<{ id: string; label: string; description?: string }>;
        const data = await response.json() as { search?: Array<{ id: string; label: string; description?: string }> };
        return (data.search ?? []).filter(x => normalizeTeamName(x.label) === normalizeTeamName(name) && (kind === "player" ? /footballer|football player|soccer player/i.test(x.description ?? "") : /football club|soccer club/i.test(x.description ?? "")));
      };
      const [players, clubsA, clubsB] = await Promise.all([search(answer, "player"), search(a, "club"), search(b, "club")]);
      if (players.length && clubsA.length && clubsB.length) {
        const url = new URL("https://www.wikidata.org/w/api.php");
        url.search = new URLSearchParams({ action: "wbgetentities", ids: [...new Set([...players, ...clubsA, ...clubsB].map(x => x.id))].join("|"), props: "labels|claims", languages: "en", format: "json" }).toString();
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        const data = response.ok ? await response.json() as { entities?: Record<string, { labels?: Record<string, { value: string }>; claims?: Record<string, WDClaim[]> }> } : {};
        const entities = data.entities ?? {};
        const year = (claim: WDClaim, key: string) => { const time = claim.qualifiers?.[key]?.map(q => q.datavalue?.value?.time).find(Boolean); return time ? Number(time.slice(1, 5)) : 0; };
        for (const player of players) {
          const claims = entities[player.id]?.claims?.P54 ?? [];
          const dates = [new Set(clubsA.map(c => c.id)), new Set(clubsB.map(c => c.id))].map(ids => claims.find(c => { const start = year(c, "P580"), end = year(c, "P582"); return ids.has(c.mainsnak?.datavalue?.value?.id ?? "") && start > 0 && start <= new Date().getUTCFullYear() && (end || 9999) >= 1985; }));
          if (dates.some(x => !x)) continue;
          const evidence = dates.map((c, i) => { const id = c?.mainsnak?.datavalue?.value?.id ?? ""; return player.label + " — " + (entities[id]?.labels?.en?.value ?? (i ? b : a)) + " (" + (year(c!, "P580") || "unknown") + "–" + (year(c!, "P582") || "present") + ")"; });
          const { env } = await import("cloudflare:workers");
          if (!env.AI) break;
          const output = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", { temperature: 0, max_tokens: 80, messages: [{ role: "system", content: "Review only the supplied dated Wikidata P54 club-membership statements. Return JSON only with verdict supported or unknown. Supported only if the named player has a dated statement for both requested clubs overlapping 1985 to present." }, { role: "user", content: JSON.stringify({ player: player.label, clubs: [a, b], evidence }) }] });
          const raw = typeof output === "object" && output && "response" in output ? String((output as { response: unknown }).response) : "";
          let verdict = "unknown"; try { verdict = JSON.parse(raw).verdict; } catch { /* malformed AI output stays unverified */ }
          if (verdict !== "supported") continue;
          const sources = [player.id, ...dates.map(c => c?.mainsnak?.datavalue?.value?.id ?? "")].filter(Boolean).map(id => "https://www.wikidata.org/wiki/" + id);
          const result = { correct: true, player: player.label, explanation: player.label + ", tarihli Wikidata takım kayıtları ve AI kontrolüyle " + a + " ve " + b + " takımlarında oynadığı doğrulandı.", sources };
          await db.from("football_verdict_cache").upsert({ pair_key: pairKey(a, b), player_key: playerNameKey(answer), player: result.player, explanation: result.explanation, sources, checked_at: new Date().toISOString() }, { onConflict: "pair_key,player_key" });
          return result;
        }
      }
    } catch (fallbackError) { console.warn("AI/source fallback could not verify answer", fallbackError); }
    return { correct: false, verification: "unverified", player: answer, sources: [], explanation: message || "Cevap kaynaklarda bulunamadı; yanlış sayılmadı." };
  }
}



export async function suggestionsWithCatalog(db: SupabaseClient<Database>, a: string, b: string) {
  const local = catalogSuggestions(a, b, new Date().toISOString().slice(0, 10));
  const { data } = await db.from("football_verdict_cache").select("player, explanation, sources").eq("pair_key", pairKey(a, b)).limit(20);
  const seen = new Set(local.map(v => playerNameKey(v.player)));
  for (const row of data ?? []) {
    if (seen.has(playerNameKey(row.player)) || !row.sources.length || !row.sources.every(s => s.startsWith("https://"))) continue;
    seen.add(playerNameKey(row.player)); local.push(row);
  }
  return local.slice(0, 3);
}

/** Explains which of the two clubs a recognised player is recorded at. */
export function careerExplanation(a: string, b: string, answer: string): string | null {
  const id = resolveCatalogPlayer(answer, cachePlayers, playerWeight);
  const name = id ? playerById.get(id)?.name : undefined;
  if (!id || !name) return null;
  const idx = clubIndex(today());
  const names = [normalizeTeamName(a), normalizeTeamName(b)];
  const has = names.map(n => !!idx.get(clubByName.get(n)?.id ?? "")?.has(id));
  const yes = names.filter((_, i) => has[i]), no = names.filter((_, i) => !has[i]);
  if (!yes.length) return `${name} kayıtlarımızda ${names.join(" ve ")} takımlarında oynamış görünmüyor.`;
  return `${name} ${yes.join(" ve ")} takımında oynadı, ancak kayıtlarımızda ${no.join(" ve ")} takımında oynadığı görünmüyor.`;
}

/** Random opponent that shares at least one verified player with the chosen club. */
export function trainingOpponent(team: string, previous?: string, random = Math.random): { club: string; opponent: string } | null {
  const club = normalizeTeamName(team);
  const options = reviewed.clubs.map(c => c.name)
    .filter(n => n !== club && sharedCount(club, n, today()) > 0);
  const fresh = options.filter(n => n !== previous);
  const pool = fresh.length ? fresh : options;
  if (!pool.length) return null;
  return { club, opponent: pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]! };
}

/** Catalogue-only practice judgement; unknown answers are never called wrong. */
export function trainingVerdict(a: string, b: string, answer: string) {
  const { all, hit } = pairHit(a, b, answer);
  return hit
    ? { status: "correct" as const, player: hit.player, explanation: hit.explanation, suggestions: all.filter(v => v !== hit).slice(0, 3).map(v => v.player) }
    : { status: "unverified" as const, player: answer, explanation: careerExplanation(a, b, answer) ?? "Bu cevap kayıtlarımızda doğrulanamadı; yanlış sayılmadı.", suggestions: all.slice(0, 3).map(v => v.player) };
}

/** Clubs that have at least one training opponent. */
export function trainingClubs() {
  return reviewed.clubs.map(c => c.name).filter(n => trainingOpponent(n) !== null);
}
