/** Offline, repeatable collection. Never import this Node/Bun script in the app. */
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { fetchTff, parseTffFixtures, parseTffMatch, type TffAppearance } from "../src/lib/football-tff.server";
import { mergeAppearanceEvidence } from "../src/lib/football-source-policy";

const args = process.argv.slice(2);
const weekArg = args.find(a => a.startsWith("--weeks="))?.split("=")[1] ?? "1-11";
const range = /^(\d+)-(\d+)$/.exec(weekArg);
if (!range) throw new Error("Use --weeks=1-11 (range 1-34)");
const first = Number(range[1]), last = Number(range[2]);
if (first < 1 || last > 34 || first > last) throw new Error("Invalid week range");
const output = "data/football/tff-staging.json";
const today = new Date().toISOString().slice(0, 10);
let previous: TffAppearance[] = [];
try { previous = JSON.parse(await readFile(output, "utf8")).appearances ?? []; }
catch (error) { if ((error as { code?: string }).code !== "ENOENT") throw error; }
const incoming: TffAppearance[] = [], failures: Array<{ target: string; error: string }> = [];
const pause = () => new Promise(resolve => setTimeout(resolve, 1200));
for (let week = first; week <= last; week++) {
  try {
    const ids = parseTffFixtures(await fetchTff(`Default.aspx?pageID=198&hafta=${week}`), today);
    for (const id of ids) {
      await pause();
      try { incoming.push(...parseTffMatch(await fetchTff(`Default.aspx?pageId=29&macId=${id}`), id, today)); }
      catch (error) { failures.push({ target: `match:${id}`, error: (error as Error).message }); }
    }
  } catch (error) { failures.push({ target: `week:${week}`, error: (error as Error).message }); }
  console.log(`week ${week}: ${incoming.length} appearance evidence rows; ${failures.length} failures`);
  await pause();
}
await mkdir("data/football", { recursive: true });
const appearances = mergeAppearanceEvidence(previous, incoming);
await writeFile(`${output}.tmp`, JSON.stringify({ fetchedAt: new Date().toISOString(),
  provider: "TFF", usage: "Rights not cleared; staging only, not judging input",
  scope: "Current men's Turkish top-flight, starters and players explicitly entering completed matches",
  appearances, failures }, null, 2));
await rename(`${output}.tmp`, output);
console.log(JSON.stringify({ previous: previous.length, collected: incoming.length, retained: appearances.length, failures: failures.length }));