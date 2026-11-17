"""Build the judging catalogue for all supported clubs without AI.
Source A: DBpedia career stations (team, start year, league matches).
Source B: Wikidata P54 membership with start time (P580) and matches (P1350).
A career is verified only when both sources record the player at the same senior
club (Wikidata P54 membership) and DBpedia gives a start year >= 1985 with a
positive league match count. Exact cap equality was dropped: the sources update
caps at different times, which removed famous stints (e.g. Ibrahimovic at Ajax). Everything else is dropped (never treated as wrong).
"""
import concurrent.futures, datetime, hashlib, json, pathlib, sys, time, urllib.parse
import requests
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from football_clubs import CLUBS  # canonical game name -> English Wikipedia/DBpedia title
OUT = pathlib.Path("/tmp/reviewed-full.json")  # then compact into src/lib/data/football-catalog.json
AUDIT = ROOT / "data/football/build-audit.json"
UA = {"User-Agent": "OmuBumuCatalog/1.0 (egehankomurcu228@gmail.com)"}
DBO = "http://dbpedia.org/ontology/"
THIS_YEAR = datetime.date.today().year

def get(url, params, tries=4):
    for i in range(tries):
        try:
            r = requests.get(url, params=params, headers=UA, timeout=120)
            if r.status_code == 429: time.sleep(10 * (i + 1)); continue
            r.raise_for_status(); return r.json()["results"]["bindings"]
        except Exception:
            if i == tries - 1: raise
            time.sleep(5 * (i + 1))

def club_qid(title):
    # The English Wikipedia sitelink is authoritative; DBpedia sameAs can list several entities.
    r = requests.get("https://www.wikidata.org/w/api.php", params={"action": "wbgetentities", "sites": "enwiki", "titles": title.replace("_", " "), "redirects": "yes", "format": "json", "props": "info"}, headers=UA, timeout=60).json()
    ids = [k for k in r.get("entities", {}) if k.startswith("Q")]
    return ids[0] if ids else None

def dbpedia(title):
    club = f"<http://dbpedia.org/resource/{title}>"
    q = f"""SELECT DISTINCT ?w ?name ?year ?caps ?s WHERE {{
      {{ ?s <{DBO}team> {club} }} UNION {{ ?s <{DBO}team> ?r . ?r <{DBO}wikiPageRedirects> {club} }}
      ?p <{DBO}careerStation> ?s ; <http://www.w3.org/2002/07/owl#sameAs> ?w ; <http://www.w3.org/2000/01/rdf-schema#label> ?name .
      ?s <{DBO}years> ?year ; <{DBO}numberOfMatches> ?caps .
      FILTER(STRSTARTS(STR(?w), "http://www.wikidata.org/entity/Q")) FILTER(LANG(?name) = "en")
    }}"""
    return get("https://dbpedia.org/sparql", {"query": q, "format": "json"})

def wikidata(qid):
    q = f"""SELECT DISTINCT ?p WHERE {{ ?p wdt:P54 wd:{qid} . }}"""
    return get("https://query.wikidata.org/sparql", {"query": q, "format": "json"})

def build(name, title):
    qid = club_qid(title)
    if not qid: return name, None, [], "no wikidata id"
    a = dbpedia(title); time.sleep(1); b = wikidata(qid)
    wd = {row["p"]["value"].rsplit("/", 1)[1] for row in b}
    careers, players = [], {}
    for row in a:
        pid = row["w"]["value"].rsplit("/", 1)[1]
        year, caps = row["year"]["value"][:4], row["caps"]["value"]
        if not year.isdigit() or not caps.isdigit(): continue
        if not (1985 <= int(year) <= THIS_YEAR) or int(caps) <= 0: continue
        if pid not in wd: continue
        players[pid] = row["name"]["value"]
        careers.append({"player_id": pid, "club_id": qid, "start_date": f"{year}-01-01", "end_date": None,
            "reported_appearances": int(caps), "review_status": "verified",
            "verified_source_url": "https://dbpedia.org/resource/" + urllib.parse.quote(row["s"]["value"].rsplit("/", 1)[1])})
    return name, qid, careers, players

def main():
    clubs, careers, players, audit = [], {}, {}, {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for fut in concurrent.futures.as_completed([pool.submit(build, n, t) for n, t in CLUBS.items()]):
            try: name, qid, rows, extra = fut.result()
            except Exception as e: audit[str(e)[:80]] = "error"; continue
            if not qid: audit[name] = extra; continue
            clubs.append({"id": qid, "name": name, "source_url": f"https://www.wikidata.org/wiki/{qid}"})
            players.update(extra)
            for c in rows:
                c["id"] = hashlib.md5(f"{c['player_id']}|{qid}|{c['start_date']}|{c['reported_appearances']}".encode()).hexdigest()
                careers[c["id"]] = c
            audit[name] = len(rows); print(name, len(rows), flush=True)
    data = {"license": "Wikidata CC0-1.0; DBpedia CC BY-SA 3.0", "attribution": "Wikidata and DBpedia contributors",
            "clubs": sorted(clubs, key=lambda c: c["name"]),
            "players": [{"id": k, "name": v, "source_url": f"https://www.wikidata.org/wiki/{k}"} for k, v in sorted(players.items())],
            "careers": list(careers.values())}
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    AUDIT.write_text(json.dumps({"built": datetime.datetime.utcnow().isoformat() + "Z", "per_club": audit}, ensure_ascii=False, indent=1))
    compact = {"license": data["license"], "attribution": data["attribution"], "sourcePrefix": "https://dbpedia.org/resource/",
        "clubs": [[c["id"], c["name"]] for c in data["clubs"]],
        "players": [[p["id"], p["name"]] for p in data["players"]],
        "careers": [[c["player_id"], c["club_id"], int(c["start_date"][:4]), c["reported_appearances"], c["verified_source_url"].rsplit("/", 1)[1]] for c in data["careers"]]}
    if len(compact["careers"]) > 29000:  # never shrink the live catalogue on a partial fetch
        (ROOT / "src/lib/data/football-catalog.json").write_text(json.dumps(compact, ensure_ascii=False, separators=(",", ":")))
    print("clubs", len(clubs), "players", len(players), "careers", len(careers))

if __name__ == "__main__": main()
