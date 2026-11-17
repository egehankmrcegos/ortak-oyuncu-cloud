import { parseDocument } from "htmlparser2";
import { findAll, textContent } from "domutils";
import type { Element } from "domhandler";
import type { AppearanceEvidence } from "./football-source-policy";

const BASE = "https://www.tff.org/";
const text = (node: Element) => textContent(node).replace(/\s+/g, " ").trim();
const elements = (html: string) => findAll(node => node.type === "tag", parseDocument(html).children);
const queryId = (href: string, key: string) => {
  const url = new URL(href, BASE);
  for (const [name, value] of url.searchParams) if (name.toLowerCase() === key.toLowerCase() && /^\d+$/.test(value)) return value;
  return null;
};

export type TffAppearance = AppearanceEvidence & { playerName: string; tffPlayerId: string; tffClubId: string };
export function parseTffMatch(html: string, matchId: string, today: string): TffAppearance[] {
  const nodes = elements(html);
  const tournament = nodes.find(n => n.attribs['id']?.endsWith("_lblOrganizasyonAdi"));
  // Explicitly restrict this adapter to men's senior top-flight league matches.
  if (!tournament || !text(tournament).includes("Süper Lig") || !text(tournament).includes("Profesyonel Takım")) return [];
  const date = nodes.find(n => n.attribs['id']?.endsWith("_lblTarih"));
  const parts = date ? /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(text(date)) : null;
  if (!parts) return [];
  const playedOn = `${parts[3]}-${parts[2]?.padStart(2,"0")}-${parts[1]?.padStart(2,"0")}`;
  if (playedOn < "1985-01-01" || playedOn > today) return [];
  const rows: TffAppearance[] = [];
  for (const side of [1, 2]) {
    const club = nodes.find(n => n.attribs['id']?.endsWith(`_lnkTakim${side}`));
    const clubId = club ? queryId(club.attribs['href'] ?? "", "kulupId") : null;
    if (!clubId) continue;
    for (const n of nodes) {
      const id = n.attribs['id'] ?? "";
      const starter = new RegExp(`_grdTakim${side}_rptKadrolar_ctl\\d+_lnkOyuncu$`).test(id);
      const entered = new RegExp(`_grdTakim${side}_rptGirenler_ctl\\d+_lblGiren$`).test(id);
      if (!starter && !entered) continue;
      const playerId = queryId(n.attribs['href'] ?? "", "kisiId");
      if (!playerId) continue;
      rows.push({ provider: "tff", playerId: `tff:${playerId}`, clubId: `tff:${clubId}`,
        tffPlayerId: playerId, tffClubId: clubId, playerName: text(n), matchId, playedOn,
        role: starter ? "starter" : "entered", sourceUrl: `${BASE}Default.aspx?pageId=29&macId=${matchId}`,
        identityVerified: false, usageApproved: false });
    }
  }
  return rows;
}

export function parseTffFixtures(html: string, today: string): string[] {
  const nodes = elements(html);
  const rows = nodes.filter(n => n.name === "tr" && n.attribs['class']?.split(" ").includes("haftaninMaclariTr"));
  const ids = new Set<string>();
  for (const row of rows) {
    const body = text(row);
    const parts = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(body);
    if (!parts || !/\b\d+\s*-\s*\d+\b/.test(body)) continue;
    const date = `${parts[3]}-${parts[2]?.padStart(2,"0")}-${parts[1]?.padStart(2,"0")}`;
    if (date > today || date < "1985-01-01") continue;
    for (const anchor of findAll(n => n.type === "tag" && n.name === "a", row.children)) {
      const id = queryId(anchor.attribs['href'] ?? "", "macId");
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

export async function fetchTff(path: string): Promise<string> {
  const url = new URL(path, BASE);
  if (url.origin !== new URL(BASE).origin) throw new Error("Unsupported football source");
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "OmuBumuCatalog/1.0" } });
  if (!response.ok) throw new Error(`TFF HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  const charset = /charset\s*=\s*["']?([\w-]+)/i.exec(response.headers.get("content-type") ?? "")?.[1] ?? "windows-1254";
  const html = new TextDecoder(charset).decode(bytes);
  if (!html.includes("tff") && !html.includes("TFF")) throw new Error("Unexpected TFF response");
  return html;
}