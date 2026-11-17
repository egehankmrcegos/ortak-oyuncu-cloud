import { describe, it, expect } from "vitest";
import { evidenceCanPromote, mergeAppearanceEvidence, type AppearanceEvidence } from "@/lib/football-source-policy";
import { parseTffMatch, parseTffFixtures } from "@/lib/football-tff.server";

const row: AppearanceEvidence = { provider: "tff", playerId: "Q1", clubId: "Q2", matchId: "1", playedOn: "2026-11-01",
  role: "starter", sourceUrl: "https://www.tff.org/Default.aspx?macId=1", identityVerified: true, usageApproved: true };
describe("free football source safety", () => {
  it("never promotes unused bench players", () => expect(evidenceCanPromote({ ...row, role: "bench" }, "2026-11-15")).toBe(false));
  it("requires checked identity", () => expect(evidenceCanPromote({ ...row, identityVerified: false }, "2026-11-15")).toBe(false));
  it("requires data usage clearance, not merely an MIT code licence", () => expect(evidenceCanPromote({ ...row, usageApproved: false }, "2026-11-15")).toBe(false));
  it("excludes future matches", () => expect(evidenceCanPromote({ ...row, playedOn: "2026-11-16" }, "2026-11-15")).toBe(false));
  it("excludes appearances before 1985", () => expect(evidenceCanPromote({ ...row, playedOn: "1984-12-31" }, "2026-11-15")).toBe(false));
  it("retains previous evidence after an empty or failed update", () => expect(mergeAppearanceEvidence([row], [])).toEqual([row]));
  it("does not double count the same player appearance", () => expect(mergeAppearanceEvidence([row], [row])).toHaveLength(1));
  it("permits checked positive first-team appearances", () => expect(evidenceCanPromote(row, "2026-11-15")).toBe(true));
});
const html = `<span id="x_lblOrganizasyonAdi">Trendyol Süper Lig (Profesyonel Takım)</span><span id="x_lblTarih">1.11.2026 - 19:00</span>
<a id="x_lnkTakim1" href="Default.aspx?kulupId=3590">Beşiktaş</a>
<a id="x_grdTakim1_rptKadrolar_ctl01_lnkOyuncu" href="Default.aspx?kisiId=100">Starter</a>
<a id="x_grdTakim1_rptYedekler_ctl01_lnkOyuncu" href="Default.aspx?kisiId=101">Unused bench</a>
<a id="x_grdTakim1_rptGirenler_ctl01_lblGiren" href="Default.aspx?kisiId=102">Entered</a>`;
describe("TFF adapter", () => {
  it("extracts only starters and explicit substitutions with provenance", () => {
    const rows = parseTffMatch(html, "317866", "2026-11-15");
    expect(rows.map(r => r.tffPlayerId)).toEqual(["100", "102"]);
    expect(rows[0]?.sourceUrl).toBe("https://www.tff.org/Default.aspx?pageId=29&macId=317866");
    expect(rows.every(r => !r.identityVerified && !r.usageApproved)).toBe(true);
  });
  it("does not use youth matches", () => expect(parseTffMatch(html.replace("Süper Lig (Profesyonel Takım)", "U19 Gelişim Ligi"), "1", "2026-11-15")).toEqual([]));
  it("does not use future lineups", () => expect(parseTffMatch(html, "1", "2026-10-31")).toEqual([]));
  it("selects completed scored fixtures only", () => {
    const fixtures = `<tr class="haftaninMaclariTr"><td>1.11.2026 19:00 A 2 - 2 B <a href="Default.aspx?macId=1">Detay</a></td></tr>
      <tr class="haftaninMaclariTr"><td>21.11.2026 A - B <a href="Default.aspx?macId=2">Detay</a></td></tr>`;
    expect(parseTffFixtures(fixtures, "2026-11-15")).toEqual(["1"]);
  });
});