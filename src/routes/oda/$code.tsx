import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRoomState, joinRoom, passRound, skipRound, startRound, submitAnswer, submitPick, useManualTeams } from "@/lib/game.functions";
import { FINAL_ANSWER_SECONDS } from "@/lib/game-rules";
import { loadIdentity, saveIdentity, type Identity } from "@/lib/identity";
import { parseRoomCode, roomInviteUrl } from "@/lib/room-code";
import { shareInvitation } from "@/lib/native";
import { GameShell, ClubMark } from "@/components/game-shell";
import { TeamModePicker } from "@/components/team-mode-picker";
import { MatchHistory } from "@/components/match-history";
import { PlayerSafety } from "@/components/player-safety";
import { supportedTeams } from "@/lib/supported-teams";
import { sameTeam } from "@/lib/team-names";
import { teamLeague, teamLeagues } from "@/lib/team-leagues";
import { GameDetails } from "@/components/game-details";
import { difficultyLabels, type Difficulty, type TeamMode } from "@/lib/random-teams";
import { clubColors } from "@/lib/club-colors";
import type { SummaryRound } from "@/lib/match-summary";
import { ArrowLeft, Check, ChevronRight, Clock3, Crown, LockKeyhole, Share2, ShieldCheck, Trophy, Users, StepForward, Send } from "lucide-react";

