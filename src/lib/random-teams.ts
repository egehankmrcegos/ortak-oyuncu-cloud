import { sameTeam } from "./team-names";

export type TeamMode = "manual" | "random";
export type Difficulty = "easy" | "medium" | "hard";
export const difficultyLabels: Record<Difficulty, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };

// Difficulty reflects club familiarity, not a guarantee about the number of shared players.
export const randomPools: Record<Difficulty, readonly string[]> = {
  easy: ["Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Real Madrid", "Barcelona", "Manchester United", "Manchester City", "Liverpool", "Arsenal", "Chelsea", "Tottenham", "Bayern Münih", "Borussia Dortmund", "Paris Saint-Germain", "Juventus", "Inter", "AC Milan", "Ajax", "Porto", "Benfica", "Roma", "Napoli", "Atlético Madrid"],
  medium: ["Sevilla", "Valencia", "Villarreal", "Real Betis", "Real Sociedad", "Athletic Bilbao", "Lyon", "Marsilya", "Monaco", "Lille", "Bayer Leverkusen", "Schalke", "Wolfsburg", "Stuttgart", "Werder Bremen", "Everton", "Newcastle United", "Aston Villa", "West Ham United", "Feyenoord", "PSV", "Sporting CP", "Braga", "Fiorentina", "Atalanta", "Lazio", "Başakşehir", "Bursaspor"],
  hard: ["Twente", "Utrecht", "Heerenveen", "Groningen", "Vitesse", "AZ Alkmaar", "NEC", "Heracles", "Boavista", "Rio Ave", "Gil Vicente", "Famalicão", "Arouca", "Estoril", "Moreirense", "Osasuna", "Getafe", "Celta", "Espanyol", "Alavés", "Auxerre", "Reims", "Lorient", "Nantes", "Mainz", "Augsburg", "Freiburg", "Kasımpaşa", "Konyaspor", "Rizespor"],
};

export function chooseRandomTeams(difficulty: Difficulty, used: string[], random: () => number = Math.random): [string, string] | null {
  const available = randomPools[difficulty].filter(team => !used.some(name => sameTeam(name, team)));
  if (available.length < 2) return null;
  const take = () => available.splice(Math.min(available.length - 1, Math.max(0, Math.floor(random() * available.length))), 1)[0];
  const a = take();
  const b = take();
  return a && b ? [a, b] : null;
}