/** Broad domestic-league groups for the supported club picker. Older clubs stay
 * in their national league group even when they currently play below tier one. */
export const teamLeagues: Record<string, readonly string[]> = {
  "Süper Lig / Türkiye": ["Adana Demirspor", "Alanyaspor", "Altay", "Ankaragücü", "Antalyaspor", "Başakşehir", "Beşiktaş", "Bursaspor", "Denizlispor", "Eyüpspor", "Fatih Karagümrük", "Fenerbahçe", "Gaziantep", "Gençlerbirliği", "Giresunspor", "Göztepe", "Hatayspor", "Kasımpaşa", "Kayserispor", "Kocaelispor", "Konyaspor", "Malatyaspor", "Rizespor", "Samsunspor", "Sivasspor", "Trabzonspor"],
  "Premier League / İngiltere": ["Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton", "Burnley", "Chelsea", "Crystal Palace", "Everton", "Fulham", "Ipswich Town", "Leeds United", "Leicester City", "Liverpool", "Manchester City", "Manchester United", "Newcastle United", "Norwich City", "Nottingham Forest", "Southampton", "Sunderland", "Tottenham", "Watford", "West Ham United", "Wolverhampton"],
  "La Liga / İspanya": ["Alavés", "Athletic Bilbao", "Atlético Madrid", "Barcelona", "Celta", "Deportivo La Coruña", "Espanyol", "Getafe", "Girona", "Las Palmas", "Mallorca", "Málaga", "Osasuna", "Rayo Vallecano", "Real Betis", "Real Madrid", "Real Sociedad", "Sevilla", "Valencia", "Villarreal"],
  "Serie A / İtalya": ["AC Milan", "Atalanta", "Fiorentina", "Inter", "Juventus", "Lazio", "Napoli", "Roma", "Udinese"],
  "Bundesliga / Almanya": ["Augsburg", "Bayer Leverkusen", "Bayern Münih", "Borussia Dortmund", "Borussia Mönchengladbach", "Eintracht Frankfurt", "Freiburg", "Hamburg", "Hertha", "Hoffenheim", "Köln", "Mainz", "RB Leipzig", "Schalke", "Stuttgart", "Union Berlin", "Werder Bremen", "Wolfsburg"],
  "Ligue 1 / Fransa": ["Auxerre", "Bordeaux", "Brest", "Lens", "Lille", "Lorient", "Lyon", "Marsilya", "Monaco", "Montpellier", "Nantes", "Nice", "Paris Saint-Germain", "Reims", "Rennes", "Saint-Étienne", "Strasbourg", "Toulouse"],
  "Eredivisie / Hollanda": ["AZ Alkmaar", "Ajax", "Feyenoord", "Go Ahead Eagles", "Groningen", "Heerenveen", "Heracles", "NEC", "PSV", "Sparta Rotterdam", "Twente", "Utrecht", "Vitesse"],
  "Primeira Liga / Portekiz": ["Arouca", "Boavista", "Braga", "Estoril", "Famalicão", "Gil Vicente", "Moreirense", "Porto", "Rio Ave", "Sporting CP", "Vitória Guimarães"],
};

const leagueByTeam = new Map(Object.entries(teamLeagues).flatMap(([league, teams]) => teams.map(team => [team, league] as const)));
export const teamLeague = (team: string) => leagueByTeam.get(team) ?? "Diğer ligler";
