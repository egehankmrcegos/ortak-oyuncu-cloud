const teams: Record<string, string[]> = {
  // Türkiye
  Galatasaray: ["gs", "gala", "cimbom"], Fenerbahçe: ["fb", "fener"], Beşiktaş: ["bjk"],
  Trabzonspor: ["ts", "trabzon"], Başakşehir: ["istanbul basaksehir", "basaksehir fk"], Samsunspor: ["samsun"], Göztepe: ["goz goz"],
  Kasımpaşa: [], Kayserispor: ["kayseri"], Konyaspor: ["konya"], Alanyaspor: ["alanya"], Antalyaspor: ["antalya"], Rizespor: ["caykur rizespor", "rize"],
  Gaziantep: ["gaziantep fk"], Eyüpspor: ["eyup"], Kocaelispor: ["kocaeli"], Gençlerbirliği: [], "Fatih Karagümrük": ["karagumruk"],
  Sivasspor: ["sivas"], Hatayspor: ["hatay"], "Adana Demirspor": ["adana demir"], Bursaspor: ["bursa"], Ankaragücü: ["ankaragucu"],
  Bodrumspor: ["bodrum"], Pendikspor: [], Giresunspor: ["giresun"], Altay: [], Denizlispor: ["denizli"], Malatyaspor: ["yeni malatyaspor"],
  // İngiltere
  "Manchester United": ["man united", "man utd", "manchester utd"], "Manchester City": ["man city"],
  Liverpool: [], Arsenal: [], Chelsea: [], Tottenham: ["tottenham hotspur", "spurs"],
  "Newcastle United": ["newcastle"], "Aston Villa": ["villa"], "West Ham United": ["west ham"],
  Everton: [], "Leicester City": ["leicester"], "Leeds United": ["leeds"], Southampton: [],
  "Crystal Palace": ["palace"], Brighton: ["brighton hove albion"], Fulham: [], Brentford: [],
  "Wolverhampton": ["wolves"], "Nottingham Forest": ["forest", "nottingham"], Bournemouth: [],
  Burnley: [], Sunderland: [], "Ipswich Town": ["ipswich"], Watford: [], "Norwich City": ["norwich"],
  // İspanya
  "Real Madrid": ["real", "madrid"], Barcelona: ["barca", "barselona", "fc barcelona"],
  "Atlético Madrid": ["atletico", "atletico de madrid"], Sevilla: [], "Real Betis": ["betis"],
  Valencia: [], Villarreal: [], "Real Sociedad": ["sociedad"], "Athletic Bilbao": ["athletic club", "bilbao"],
  Celta: ["celta vigo"], Getafe: [], Osasuna: [], Mallorca: [], Girona: [], "Rayo Vallecano": ["rayo"],
  Espanyol: [], Alavés: [], "Las Palmas": [], "Deportivo La Coruña": ["deportivo"], Málaga: [],
  // Almanya
  "Bayern Münih": ["bayern", "bayern munich", "bayern munchen"], "Borussia Dortmund": ["dortmund", "bvb"],
  "Bayer Leverkusen": ["leverkusen"], "RB Leipzig": ["leipzig"], Schalke: ["schalke 04"],
  "Borussia Mönchengladbach": ["gladbach", "monchengladbach"], "Eintracht Frankfurt": ["frankfurt"],
  Wolfsburg: [], Stuttgart: ["vfb stuttgart"], "Werder Bremen": ["bremen"], Hoffenheim: [],
  Freiburg: [], "Union Berlin": [], Hertha: ["hertha berlin"], Mainz: ["mainz 05"], Augsburg: [],
  Köln: ["fc koln", "koln", "cologne"], Hamburg: ["hamburger sv", "hsv"],
  // Fransa
  "Paris Saint-Germain": ["psg", "paris"], Marsilya: ["marseille", "olympique marseille", "om"],
  Lyon: ["olympique lyon", "olympique lyonnais"], Monaco: ["as monaco"], Lille: ["losc"],
  Nice: ["nis", "ogc nice"], Rennes: [], Lens: [], Nantes: [], Bordeaux: [], "Saint-Étienne": ["saint etienne"],
  Montpellier: [], Strasbourg: [], Toulouse: [], Reims: [], Brest: [], Lorient: [], Auxerre: [],
  // İtalya (önceden vardı)
  Juventus: ["juve"], Inter: ["inter milan", "internazionale"], "AC Milan": ["milan"], Napoli: [],
  Roma: ["as roma"], Lazio: [], Udinese: [], Atalanta: [], Fiorentina: [],
  // Hollanda
  Ajax: ["afc ajax", "ajak", "ayax", "ayaks", "ajaks", "aiax"], PSV: ["psv eindhoven", "eindhoven"], Feyenoord: [], "AZ Alkmaar": ["az", "alkmaar"],
  Twente: ["fc twente"], Utrecht: ["fc utrecht"], Vitesse: [], Heerenveen: [], Groningen: [],
  "Sparta Rotterdam": [], "Go Ahead Eagles": [], Heracles: [], NEC: ["nec nijmegen", "nijmegen"],
  // Portekiz
  Benfica: ["sl benfica"], Porto: ["fc porto"], "Sporting CP": ["sporting lizbon", "sporting lisbon", "sporting"],
  Braga: ["sc braga", "sporting braga"], "Vitória Guimarães": ["guimaraes", "vitoria"], "Rio Ave": [],
  Boavista: [], "Gil Vicente": [], Famalicão: [], Arouca: [], Estoril: [], Moreirense: [],
};

function key(value: string) {
  return value.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

// Optimal string alignment distance: swapped neighbouring letters count as one typo.
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const at = (x: number, y: number) => d[x]?.[y] ?? 0;
      let v = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, at(i - 2, j - 2) + 1);
      const row = d[i];
      if (row) row[j] = v;
    }
  }
  return d[a.length]?.[b.length] ?? a.length;
}

// Never guess a short, ambiguous or unfamiliar name.
export function normalizeTeamName(value: string): string {
  const input = key(value);
  const entries = Object.entries(teams).map(([name, aliases]) => ({
    name, keys: [name, ...aliases].map(key),
  }));
  const exact = entries.find((entry) => entry.keys.includes(input));
  if (exact) return exact.name;
  if (input.length < 5) return value.trim();
  // Only literal, sufficiently long prefixes qualify; never repair a partial name.
  const prefixes = entries.filter((entry) => entry.keys.some((alias) => alias.startsWith(input)));
  if (prefixes.length > 1) return value.trim();
  if (prefixes[0]) return prefixes[0].name;
  const limit = input.length >= 7 ? 2 : 1;
  const matches = entries.map((entry) => ({
    name: entry.name,
    distance: Math.min(...entry.keys.filter((alias) => alias.length >= 7)
      .map((alias) => distance(input, alias))),
  })).filter((entry) => entry.distance <= limit).sort((a, b) => a.distance - b.distance);
  const best = matches[0];
  return best && best.distance !== matches[1]?.distance ? best.name : value.trim();
}
export function sameTeam(a: string, b: string): boolean {
  return key(normalizeTeamName(a)) === key(normalizeTeamName(b));
}
export function isKnownClub(value: string): boolean {
  return Object.hasOwn(teams, normalizeTeamName(value));
}
