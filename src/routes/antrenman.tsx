import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameShell, ClubMark } from "@/components/game-shell";
import { startTraining, checkTraining } from "@/lib/training.functions";
import { supportedTeams } from "@/lib/supported-teams";

export const Route = createFileRoute("/antrenman")({
  head: () => ({
    meta: [
      { title: "Antrenman — O mu Bu mu? Futbol" },
      { name: "description", content: "Tek başına pratik yap: takımını seç, rastgele rakip takımla ortak futbolcuyu bul." },
      { property: "og:title", content: "Antrenman — O mu Bu mu?" },
      { property: "og:description", content: "Takımını seç, karşına rastgele bir takım gelsin, ortak futbolcuyu bul." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Training,
});

type Result = { status: "correct" | "unverified"; player: string; explanation: string; suggestions: string[] };

function Training() {
  const start = useServerFn(startTraining);
  const check = useServerFn(checkTraining);
  const [club, setClub] = useState("");
  const [pair, setPair] = useState<{ club: string; opponent: string } | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);

  async function draw(chosen: string, previous?: string) {
    setBusy(true);
    try { setPair(await start({ data: { club: chosen, previous } })); setResult(null); setAnswer(""); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (!pair || answer.trim().length < 2) return;
    setBusy(true);
    try {
      const r = await check({ data: { club: pair.club, opponent: pair.opponent, answer } });
      setResult(r);
      if (r.status === "correct") setScore(s => s + 1);
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <GameShell>
      <div className="training-panel glass-panel">
        <h1 className="training-heading">ANTRENMAN</h1>
        <p className="training-result">Tek başına pratik. Puan kaydedilmez. Doğru: {score}</p>
        {!pair ? (
          <>
            <label className="field-caption" htmlFor="training-club">TAKIMINI SEÇ</label>
            <Input id="training-club" list="training-teams" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="go" value={club} onChange={e => setClub(e.target.value)} maxLength={40} placeholder="Örn. Barcelona" className="game-input" onKeyDown={e => { if (e.key === "Enter" && club.trim()) void draw(club); }} />
            <datalist id="training-teams">{supportedTeams.map(t => <option key={t} value={t} />)}</datalist>
            <Button disabled={busy || club.trim().length < 2} className="main-action" onClick={() => draw(club)}>Rakip takımı getir</Button>
          </>
        ) : (
          <>
            <div className="training-pair"><ClubMark team={pair.club} /><span>{pair.club}</span><span>×</span><span>{pair.opponent}</span><ClubMark team={pair.opponent} /></div>
            {!result ? (
              <>
                <Input aria-label="Futbolcu adı" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="send" value={answer} onChange={e => setAnswer(e.target.value)} maxLength={60} placeholder="İki takımda da oynayan futbolcu" className="game-input" onKeyDown={e => { if (e.key === "Enter") void submit(); }} />
                <Button disabled={busy || answer.trim().length < 2} className="main-action" onClick={submit}>Cevapla</Button>
              </>
            ) : (
              <div className="training-result" role="status">
                <p><strong>{result.status === "correct" ? `Doğru: ${result.player}` : "Doğrulanamadı"}</strong></p>
                <p>{result.explanation}</p>
                {result.suggestions.length > 0 && <p>Diğer cevaplar: {result.suggestions.join(", ")}</p>}
              </div>
            )}
            <Button variant="secondary" disabled={busy} onClick={() => draw(pair.club, pair.opponent)}>{result ? "Yeni rakip" : "Pas, yeni rakip"}</Button>
            <Button variant="ghost" disabled={busy} onClick={() => { setPair(null); setResult(null); }}>Takımı değiştir</Button>
          </>
        )}
        <Link to="/" className="training-link">Ana sayfaya dön</Link>
      </div>
    </GameShell>
  );
}
