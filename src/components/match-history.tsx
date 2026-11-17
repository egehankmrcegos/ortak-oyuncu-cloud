import { Check, ChevronDown } from "lucide-react";
import type { SummaryRound } from "@/lib/match-summary";

export function MatchHistory({ rounds, players }: { rounds: SummaryRound[]; players: Array<{ id: string; nickname: string }> }) {
  return <section aria-label="Maç özeti" className="match-history">
    <div className="match-report-masthead"><span>Maç Raporu</span><small>{rounds.length} tur oynandı</small></div>
    {!rounds.length && <p className="text-sm text-muted-foreground">Bu maçın tur kayıtları bulunamadı.</p>}
    {rounds.map((round, index) => <details key={round.round_no} className="history-round" open={index === rounds.length - 1}>
      <summary><div className="min-w-0"><p className="text-sm text-muted-foreground">Tur {index + 1}</p><p className="font-semibold break-words">{round.team_a ?? "Takım seçilmedi"} · {round.team_b ?? "Takım seçilmedi"}</p><p className={round.winner_player_id ? "text-success text-sm" : "text-muted-foreground text-sm"}>{round.winner_player_id ? `${players.find(player => player.id === round.winner_player_id)?.nickname ?? "Oyuncu"} +1 · ${round.answer ?? "Doğru cevap"}` : "Puansız geçildi"}</p></div><ChevronDown className="shrink-0" /></summary>
      {round.attempts.length ? <ul>{round.attempts.map(attempt => <li key={attempt.id} className={`attempt-row ${attempt.correct ? "attempt-correct" : "attempt-wrong"}`}><div className="flex items-start justify-between gap-3"><p className="min-w-0 break-words"><b>{attempt.nickname}:</b> {attempt.answer}</p>{attempt.correct ? <span className="goal-badge"><Check aria-hidden="true" />GOL</span> : <span className="red-card" role="img" aria-label="Yanlış cevap — kırmızı kart" />}</div>{attempt.explanation && <p className="mt-1 text-sm text-muted-foreground">{attempt.explanation}</p>}</li>)}</ul> : <p className="py-3 text-sm text-muted-foreground">Bu turda cevap verilmedi.</p>}
    </details>)}
  </section>;
}