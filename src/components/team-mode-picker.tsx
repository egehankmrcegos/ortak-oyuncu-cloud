import { Button } from "@/components/ui/button";
import { Shuffle, LockKeyhole, Dumbbell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { difficultyLabels, type Difficulty, type TeamMode } from "@/lib/random-teams";

const roundLengths = [0, 15, 30] as const;

export function TeamModePicker({ mode, difficulty, onMode, onDifficulty, roundSeconds, onRoundSeconds, disabled = false }: { mode: TeamMode | null; difficulty: Difficulty; onMode: (mode: TeamMode) => void; onDifficulty: (difficulty: Difficulty) => void; roundSeconds: number; onRoundSeconds: (seconds: number) => void; disabled?: boolean }) {
  return <div className="mode-picker">
    <p className="mb-2 font-semibold">Takım seçimi</p>{mode === null && <p className="mb-2 text-xs text-muted-foreground">Oda kurmak için bir oyun modu seç.</p>}
    <div role="group" aria-label="Takım seçimi modu" className="mode-grid grid grid-cols-3 gap-2">
      <Button type="button" disabled={disabled} variant={mode === "manual" ? "default" : "secondary"} aria-pressed={mode === "manual"} onClick={() => onMode("manual")}><LockKeyhole />Biz seçelim</Button>
      <Button type="button" disabled={disabled} variant={mode === "random" ? "default" : "secondary"} aria-pressed={mode === "random"} onClick={() => onMode("random")}><Shuffle />Rastgele</Button>
      <Button asChild variant="secondary"><Link to="/antrenman" aria-label="Tek başına antrenman yap"><Dumbbell />Antrenman</Link></Button>
    </div>
    {mode === "random" && <div role="group" aria-label="Zorluk" className="mt-3 grid grid-cols-3 gap-2">{(["easy", "medium", "hard"] as const).map(value => <Button type="button" disabled={disabled} key={value} variant={difficulty === value ? "default" : "secondary"} aria-pressed={difficulty === value} onClick={() => onDifficulty(value)}>{difficultyLabels[value]}</Button>)}</div>}
    <div className="mt-3 round-duration">
      <p className="mb-1 font-semibold">Oyun süresi</p>
      <div role="group" aria-label="Tur süresi" className="grid grid-cols-3 gap-2">
        {roundLengths.map(seconds => <Button key={seconds} type="button" disabled={disabled} variant={roundSeconds === seconds ? "default" : "secondary"} aria-pressed={roundSeconds === seconds} onClick={() => onRoundSeconds(seconds)}>{seconds === 0 ? "Sınırsız" : `${seconds} sn`}</Button>)}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Sayaç iki takım seçilince başlar.</p>
    </div>
  </div>;
}
