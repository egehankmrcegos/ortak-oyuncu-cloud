import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GamePrivacy } from "@/components/game-privacy";
import { observeNativeConnection } from "@/lib/native";
import { clubColors } from "@/lib/club-colors";
import footballNight from "@/assets/football-night.jpg";
import { useGameViewport } from "@/hooks/use-game-viewport";

export function GameShell({ children, match = false, className = "" }: { children: ReactNode; match?: boolean; className?: string }) {
  useGameViewport();
  const [online, setOnline] = useState(true);
  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | undefined;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    void observeNativeConnection(setOnline).then(cleanup => { if (cancelled) cleanup(); else stop = cleanup; }).catch(() => {});
    return () => { cancelled = true; stop?.(); window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return <main className={`game-shell ${match ? "match-shell" : "paper-shell"} ${className}`}>
    <img className="stadium-backdrop" src={footballNight} alt="" width={1536} height={1024} />
    <div className="brand-bar"><span className="brand-monogram">O/B</span><span>O MU BU MU?</span><Button asChild variant="ghost" size="icon" className="brand-help"><Link to="/destek" aria-label="Destek ve gizlilik">?</Link></Button></div>
    {!online && <div className="connection-notice" role="status">İnternet bağlantısı yok. Yeniden bağlanman bekleniyor…<button type="button" className="connection-retry" onClick={() => window.location.reload()}>Tekrar dene</button></div>}
    <div className="scene-content">{children}</div>
    <GamePrivacy />
  </main>;
}

export function ClubMark({ team }: { team: string }) {
  const palette = clubColors(team);
  const style = palette ? ({ "--club-color": palette[0], "--club-color-2": palette[1] } as CSSProperties) : undefined;
  return <div className={`club-mark club-fallback${palette ? " club-tinted" : ""}`} style={style} aria-label={`${team} renkleri`}><span>{team.split(" ").map(word => word[0]).join("").slice(0, 3)}</span></div>;
}
