import { readFile } from "node:fs/promises";
import { careerCanJudge, sharedCatalogPlayers, type CatalogCareer } from "../src/lib/football-catalog";

const path = process.argv[2] ?? "data/football/wikidata-pilot.json";
const catalog = JSON.parse(await readFile(path, "utf8")) as {
  clubs: Array<{ id: string; name: string; country_code: string }>;
  players: Array<{ id: string; name: string }>;
  careers: CatalogCareer[];
};
const today = new Date().toISOString().slice(0, 10);
const players = new Set(catalog.players.map(player => player.id));
const clubs = new Set(catalog.clubs.map(club => club.id));
if (catalog.careers.some(career => !players.has(career.player_id) || !clubs.has(career.club_id))) {
  throw new Error("Catalogue contains an unknown player or club reference");
}
let pairs = 0;
for (const [index, a] of catalog.clubs.entries()) {
  for (const b of catalog.clubs.slice(index + 1)) {
    if (sharedCatalogPlayers(catalog.careers, a.id, b.id, today).length) pairs++;
  }
}
console.log(JSON.stringify({
  clubs: catalog.clubs.length, countries: new Set(catalog.clubs.map(club => club.country_code)).size,
  players: players.size, careers: catalog.careers.length,
  verifiedCareers: catalog.careers.filter(career => careerCanJudge(career, today)).length,
  verifiedPairs: pairs, readyToReplaceReferee: false,
}, null, 2));