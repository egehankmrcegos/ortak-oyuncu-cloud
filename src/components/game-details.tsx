import type { ReactNode } from "react";
import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function GameDetails({ title, children }: { title: string; children: ReactNode }) {
  return <Dialog>
    <DialogTrigger asChild><Button variant="outline" className="game-details-trigger"><List />{title}</Button></DialogTrigger>
    <DialogContent className="game-details-dialog" aria-describedby={undefined}>
      <DialogTitle>{title}</DialogTitle>
      <div className="game-details-body">{children}</div>
    </DialogContent>
  </Dialog>;
}