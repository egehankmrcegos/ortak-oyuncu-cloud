"""Corroborate Wikidata senior careers against DBpedia career stations.
Run outside the game; no AI and no database credentials. Ambiguous/missing
evidence stays pending. Source responses are retained in the output audit.
"""
import concurrent.futures
import datetime
import json
import pathlib
import urllib.parse
import requests

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/football/wikidata-pilot.json"
OUTPUT = ROOT / "data/football/verified-catalog.json"
ONTOLOGY = "http://dbpedia.org/ontology/"
CLUBS = {
    "Galatasaray_S.K._(football)": "Q495299", "Beşiktaş_J.K.": "Q172567",
    "Manchester_United_F.C.": "Q18656", "Chelsea_F.C.": "Q9616",
    "Real_Madrid_CF": "Q8682", "FC_Barcelona": "Q7156",
    "FC_Bayern_Munich": "Q15789", "Borussia_Dortmund": "Q41420",
    "Paris_Saint-Germain_F.C.": "Q483020", "Paris_Saint-Germain_FC": "Q483020",
    "Olympique_de_Marseille": "Q132885", "AFC_Ajax": "Q81888",
    "S.L._Benfica": "Q131499", "FC_Porto": "Q128446",
}

def query(ids):
    values = " ".join(f"<http://www.wikidata.org/entity/{i}>" for i in ids)
    sql = f"""SELECT ?p ?w ?s ?team ?year ?caps WHERE {{
      VALUES ?w {{ {values} }}
      ?p <http://www.w3.org/2002/07/owl#sameAs> ?w; <{ONTOLOGY}careerStation> ?s.
      ?s <{ONTOLOGY}team> ?team; <{ONTOLOGY}years> ?year;
         <{ONTOLOGY}numberOfMatches> ?caps.
    }}"""
    r = requests.get("https://dbpedia.org/sparql", params={"query": sql, "format": "application/sparql-results+json"}, timeout=90)
    r.raise_for_status()
    return r.json()["results"]["bindings"]

def main():
    catalog = json.loads(SOURCE.read_text())
    ids = [p["id"] for p in catalog["players"]]
    batches = [ids[i:i + 60] for i in range(0, len(ids), 60)]
    rows, failures = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(query, batch): batch for batch in batches}
        for future in concurrent.futures.as_completed(futures):
            try:
                rows.extend(future.result())
            except Exception as error:
                failures.append({"ids": futures[future], "error": type(error).__name__})
    evidence = {}
    for row in rows:
        player = row["w"]["value"].rsplit("/", 1)[-1]
        club = CLUBS.get(urllib.parse.unquote(row["team"]["value"].rsplit("/", 1)[-1]))
        year, caps = row["year"]["value"], row["caps"]["value"]
        if not club or not year.isdigit() or not caps.isdigit():
            continue
        # Start >=1985 proves the positive league appearances cannot predate 1985.
        if int(year) < 1985 or int(year) > datetime.date.today().year or int(caps) <= 0:
            continue
        evidence.setdefault((player, club, year), []).append(row)
    verified = []
    for career in catalog["careers"]:
        start = career.get("start_date")
        if not start:
            continue
        matches = evidence.get((career["player_id"], career["club_id"], start[:4]), [])
        # Independent extraction must agree on the exact positive league count.
        matches = [m for m in matches if int(m["caps"]["value"]) == career.get("reported_appearances")]
        stations = {m["s"]["value"] for m in matches}
        if len(stations) != 1:
            continue
        row = matches[0]
        verified.append({**career, "review_status": "verified", "verified_source_url": row["s"]["value"].replace("http:", "https:"), "evidence": row})
    output = {
        "review_method": "Exact senior-club identity, start year >=1985 and positive league appearance count corroborated by DBpedia career station; not a manual review or full coverage.",
        "license": "CC-BY-SA-3.0 (DBpedia); CC0-1.0 (Wikidata)",
        "attribution": "DBpedia contributors and Wikipedia contributors; derived from DBpedia structured career stations and Wikidata.",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "retrieved_date": datetime.date.today().isoformat(),
        "clubs": catalog["clubs"], "players": catalog["players"],
        "careers": verified, "failures": failures,
        "pending_careers": len(catalog["careers"]) - len(verified),
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"verified": len(verified), "pending": output["pending_careers"], "failed_batches": len(failures)}))

if __name__ == "__main__":
    main()