export const Route = createFileRoute("/oda/$code")({
  beforeLoad: ({ params }) => {
    const code = parseRoomCode(params.code);
    if (code && code !== params.code) throw redirect({ to: "/oda/$code", params: { code }, replace: true });
  },
  head: ({ params }) => ({
    meta: [
      { title: `Oda ${parseRoomCode(params.code) ?? "davet"} — O mu Bu mu?` },
      { name: "description", content: "Futbol oyununa davet edildin. Katıl ve iki takımda oynamış futbolcuyu bul!" },
      { property: "og:title", content: `O mu Bu mu? — Oda ${parseRoomCode(params.code) ?? "davet"}` },
      { property: "og:description", content: "Futbol oyununa davet edildin, hemen katıl!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomPage,
});

type SuggestedAnswers = { answers: Array<{ player: string; explanation: string; sources: string[] }>; message: string | null };

type Room = { team_mode: TeamMode; difficulty: Difficulty; round_seconds: number; round_deadline: string | null; random_exhausted: boolean; id: string; code: string; host_player_id: string | null; status: string; target_score: number; round_no: number; chooser_a: string | null; chooser_b: string | null; team_a: string | null; team_b: string | null; round_winner_id: string | null; round_answer: string | null; winner_player_id: string | null; round_suggestions: SuggestedAnswers | null; final_deadline: string | null; final_players: string[] | null; pass_round: number | null; passed_players: string[] };
type Player = { id: string; nickname: string; score: number; created_at: string };
type Attempt = { id: string; round_no: number; nickname: string; answer: string; correct: boolean; explanation: string | null; created_at: string };

function RoomPage() {
  const { code } = Route.useParams();
  const [me, setMe] = useState<Identity | null | undefined>(undefined);
  useEffect(() => setMe(loadIdentity(code)), [code]);
  if (!parseRoomCode(code)) return <GameShell className="join-screen"><h1 className="screen-heading">Geçersiz davet</h1><p className="mb-5 text-muted-foreground">Davet bağlantısı geçersiz. Oda kodunu kontrol edip tekrar dene.</p><Button asChild className="main-action"><Link to="/">Ana sayfa</Link></Button></GameShell>;
  if (me === undefined) return null;
  if (!me) return <JoinGate code={code} onJoined={setMe} />;
  return <Game code={code} me={me} />;
}

function JoinGate({ code, onJoined }: { code: string; onJoined: (i: Identity) => void }) {
  const join = useServerFn(joinRoom);
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <GameShell className="join-screen">
      <h1 className="screen-heading">Lobi <span>{code}</span></h1>
      <p className="mb-5 text-muted-foreground">Oyuna katılmak için takma adını yaz.</p>
      <Input aria-label="Takma adın" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="done" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} placeholder="Takma adın" className="game-input mb-4" />
      <Button disabled={busy || !nickname.trim()} className="main-action" onClick={async () => {
        setBusy(true);
        try { const r = await join({ data: { code, nickname } }); const id = { playerId: r.playerId, token: r.token }; saveIdentity(code, id); onJoined(id); }
        catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
      }}>Katıl</Button>
    </GameShell>
  );
}

function Game({ code, me }: { code: string; me: Identity }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [history, setHistory] = useState<SummaryRound[]>([]);
  const [missing, setMissing] = useState(false);
  const [answerAllowed, setAnswerAllowed] = useState(false);
  const [picked, setPicked] = useState(false);
  const [usedTeams, setUsedTeams] = useState<string[]>([]);
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(0);

  const getState = useServerFn(getRoomState);
  const inFlight = useRef(false);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const st = await getState({ data: { code, playerId: me.playerId, token: me.token } });
      setRoom(st.room as Room);
      setPlayers(st.players as Player[]);
      setAttempts(st.attempts as Attempt[]);
      setHistory(st.history);
      setAnswerAllowed(st.answerAllowed);
      setPicked(st.picked);
      setUsedTeams(st.usedTeams ?? []);
      setClockOffset(st.serverNow - Date.now());
    } catch {
      setMissing(true);
    } finally {
      inFlight.current = false;
    }
  }, [code, me.playerId, me.token, getState]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 700);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    const tick = () => setNow(Date.now() + clockOffset);
    tick();
    const t = setInterval(tick, 100);
    return () => clearInterval(t);
  }, [clockOffset]);

  if (missing) return <main className="p-10 text-center"><p className="mb-4">Oda bulunamadı ya da bu odaya erişimin yok.</p><Link to="/" className="text-primary underline">Ana sayfa</Link></main>;
  if (!room) return <main className="p-10 text-center text-muted-foreground">Yükleniyor…</main>;

  const auth = { code, playerId: me.playerId, token: me.token };
  const isHost = room.host_player_id === me.playerId;
  const name = (id: string | null) => players.find((p) => p.id === id)?.nickname ?? "?";
  const finalSeconds = room.final_deadline ? Math.min(FINAL_ANSWER_SECONDS, Math.max(0, Math.ceil((Date.parse(room.final_deadline) - now) / 1000))) : null;
  const roundSeconds = room.round_deadline ? Math.max(0, Math.ceil((Date.parse(room.round_deadline) - now) / 1000)) : null;

  return (
    <GameShell match={room.status !== "lobby" && room.status !== "picking"} className={`room-screen status-${room.status}`}>
      <PlayerSafety auth={auth} players={players} />
      {room.status !== "lobby" && <header className="room-header"><Button asChild variant="ghost" size="icon" aria-label="Ana sayfa"><Link to="/"><ArrowLeft /></Link></Button><span>Oda {room.code} · Tur {room.round_no}</span></header>}
      {room.status !== "lobby" && room.status !== "finished" && <><h1 className="screen-heading">{room.status === "picking" ? "Takım seçimi" : room.status === "answering" ? "Cevaplama" : room.status === "revealing" ? "Doğru cevaplar" : "Tur sonucu"}</h1><Scoreboard players={players} me={me.playerId} target={room.target_score} host={room.host_player_id} /></>}

      {room.status === "lobby" && (
        <Panel title="">
          <h1 className="lobby-heading"><span>Lobi</span><strong>{room.code}</strong></h1>
          <ShareCode code={room.code} />
          <p className="mb-4 text-center text-sm text-muted-foreground">{room.team_mode === "random" ? `Rastgele takımlar · ${difficultyLabels[room.difficulty]}` : "Takımları oyuncular seçer"} · {room.round_seconds > 0 ? `${room.round_seconds} sn tur süresi` : "sınırsız tur süresi"}</p>
          <div className="lobby-players glass-panel">{players.map((p, i) => <div className="lobby-player" key={p.id}><span className={`player-symbol ${p.id === room.host_player_id ? "host-symbol" : ""}`}>{p.id === room.host_player_id ? <Crown /> : i % 2 ? <ShieldCheck /> : <Users />}</span><span>{p.nickname}{p.id === room.host_player_id ? " (oda sahibi)" : ""}</span><ChevronRight className="text-muted-foreground" /></div>)}</div>
          {isHost ? <StartButton auth={auth} disabled={players.length < 2} label={players.length < 2 ? "En az 2 oyuncu gerekli" : "Oyunu başlat"} />
            : <p className="text-center font-semibold">Oda sahibinin başlatması bekleniyor…</p>}
        </Panel>
      )}

      {room.status === "picking" && (
        <Panel title={`Tur ${room.round_no} — Takımlar seçiliyor`}>
          {room.team_mode === "random" ? <>
            <p role="status" className="my-6 text-center">{room.random_exhausted ? "Bu zorluktaki kullanılmamış takımlar tükendi." : "Takımlar rastgele seçiliyor…"}</p>
            {room.random_exhausted && (isHost ? <ManualFallback auth={auth} /> : <p className="text-center text-muted-foreground">Oda sahibinin takım seçimini değiştirmesi bekleniyor…</p>)}
          </> : <>
            <div className="picking-emblem"><LockKeyhole /></div><p className="mb-6 text-center text-muted-foreground"><b className="text-foreground">{name(room.chooser_a)}</b> ve <b className="text-foreground">{name(room.chooser_b)}</b> gizlice birer takım seçiyor.</p>
            {(me.playerId === room.chooser_a || me.playerId === room.chooser_b) ? <PickForm key={room.round_no} auth={auth} picked={picked} excludedTeams={usedTeams} /> : <p className="text-center font-semibold">Hazır olunca takımlar aynı anda açılacak…</p>}
            {isHost && <SkipButton auth={auth} />}
          </>}
        </Panel>
      )}

      {room.status === "answering" && room.team_a && room.team_b && (
        <Panel title={`Tur ${room.round_no}`}>
          <Teams a={room.team_a} b={room.team_b} />
          <RecentAttempts list={attempts} />
          {roundSeconds !== null && <div role="timer" aria-label="Tur süresi" className="final-timer">
            <Clock3 /><span>{roundSeconds > 0 ? `Tur süresi: ${roundSeconds} sn` : "Süre doldu, tur tamamlanıyor…"}</span>
            <span key={roundSeconds} className="countdown-number">{roundSeconds}</span>
          </div>}
          {finalSeconds !== null && <div role="timer" aria-label="Son cevap süresi" className="final-timer"><Clock3 /><span>{finalSeconds > 0 ? `Son hak: ${finalSeconds} sn` : "Hakemin kararı bekleniyor…"}</span><span key={finalSeconds} className="countdown-number">{finalSeconds}</span></div>}
          <AnswerForm key={`${room.round_no}-${room.final_deadline ?? "normal"}`} auth={auth} allowed={answerAllowed && finalSeconds !== 0 && roundSeconds !== 0} final={finalSeconds !== null} onAnswered={refresh} />
          <PassButton auth={auth} passed={room.pass_round === room.round_no && room.passed_players.includes(me.playerId)}
            count={room.pass_round === room.round_no ? room.passed_players.length : 0} total={players.length} onDone={refresh} />
          {isHost && finalSeconds === null && roundSeconds === null && <SkipButton auth={auth} />}
        </Panel>
      )}

      {room.status === "revealing" && (
        <Panel title={`Tur ${room.round_no} — Doğru cevaplar`}>
          {room.team_a && room.team_b && <Teams a={room.team_a} b={room.team_b} />}
          <p role="status" className="my-4 text-center font-semibold text-primary">Kayıtlı doğru cevaplar hazırlanıyor…</p>
          <RecentAttempts list={attempts} />
        </Panel>
      )}

      {room.status === "round_result" && (
        <Panel title={`Tur ${room.round_no} bitti`}>
          {room.team_a && room.team_b && <Teams a={room.team_a} b={room.team_b} />}
          <div className="animate-pop result-summary">
            {room.round_winner_id ? <><p className="text-sm text-muted-foreground">Golü atan</p><p className="font-display text-4xl text-primary">{name(room.round_winner_id)}</p><p className="font-semibold">{room.round_answer}</p></>
              : <p className="font-semibold">Bu tur kimse bulamadı.</p>}
          </div>
          <GameDetails title="Turun cevapları"><Attempts list={attempts} /><RevealedAnswers suggestions={room.round_suggestions} /></GameDetails>
          {isHost ? <StartButton auth={auth} label="Sonraki tur" /> : <p className="mt-3 text-center text-muted-foreground">Oda sahibi sonraki turu başlatacak…</p>}
        </Panel>
      )}

      {room.status === "finished" && (
        <Panel title="">
          <div className="animate-pop winner-block">
            <h1 className="winner-heading">{name(room.winner_player_id)} KAZANDI</h1>
            <div className="winner-score"><Trophy /><strong>{players.find(p => p.id === room.winner_player_id)?.score ?? room.target_score} - {Math.max(0, ...players.filter(p => p.id !== room.winner_player_id).map(p => p.score))}</strong><Trophy /></div>
            {room.round_answer && <p className="mt-2 text-sm">Son cevap: <b>{room.round_answer}</b></p>}
          </div>
          <GameDetails title="Maç özeti">
            {attempts.length > 0 && <><h2 className="section-heading">Son turun cevapları</h2><Attempts list={attempts} /></>}
            <RevealedAnswers suggestions={room.round_suggestions} />
            <MatchHistory rounds={history} players={players} />
          </GameDetails>
          <Rematch auth={auth} current={room.target_score} mode={room.team_mode} difficulty={room.difficulty} roundSeconds={room.round_seconds} />
        </Panel>
      )}
    </GameShell>
  );
}

