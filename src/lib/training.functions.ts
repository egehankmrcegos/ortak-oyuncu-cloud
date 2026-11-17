import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Solo practice is stateless: nothing is stored and no room token is involved.
const club = z.string().trim().min(2).max(40);

export const startTraining = createServerFn({ method: "POST" })
  .inputValidator(z.object({ club, previous: z.string().max(40).optional() }))
  .handler(async ({ data }) => {
    const { trainingOpponent } = await import("./football-referee.server");
    const opponent = trainingOpponent(data.club, data.previous);
    if (!opponent) throw new Error("Bu takım için henüz antrenman eşleşmesi yok. Listeden başka bir takım seç.");
    return opponent;
  });

export const checkTraining = createServerFn({ method: "POST" })
  .inputValidator(z.object({ club, opponent: club, answer: z.string().trim().min(2).max(60) }))
  .handler(async ({ data }) => {
    const { trainingVerdict } = await import("./football-referee.server");
    return trainingVerdict(data.club, data.opponent, data.answer);
  });
