import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoom, joinRoom } from "@/lib/game.functions";
import { saveIdentity } from "@/lib/identity";
import { parseRoomCode } from "@/lib/room-code";
import { GameShell } from "@/components/game-shell";
import { TeamModePicker } from "@/components/team-mode-picker";
import type { TeamMode, Difficulty } from "@/lib/random-teams";
import { ArrowUpRight, LogIn, UserRound } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "O mu Bu mu? Futbol — Arkadaşlarınla oyna" },
      { name: "description", content: "Herkes bir takım tutar, iki takımda da oynamış futbolcuyu ilk bulan kazanır." },
      { property: "og:title", content: "O mu Bu mu? Futbol" },
      { property: "og:description", content: "İki takımda oynamış futbolcuyu ilk bulan kazanır. Telefonundan arkadaşlarınla oyna." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const create = useServerFn(createRoom);
  const join = useServerFn(joinRoom);
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [target, setTarget] = useState<3 | 5>(3);
  const [mode, setMode] = useState<TeamMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [roundSeconds, setRoundSeconds] = useState(0);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<{ code: string; playerId: string; token: string }>) {
    if (!nickname.trim()) { toast.error("Önce bir takma ad yaz"); return; }
    setBusy(true);
    try {
      const r = await fn();
      saveIdentity(r.code, { playerId: r.playerId, token: r.token });
      navigate({ to: "/oda/$code", params: { code: r.code } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <GameShell className="home-screen">
      <header className="home-heading">
        <h1 className="poster-heading"><span>O MU</span><span>BU MU?</span></h1>
        <p className="poster-tagline">İki takım. Tek oyuncu.</p>
      </header>
      <div className="home-form glass-panel">
        <label className="field-caption" htmlFor="nickname"><UserRound size={14} />OYUNCU ADI</label>
        <Input id="nickname" aria-label="Takma adın" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="done" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} placeholder="Takma adın" className="game-input" />
        <div className="target-row">
          <span>Galibiyet hedefi</span>
          <div className="target-switch" role="group" aria-label="Hedef puan">
          {([3, 5] as const).map((n) => (
            <Button key={n} variant="ghost" aria-pressed={target === n} className={`target-option ${target === n ? "selected" : ""}`} onClick={() => setTarget(n)}>
              {n}
            </Button>
          ))}
          </div>
        </div>
        <TeamModePicker mode={mode} difficulty={difficulty} onMode={setMode} onDifficulty={setDifficulty} roundSeconds={roundSeconds} onRoundSeconds={setRoundSeconds} disabled={busy} />
      </div>
      <Button disabled={busy || mode === null} className="main-action" onClick={() => mode && run(() => create({ data: { nickname, target, mode, difficulty, roundSeconds } }))}>{busy ? "Bekleniyor…" : "Oda kur"}<ArrowUpRight /></Button>
      <section className="invite-panel" aria-label="Davet koduyla odaya katıl">
        <div className="join-divider"><span>DAVET KODUN VAR MI?</span></div>
        <div className="join-row">
          <Input aria-label="Oda kodu" autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} enterKeyHint="done" value={code} onChange={(e) => setCode(parseRoomCode(e.target.value) ?? e.target.value.toUpperCase())} maxLength={2048} placeholder="Oda kodu · ABCDE" className="game-input" />
          <Button disabled={busy || !parseRoomCode(code)} variant="secondary" className="join-action" onClick={() => run(() => join({ data: { code, nickname } }))}><LogIn />Katıl</Button>
        </div>
      </section>
    </GameShell>
  );
}