type Auth = { code: string; playerId: string; token: string };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="game-section">{title && <h2 className="sr-only">{title}</h2>}{children}</section>;
}

function ShareCode({ code }: { code: string }) {
  async function share() {
    const url = roomInviteUrl(window.location.protocol === "capacitor:" ? "https://ortak-oyuncu.lovable.app" : window.location.origin, code);
    try {
      if (await shareInvitation(url) === "copied") toast.success("Davet linki kopyalandı");
    } catch { toast.error("Davet paylaşılamadı, tekrar dene."); }
  }
  return <Button variant="secondary" onClick={share} className="share-action"><Share2 />Davet linkini paylaş</Button>;
}

function Scoreboard({ players, me, target, host }: { players: Player[]; me: string; target: number; host: string | null }) {
  return (
    <div className="score-strip glass-panel">
      {players.map((p) => (
        <div key={p.id} className="score-player" title={`${p.nickname}${p.id === me ? " (sen)" : ""}${p.id === host ? " (oda sahibi)" : ""}`}>
          <span className="score-avatar">{p.nickname.slice(0, 1).toUpperCase()}</span><span className="truncate">{p.nickname}</span><strong className={p.score > 0 ? "text-success" : "text-primary"}>{p.score}</strong>
        </div>
      ))}
      <div className="score-target"><Trophy /><span>Hedef <b>{target}</b></span></div>
    </div>
  );
}

