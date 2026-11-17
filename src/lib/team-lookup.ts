import { isKnownClub } from "./team-names";
export async function lookupClub(team: string) { return { exists: isKnownClub(team), sources: [] as string[] }; }
