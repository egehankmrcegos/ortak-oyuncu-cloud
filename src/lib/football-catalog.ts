export type CatalogCareer = {
  player_id: string;
  club_id: string;
  start_date: string | null;
  end_date: string | null;
  reported_appearances: number | null;
  review_status: string;
  verified_source_url?: string | null;
};

// Membership alone cannot prove an official first-team appearance.
export function careerCanJudge(career: CatalogCareer, today: string): boolean {
  if (career.review_status !== "verified" || !career.verified_source_url?.startsWith("https://")) return false;
  if (!career.start_date || career.start_date > today) return false;
  if (career.end_date && career.end_date < "1985-01-01") return false;
  return career.reported_appearances !== null && career.reported_appearances > 0;
}

export function sharedCatalogPlayers(careers: CatalogCareer[], clubA: string, clubB: string, today: string): string[] {
  if (clubA === clubB) return [];
  const eligible = careers.filter(career => careerCanJudge(career, today));
  const a = new Set(eligible.filter(career => career.club_id === clubA).map(career => career.player_id));
  return [...new Set(eligible.filter(career => career.club_id === clubB && a.has(career.player_id)).map(career => career.player_id))];
}

export function playerNameKey(value: string): string {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i").replace(/[^a-z0-9 ]/g, " ").trim().replace(/\s+/g, " ");
}

// Resolve globally, not only among shared players: a common surname must not
// select whichever player happens to have the required career.
// When a surname is shared, a player with at least 3x the league matches of every
// other candidate is the obvious pick ("Messi" -> Lionel Messi); otherwise stay ambiguous.
function dominant(ids: string[], weight?: (id: string) => number): string | null {
  if (ids.length === 1) return ids[0] ?? null;
  if (!weight || !ids.length) return null;
  const ranked = ids.map(id => [id, weight(id)] as const).sort((a, b) => b[1] - a[1]);
  const [top, next] = ranked;
  return top && next && top[1] >= 3 * Math.max(1, next[1]) ? top[0] : null;
}

export function resolveCatalogPlayer(value: string, players: Array<{ id: string; name: string; aliases?: string[] }>, weight?: (id: string) => number): string | null {
  const input = playerNameKey(value);
  if (input.length < 3) return null;
  const exact = players.filter(p => [p.name, ...(p.aliases ?? [])].some(n => playerNameKey(n) === input));
  if (exact.length) return exact.length === 1 ? exact[0]?.id ?? null : null; // full names are never re-ranked
  if (input.includes(" ")) return null;
  const short = players.filter(p => [p.name, ...(p.aliases ?? [])].some(n => playerNameKey(n).split(" ").includes(input)));
  if (short.length) return dominant(short.map(p => p.id), weight);
  // Small typos in a distinctive surname ("batsuai" -> Batshuayi); only a unique match counts.
  if (input.length < 5) return null;
  const limit = input.length >= 7 ? 2 : 1;
  const near = players.filter(p => [p.name, ...(p.aliases ?? [])].some(n => playerNameKey(n).split(" ")
    .some(t => t.length >= 5 && Math.abs(t.length - input.length) <= limit && typoDistance(t, input) <= limit)));
  return dominant(near.map(p => p.id), weight);
}

function typoDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    const row = d[i]!, prev = d[i - 1]!;
    let v = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
    row[j] = v;
  }
  return d[a.length]![b.length]!;
}