function Teams({ a, b }: { a: string; b: string }) {
  const styleFor = (team: string, fallback: string) => {
    const palette = clubColors(team);
    return { "--club-color": palette?.[0] ?? fallback, "--club-color-2": palette?.[1] ?? "transparent" } as CSSProperties;
  };
  return (
    <div className="animate-pop teams-faceoff">
      <div className="team-side team-left" style={styleFor(a, "var(--team-red)")}><ClubMark team={a} /><span>{a}</span></div>
      <span className="versus">VS</span>
      <div className="team-side team-right" style={styleFor(b, "var(--team-blue)")}><ClubMark team={b} /><span>{b}</span></div>
    </div>
  );
}

function useAction<T, R>(fn: (a: { data: T }) => Promise<R>) {
  const [busy, setBusy] = useState(false);
  const run = async (data: T): Promise<R | undefined> => { setBusy(true); try { return await fn({ data }); } catch (e) { toast.error((e as Error).message); return undefined; } finally { setBusy(false); } };
  return { busy, run };
}

function StartButton({ auth, label, disabled }: { auth: Auth; label: string; disabled?: boolean }) {
  const { busy, run } = useAction(useServerFn(startRound));
  return <Button disabled={busy || disabled} className="main-action mt-5" onClick={() => run(auth)}>{label}</Button>;
}

