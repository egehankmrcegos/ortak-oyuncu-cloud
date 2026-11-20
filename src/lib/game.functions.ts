import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { answerNamesPlayer, canAnswer, finalAnswerAllowed, choosePair, shouldRevealAnswers, parseSuggestedAnswers } from "@/lib/game-rules";
import { normalizeTeamName, sameTeam } from "@/lib/team-names";
import { assertSafeContent } from "@/lib/content-safety";

import { buildMatchSummary } from "@/lib/match-summary";
import { requireRoomCode } from "@/lib/room-code";

const roomCode = z.string().transform(requireRoomCode);
const auth = z.object({ code: roomCode, playerId: z.string().uuid(), token: z.string().uuid() });

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadAuthed(data: z.infer<typeof auth>) {
  const db = await admin();
  const { data: room } = await db.from("rooms").select("*").eq("code", data.code.toUpperCase()).single();
  if (!room) throw new Error("Oda bulunamadı");
  const { data: player } = await db.from("players").select("*").eq("id", data.playerId).eq("room_id", room.id).single();
  if (!player || player.token !== data.token || player.deleted_at !== null) throw new Error("Oyuncu doğrulanamadı");
  return { db, room, player };
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const nick = z.string().trim().min(1).max(20).transform(assertSafeContent);
const modeOptions = { mode: z.enum(["manual", "random"]).optional(), difficulty: z.enum(["easy", "medium", "hard"]).optional() };
const roundSecondsOption = z.union([z.literal(0), z.literal(10), z.literal(15), z.literal(20), z.literal(30), z.literal(60)]).optional();

export const createRoom = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ nickname: nick, target: z.union([z.literal(3), z.literal(5)]), ...modeOptions, roundSeconds: roundSecondsOption }).parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
        let room = null;
    let roomInsertError: { code?: string; message: string } | null = null;
    for (let i = 0; i < 5 && !room; i++) {
      const { data: r, error } = await db.from("rooms").insert({ code: makeCode(), target_score: data.target, team_mode: data.mode ?? "manual", difficulty: data.difficulty ?? "easy", round_seconds: data.roundSeconds ?? 0 }).select().single();
      if (error) {
        roomInsertError = error;
        if (error.code === "23505") continue;
        throw new Error(`Oda oluşturulamadı: ${error.message}`);
      }
      room = r;
    }
    if (!room) throw new Error(roomInsertError ? `Oda oluşturulamadı: ${roomInsertError.message}` : "Oda oluşturulamadı");

    const { data: p, error } = await db.from("players").insert({ room_id: room.id, nickname: data.nickname }).select().single();
    if (error || !p) throw new Error("Oyuncu eklenemedi");
    await db.from("rooms").update({ host_player_id: p.id }).eq("id", room.id);
    return { code: room.code, playerId: p.id, token: p.token };
  });

export const joinRoom = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ code: roomCode, nickname: nick }).parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: room } = await db.from("rooms").select("*").eq("code", data.code.toUpperCase()).maybeSingle();
    if (!room) throw new Error("Bu kodla bir oda yok");
    if (room.status === "finished") throw new Error("Bu oyun bitti");
    const { data: p, error } = await db.from("players").insert({ room_id: room.id, nickname: data.nickname }).select().single();
    if (error || !p) throw new Error("Katılamadın");
    return { code: room.code, playerId: p.id, token: p.token };
  });

export const startRound = createServerFn({ method: "POST" })
  .inputValidator((i) => auth.extend({ target: z.union([z.literal(3), z.literal(5)]).optional(), ...modeOptions, roundSeconds: roundSecondsOption }).parse(i))
  .handler(async ({ data }) => {
    const { db, room, player } = await loadAuthed(data);
    // Rematch: once a match is finished any player in the room may restart it.
    if (room.host_player_id !== player.id && room.status !== "finished") throw new Error("Turu sadece oda sahibi başlatabilir");
    if (["picking", "answering", "revealing"].includes(room.status)) throw new Error("Tur zaten devam ediyor");
    const { data: players } = await db.from("players").select("id").eq("room_id", room.id).order("created_at");
    if (!players || players.length < 2) throw new Error("En az 2 oyuncu gerekli");
    const next = room.round_no + 1;
    const target = room.status === "finished" && data.target ? data.target : room.target_score;
    if (room.status === "finished") await db.from("players").update({ score: 0 }).eq("room_id", room.id);
    const [a, b] = choosePair(players.map((p) => p.id), next);
    await db.from("rooms").update({
      status: "picking", round_no: next, target_score: target,
      ...(room.status === "finished" ? { match_start_round: next, team_mode: data.mode ?? room.team_mode, difficulty: data.difficulty ?? room.difficulty, round_seconds: data.roundSeconds ?? room.round_seconds } : {}), random_exhausted: false, chooser_a: a, chooser_b: b, team_a: null, team_b: null,
      round_winner_id: null, round_answer: null, round_suggestions: null, final_deadline: null, final_players: null, winner_player_id: null, updated_at: new Date().toISOString(),
    }).eq("id", room.id);
    return { ok: true };
  });

