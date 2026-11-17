import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return <main className="legal-page">
    <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
      <Button variant="ghost" size="icon" asChild><Link to="/" aria-label="Ana sayfa"><ArrowLeft /></Link></Button>
      <span className="font-display text-2xl font-bold">O MU BU MU?</span>
    </header>
    <h1 className="mt-8 font-display text-4xl font-bold">{title}</h1>
    <div className="legal-copy">{children}</div>
    <nav className="mt-8 flex flex-wrap gap-4 border-t border-border pt-5 text-sm" aria-label="Bilgi sayfaları"><Link to="/gizlilik" className="text-primary underline">Gizlilik</Link><Link to="/destek" className="text-primary underline">Destek</Link><Link to="/" className="text-primary underline">Oyuna dön</Link></nav>
  </main>;
}