function Rematch({ auth, current, mode: initialMode, difficulty: initialDifficulty, roundSeconds: initialRoundSeconds }: { auth: Auth; current: number; mode: TeamMode; difficulty: Difficulty; roundSeconds: number }) {
  const { busy, run } = useAction(useServerFn(startRound));
  const [target, setTarget] = useState<3 | 5>(current === 5 ? 5 : 3);
  const [mode, setMode] = useState<TeamMode>(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [roundSeconds, setRoundSeconds] = useState(initialRoundSeconds);
  return (
    <div className="mt-2">
      <p className="mb-2 text-center text-sm text-muted-foreground">Aynı ekiple rövanş! Kaç doğru bilen kazansın?</p>
      <div className="mb-2 grid grid-cols-2 gap-2">
        {([3, 5] as const).map((n) => (
          <Button key={n} variant={target === n ? "default" : "secondary"} className="h-12 text-lg" onClick={() => setTarget(n)}>{n} doğru</Button>
        ))}
      </div>
      <TeamModePicker mode={mode} difficulty={difficulty} onMode={setMode} onDifficulty={setDifficulty} roundSeconds={roundSeconds} onRoundSeconds={setRoundSeconds} disabled={busy} />
      <Button disabled={busy} className="main-action mt-4" onClick={() => run({ ...auth, target, mode, difficulty, roundSeconds })}>Rövanş</Button>
    </div>
  );
}

function PassButton({ auth, passed, count, total, onDone }: { auth: Auth; passed: boolean; count: number; total: number; onDone: () => Promise<void> }) {
  const { busy, run } = useAction(useServerFn(passRound));
  return (
    <div className="pass-area">
      <Button variant="ghost" disabled={busy || passed} className="pass-action" onClick={async () => { await run(auth); await onDone(); }}>
        <StepForward />{passed ? "Pas dedin — diğerleri bekleniyor" : "Pas"}
      </Button>
      {count > 0 && <p className="mt-1 text-center text-xs text-muted-foreground">{count}/{total} oyuncu pas dedi. Herkes pas derse sonraki tura geçilir.</p>}
    </div>
  );
}

function SkipButton({ auth }: { auth: Auth }) {
  const { busy, run } = useAction(useServerFn(skipRound));
  return <Button variant="ghost" disabled={busy} className="mt-3 w-full text-muted-foreground" onClick={() => run(auth)}>Turu geç</Button>;
}

function PickForm({ auth, picked, excludedTeams }: { auth: Auth; picked: boolean; excludedTeams: string[] }) {
  const { busy, run } = useAction(useServerFn(submitPick));
  const [team, setTeam] = useState("");
  const [sent, setSent] = useState(picked);
  const [again, setAgain] = useState(false);
  const [seen, setSeen] = useState(picked);
  const [league, setLeague] = useState("Tümü");
  const availableTeams = supportedTeams.filter(name => (league === "Tümü" || teamLeague(name) === league) && !excludedTeams.some(used => sameTeam(used, name)));
  useEffect(() => {
    if (picked) { setSeen(true); setSent(true); }
    else if (seen) { setSeen(false); setSent(false); setAgain(true); setTeam(""); }
  }, [picked, seen]);
  const submit = async () => {
    const r = await run({ ...auth, team });
    if (!r) return;
    if (r.duplicate) { setAgain(true); setTeam(""); toast.error("İkiniz de aynı takımı seçtiniz! Tekrar seçin."); }
    else { setSent(true); setAgain(false); }
  };
  if (sent) return <p className="text-center font-semibold text-success">Takımın kilitlendi 🔒 Rakip bekleniyor…</p>;
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      {again && <p className="text-center font-semibold text-destructive">İki taraf aynı takımı seçti — farklı bir takım seçin.</p>}
      <select aria-label="Lig filtresi" className="game-input" value={league} onChange={(e) => setLeague(e.target.value)}>
        <option value="Tümü">Tüm ligler</option>
        {[...Object.keys(teamLeagues), "Diğer ligler"].map(value => <option key={value} value={value}>{value}</option>)}
      </select>
      <Input aria-label="Takım adı" list="supported-clubs" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="send" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Aklındaki takım (ör. Galatasaray)" className="game-input" maxLength={40} />
      <datalist id="supported-clubs">{availableTeams.map(name=><option key={name} value={name}/>)}</datalist>
      <Button disabled={busy || team.trim().length < 2} className="main-action"><LockKeyhole />Gizlice seç</Button>
    </form>
  );
}