export const submitPick = createServerFn({ method: "POST" })
  .inputValidator((i) => auth.extend({ team: z.string().trim().min(2).max(40) }).parse(i))
  .handler(async ({ data }) => {
    const { db, room, player } = await loadAuthed(data);
    if (room.status !== "picking") throw new Error("Şu an takım seçme zamanı değil");
    if (room.team_mode === "random") throw new Error("Bu maçta takımlar rastgele seçiliyor");
    if (player.id !== room.chooser_a && player.id !== room.chooser_b) throw new Error("Bu tur takım seçen sen değilsin");
    const { data: used } = await db.from("picks").select("team").eq("room_id", room.id)
      .gte("round_no", room.match_start_round).lt("round_no", room.round_no);
    if (used?.some((p) => sameTeam(p.team, data.team))) throw new Error("Bu takım bu maçta zaten kullanıldı, başka bir takım seç");
    assertSafeContent(data.team);
    const team = normalizeTeamName(data.team);
    const { supportedClub } = await import("@/lib/football-referee.server");
    if (!supportedClub(team)) throw new Error("Bu takım henüz doğrulanmış oyun kataloğunda yok. Lütfen desteklenen bir takım seç.");
    const latest = await loadAuthed(data);
    if (latest.room.status !== "picking" || latest.room.round_no !== room.round_no) throw new Error("Tur değişti, yeniden takım seç.");
    await db.from("picks").upsert({ room_id: room.id, round_no: room.round_no, player_id: player.id, team });
    const { data: picks } = await db.from("picks").select("*").eq("room_id", room.id).eq("round_no", room.round_no);
    const pa = picks?.find((p) => p.player_id === room.chooser_a);
    const pb = picks?.find((p) => p.player_id === room.chooser_b);
    if (pa && pb && sameTeam(pa.team, pb.team)) {
      await db.from("picks").delete().eq("room_id", room.id).eq("round_no", room.round_no);
      return { ok: true, duplicate: true };
    }
    if (pa && pb) {
      await db.from("rooms").update({ status: "answering", team_a: pa.team, team_b: pb.team, updated_at: new Date().toISOString() })
        .eq("id", room.id).eq("status", "picking");
    }
    return { ok: true, duplicate: false };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .inputValidator((i) => auth.extend({ answer: z.string().trim().min(2).max(60) }).parse(i))
  .handler(async ({ data }) => {
    assertSafeContent(data.answer);
    const { db, room, player } = await loadAuthed(data);
    if (room.status !== "answering" || !room.team_a || !room.team_b) throw new Error("Şu an cevap verilemez");
    const { data: submission, error: reservationError } = await db.rpc("reserve_answer", {
      p_room: room.id, p_player: player.id, p_token: data.token, p_round: room.round_no,
    });
    if (reservationError || !submission) throw new Error(reservationError?.message ?? "Cevap gönderilemedi");
    let v: { correct: boolean; player: string; explanation: string };
    try {
      const { judgeWithCatalog } = await import("@/lib/football-referee.server");
      v = await judgeWithCatalog(db, room.team_a, room.team_b, data.answer);
      if (v.correct && !answerNamesPlayer(data.answer, v.player)) {
        v = { ...v, correct: false, explanation: `Cevap bir futbolcu adı içermiyor. (Hakemin bulduğu: ${v.player})` };
      }
    } catch (e) {
      await db.from("answer_submissions").delete().eq("id", submission).eq("resolved", false);
      console.error(e);
      throw new Error(e instanceof Error ? e.message : "Cevap kontrol edilemedi, tekrar dene");
    }
    const { error: insertError } = await db.rpc("record_answer", {
      p_submission: submission, p_answer: data.answer, p_correct: v.correct,
      p_explanation: v.explanation, p_name: v.player || data.answer,
    });
    if (insertError) throw new Error(insertError.message);
    await db.rpc("advance_final_round", { p_room: room.id, p_player: player.id, p_token: data.token });
    return v;
  });

export const skipRound = createServerFn({ method: "POST" })
  .inputValidator((i) => auth.parse(i))
  .handler(async ({ data }) => {
    const { db, room, player } = await loadAuthed(data);
    if (room.host_player_id !== player.id) throw new Error("Sadece oda sahibi geçebilir");
    if (room.final_deadline) throw new Error("Son cevap süresi devam ediyor");
    if (!["picking", "answering"].includes(room.status)) throw new Error("Bu tur zaten bitti");
    const { data: attempts, error: attemptsError } = await db.from("attempts").select("player_id, correct")
      .eq("room_id", room.id).eq("round_no", room.round_no);
    if (attemptsError) throw new Error("Turun cevapları kontrol edilemedi");
    const reveal = room.status === "answering" && !!room.team_a && !!room.team_b && shouldRevealAnswers(attempts ?? []);
    const { data: changed, error } = await db.from("rooms").update({
      status: reveal ? "revealing" : "round_result", round_winner_id: null, round_answer: null, round_suggestions: null,
      updated_at: new Date().toISOString(),
    }).eq("id", room.id).eq("round_no", room.round_no).eq("status", room.status).select("id");
    if (error || !changed?.length) throw new Error("Tur değişti, ekranı yenileyip tekrar dene");
    if (reveal && room.team_a && room.team_b) {
      let suggestions: { answers: ReturnType<typeof parseSuggestedAnswers>; message: string | null };
      try {
        const { suggestionsWithCatalog } = await import("@/lib/football-referee.server");
        const known = await suggestionsWithCatalog(db, room.team_a, room.team_b);
        const answers = known;
        suggestions = { answers, message: answers.length ? null : "Bu iki takım için kaynaklarla doğrulanmış ortak futbolcu bulunamadı." };
      } catch (e) {
        console.error(e);
        suggestions = { answers: [], message: "Doğru cevaplar şu anda doğrulanamadı. Bu, ortak futbolcu olmadığı anlamına gelmez." };
      }
      const { error: saveError } = await db.from("rooms").update({ status: "round_result", round_suggestions: suggestions, updated_at: new Date().toISOString() })
        .eq("id", room.id).eq("round_no", room.round_no).eq("status", "revealing");
      if (saveError) throw new Error("Doğru cevaplar kaydedilemedi");
    }
    return { ok: true };
  });

export const getRoomState = createServerFn({ method: "POST" })
  .inputValidator((i) => auth.parse(i))
  .handler(async ({ data }) => {
    const loaded = await loadAuthed(data);
    const { db, player } = loaded;
    let room = loaded.room;
    const roundDue = room.status === "answering" && !!room.round_deadline && Date.now() >= Date.parse(room.round_deadline);
    let roundExpired = false;
    if (roundDue) {
      const { data: expired, error: expireError } = await db.rpc("expire_room_round", { p_room: room.id, p_player: player.id, p_token: data.token });
      if (expireError) throw new Error("Süreli tur kontrol edilemedi");
      roundExpired = !!expired;
    }
    // Only touch the room lock when a final window can actually be closed.
    const due = !roundExpired && room.status === "answering" && !!room.final_deadline && Date.now() >= Date.parse(room.final_deadline);
    let advanced = roundExpired;
    if (due) {
      const { data: adv, error: advanceError } = await db.rpc("advance_final_round", { p_room: room.id, p_player: player.id, p_token: data.token });
      if (advanceError) throw new Error("Tur kontrol edilemedi");
      advanced = !!adv;
    }
    if (advanced) {
      const { data: fresh } = await db.from("rooms").select("*").eq("id", room.id).single();
      if (fresh) room = fresh;
    }
    if (room.status === "picking" && room.team_mode === "random" && !room.random_exhausted) {
      const { data: used, error: usedError } = await db.from("picks").select("team").eq("room_id", room.id).gte("round_no", room.match_start_round).lt("round_no", room.round_no);
      if (usedError) throw new Error("Takım havuzu kontrol edilemedi");
      const { chooseSupportedPair } = await import("@/lib/football-referee.server");
      const pair = chooseSupportedPair(z.enum(["easy", "medium", "hard"]).parse(room.difficulty), (used ?? []).map(pick => pick.team));
      const { error } = await db.rpc("set_random_teams", { p_room: room.id, p_player: player.id, p_token: data.token, p_round: room.round_no, p_a: pair?.[0] ?? "", p_b: pair?.[1] ?? "" });
      if (error) throw new Error("Takımlar seçilemedi");
      const { data: fresh } = await db.from("rooms").select("*").eq("id", room.id).single();
      if (fresh) room = fresh;
    }
    const [{ data: players }, { data: attempts }, { data: myPick }, { data: submissions }, { data: usedPicks }] = await Promise.all([
      db.from("players").select("id, nickname, score, created_at").eq("room_id", room.id).order("created_at"),
      db.from("attempts").select("id, player_id, round_no, nickname, answer, correct, explanation, created_at")
        .eq("room_id", room.id).eq("round_no", room.round_no).order("created_at", { ascending: false }).order("id", { ascending: false }),
      db.from("picks").select("player_id").eq("room_id", room.id).eq("round_no", room.round_no).eq("player_id", player.id).maybeSingle(),
      db.from("answer_submissions").select("player_id, is_final, resolved").eq("room_id", room.id).eq("round_no", room.round_no),
      db.from("picks").select("team").eq("room_id", room.id).gte("round_no", room.match_start_round).lt("round_no", room.round_no),
    ]);
    if (attempts === null) throw new Error("Cevap sırası kontrol edilemedi");
    const mine = submissions?.filter((s) => s.player_id === player.id) ?? [];
    const now = Date.now();
    const allowed = room.final_deadline
      ? finalAnswerAllowed(player.id, room.final_players ?? [], room.final_deadline, mine.some((s) => s.is_final), now)
      : canAnswer(player.id, attempts);
    let history: ReturnType<typeof buildMatchSummary> = [];
    if (room.status === "finished") {
      const [{ data: rounds, error: roundsError }, { data: allAttempts, error: historyError }] = await Promise.all([
        db.from("match_rounds").select("round_no, match_start_round, team_a, team_b, winner_player_id, answer, outcome").eq("room_id", room.id).eq("match_start_round", room.match_start_round).order("round_no"),
        db.from("attempts").select("id, round_no, nickname, answer, correct, explanation, created_at").eq("room_id", room.id).gte("round_no", room.match_start_round).lte("round_no", room.round_no).order("created_at"),
      ]);
      if (roundsError || historyError) throw new Error("Maç özeti alınamadı");
      history = buildMatchSummary(rounds ?? [], allAttempts ?? [], room.match_start_round);
    }
    const { data: blocks, error: blocksError } = await db.from("game_blocks").select("blocked_id").eq("room_id", room.id).eq("blocker_id", player.id);
    if (blocksError) throw new Error("Engelleme tercihlerin okunamadı");
    const blocked = new Set((blocks ?? []).map(b => b.blocked_id));
    const safePlayers = (players ?? []).map(p => blocked.has(p.id) ? { ...p, nickname: "Engellenen oyuncu" } : p);
    const safeAttempts = attempts.filter(a => !blocked.has(a.player_id));
    if (room.round_winner_id && blocked.has(room.round_winner_id)) room = { ...room, round_answer: null };
    if (room.status === "picking") room = { ...room, team_a: null, team_b: null };
    return { room, players: safePlayers, attempts: safeAttempts, history: blocked.size ? [] : history, answerAllowed: room.status === "answering" && allowed && !mine.some((s) => !s.resolved), picked: !!myPick, usedTeams: (usedPicks ?? []).map(p => p.team), serverNow: now };
  });

export const passRound = createServerFn({ method: "POST" })
  .inputValidator((i) => auth.parse(i))
  .handler(async ({ data }) => {
    const { db, room, player } = await loadAuthed(data);
    const { data: allPassed, error } = await db.rpc("pass_round", { p_room: room.id, p_player: player.id, p_token: data.token, p_round: room.round_no });
    if (error) throw new Error(error.message);
    if (!allPassed) return { advanced: false };
    const { data: players } = await db.from("players").select("id").eq("room_id", room.id).order("created_at");
    const next = room.round_no + 1;
    const [a, b] = choosePair((players ?? []).map((p) => p.id), next);
    await db.from("rooms").update({
      status: "picking", round_no: next, chooser_a: a, chooser_b: b, team_a: null, team_b: null,
      round_winner_id: null, round_answer: null, round_suggestions: null, final_deadline: null, final_players: null, updated_at: new Date().toISOString(),
    }).eq("id", room.id).eq("round_no", room.round_no).eq("status", "answering");
    return { advanced: true };
  });

export const useManualTeams = createServerFn({ method: "POST" })
  .inputValidator(i => auth.parse(i))
  .handler(async ({ data }) => {
    const { db, room, player } = await loadAuthed(data);
    if (room.host_player_id !== player.id || room.status !== "picking" || !room.random_exhausted) throw new Error("Bu seçim şu an değiştirilemez");
    const { error } = await db.from("rooms").update({ team_mode: "manual", random_exhausted: false }).eq("id", room.id).eq("round_no", room.round_no).eq("status", "picking");
    if (error) throw new Error("Takım seçimi değiştirilemedi");
    return { ok: true };
  });