function AnswerForm({ auth, allowed, final, onAnswered }: { auth: Auth; allowed: boolean; final: boolean; onAnswered: () => Promise<void> }) {
  const { busy, run } = useAction(useServerFn(submitAnswer));
  const [answer, setAnswer] = useState("");
  const [waiting, setWaiting] = useState(false);
  const blocked = !allowed || waiting;
  return (
    <form className="answer-form flex flex-col gap-2" onSubmit={async (e) => {
      e.preventDefault();
      if (blocked || busy) return;
      const r = (await run({ ...auth, answer })) as { correct: boolean } | undefined;
      if (r && !r.correct) { setWaiting(true); toast.error("Yanlış cevap! Diğer oyuncu bekleniyor."); setAnswer(""); }
      await onAnswered();
      setWaiting(false);
    }}>
      <Input aria-label="Oyuncu adı" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="send" disabled={blocked || busy} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Oyuncu adı yaz" className="game-input" maxLength={60} />
      <Button disabled={busy || blocked || answer.trim().length < 2} className="answer-action"><Send />{busy ? "Hakem kontrol ediyor…" : blocked ? final ? "Son cevap bekleniyor…" : "Diğer oyuncu bekleniyor…" : "Cevapla"}</Button>
    </form>
  );
}

function RecentAttempts({ list }: { list: Attempt[] }) {
  return <div className="recent-attempts"><Attempts list={list.slice(-2)} compact />
    {list.length > 0 && <GameDetails title={`Tüm cevaplar (${list.length})`}><Attempts list={list} /></GameDetails>}
  </div>;
}

function Attempts({ list, compact = false }: { list: Attempt[]; compact?: boolean }) {
  if (!list.length) return null;
  return (
    <ul className={`attempt-list glass-panel${compact ? " compact-attempts" : ""}`}>
      {list.map((a) => (
        <li key={a.id} className={`attempt-row ${a.correct ? "attempt-correct" : "attempt-wrong"}`}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><span className="min-w-0 break-words"><b>{a.nickname}:</b> {a.answer}</span>{a.correct ? <span className="goal-badge"><Check aria-hidden="true" />GOL</span> : <span className="red-card" role="img" aria-label="Yanlış cevap — kırmızı kart" />}</div>
          {!compact && a.explanation && <p className="mt-1 text-sm text-muted-foreground">{a.explanation}</p>}
        </li>
      ))}
    </ul>
  );
}

function RevealedAnswers({ suggestions }: { suggestions: SuggestedAnswers | null }) {
  if (!suggestions) return null;
  return (
    <div className="revealed-answers">
      <h3 className="section-heading">Doğru cevaplar</h3>
      {suggestions.message && <p className="text-sm text-muted-foreground">{suggestions.message}</p>}
      <ul className="glass-panel suggested-list">
        {suggestions.answers.slice(0, 3).map((answer) => (
          <li key={answer.player} className="suggested-row">
            <Check className="verified-icon" /><div className="min-w-0"><p className="font-semibold">{answer.player}</p>
            <p className="mt-1 text-sm text-muted-foreground">{answer.explanation}</p>
            <div className="mt-1 flex flex-wrap gap-3">
              {answer.sources.map((url, i) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Kaynak {i + 1}</a>)}
            </div>
            </div>
          </li>
        ))}
      </ul>
      {suggestions.answers.length > 0 && <p className="verified-note"><ShieldCheck />Kaynaklı futbol kayıtlarından doğrulanan cevaplar</p>}
    </div>
  );
}

function ManualFallback({ auth }: { auth: Auth }) {
  const { busy, run } = useAction(useServerFn(useManualTeams));
  return <Button disabled={busy} className="main-action" onClick={() => run(auth)}>Takımları biz seçelim</Button>;
}
