import { describe, expect, it } from "vitest";
import { canAnswer, choosePair, seasonForDate, shouldRevealAnswers, parseSuggestedAnswers, FINAL_ANSWER_SECONDS, finalAnswerAllowed, finalRoundReady } from "@/lib/game-rules";

describe("Son cevap sayacı", () => {
  const deadline = "2026-11-13T20:03:05Z";
  const start = Date.parse("2026-11-13T20:03:00Z");
  it("son süre tam 5 saniyedir", () => {
    expect(FINAL_ANSWER_SECONDS).toBe(5);
    expect(Date.parse(deadline) - start).toBe(FINAL_ANSWER_SECONDS * 1000);
    expect(finalAnswerAllowed("A", ["A", "B"], deadline, false, start + 4999)).toBe(true);
    expect(finalAnswerAllowed("A", ["A", "B"], deadline, false, start + 5000)).toBe(false);
  });
  it("iki tarafa da birer son hak verir", () => {
    expect(finalAnswerAllowed("A", ["A", "B"], deadline, false, start)).toBe(true);
    expect(finalAnswerAllowed("B", ["A", "B"], deadline, false, start)).toBe(true);
    expect(finalAnswerAllowed("A", ["A", "B"], deadline, true, start)).toBe(false);
    expect(finalAnswerAllowed("C", ["A", "B"], deadline, false, start)).toBe(false);
  });
  it("ilk yanlışta değil iki son cevap tamamlanınca veya süre bitince ilerler", () => {
    expect(finalRoundReady(deadline, 1, 0, start + 1000)).toBe(false);
    expect(finalRoundReady(deadline, 2, 0, start + 1000)).toBe(true);
    expect(finalRoundReady(deadline, 0, 0, start + 5000)).toBe(true);
  });
  it("süresinde gönderilen cevap için hakemin kararını bekler", () => {
    expect(finalRoundReady(deadline, 1, 1, start + 6000)).toBe(false);
  });
});

describe("Geçilen turun doğru cevapları", () => {
  it("iki farklı oyuncu birer yanlış yaptıktan sonra cevapları açar", () => {
    expect(shouldRevealAnswers([{ player_id: "A", correct: false }, { player_id: "B", correct: false }])).toBe(true);
    expect(shouldRevealAnswers([{ player_id: "A", correct: false }, { player_id: "A", correct: false }])).toBe(false);
    expect(shouldRevealAnswers([{ player_id: "A", correct: false }, { player_id: "B", correct: true }])).toBe(false);
  });
  it("en fazla üç farklı kaynaklı cevap döndürür", () => {
    const answers = ["A", "B", "A", "C", "D"].map((player) => ({ player, explanation: "İki kulüpte oynadı", sources: ["https://example.com/career"] }));
    expect(parseSuggestedAnswers({ answers }).map((a) => a.player)).toEqual(["A", "B", "C"]);
  });
  it("kaynaksız cevap kabul etmez; hiç bulunmaması geçerlidir", () => {
    expect(() => parseSuggestedAnswers({ answers: [{ player: "A", explanation: "Kanıt yok", sources: [] }] })).toThrow();
    expect(parseSuggestedAnswers({ answers: [] })).toEqual([]);
  });
});

describe("Yanlış cevap sonrası bekleme", () => {
  it("turun ilk cevabında herkes cevap verebilir", () => {
    expect(canAnswer("A", [])).toBe(true);
    expect(canAnswer("B", [])).toBe(true);
  });
  it("yanlış cevap veren tekrar cevaplayamaz, rakibi cevaplayabilir", () => {
    const attempts = [{ player_id: "A", correct: false }];
    expect(canAnswer("A", attempts)).toBe(false);
    expect(canAnswer("B", attempts)).toBe(true);
  });
  it("rakip yanlış cevap verdiğinde önceki oyuncu açılır, rakip kilitlenir", () => {
    const attempts = [{ player_id: "B", correct: false }, { player_id: "A", correct: false }];
    expect(canAnswer("A", attempts)).toBe(true);
    expect(canAnswer("B", attempts)).toBe(false);
  });
  it("çok oyunculu odada başka oyuncunun yanlışı beklemeyi kaldırır", () => {
    expect(canAnswer("A", [{ player_id: "C", correct: false }, { player_id: "A", correct: false }])).toBe(true);
  });
  it("yeni turda önceki turdaki bekleme sürmez", () => {
    expect(canAnswer("A", [{ player_id: "A", correct: false }])).toBe(false);
    expect(canAnswer("A", [])).toBe(true);
  });
});

describe("Eşleşme sırası", () => {
  it("dört oyuncuda altı farklı çifti tamamlar, ardından döngüyü tekrarlar", () => {
    const ids = ["A", "B", "C", "D"];
    const pairs = Array.from({ length: 6 }, (_, i) => choosePair(ids, i + 1));
    expect(pairs).toEqual([["A", "D"], ["B", "C"], ["A", "C"], ["D", "B"], ["A", "B"], ["C", "D"]]);
    expect(new Set(pairs.map((p) => [...p].sort().join(""))).size).toBe(6);
    for (const id of ids) expect(pairs.filter((p) => p.includes(id))).toHaveLength(3);
    expect(choosePair(ids, 7)).toEqual(pairs[0]);
  });
  it.each([2, 3, 5, 6])("%i kişide tüm çiftleri kendisiyle eşleşmeden tamamlar", (n) => {
    const ids = Array.from({ length: n }, (_, i) => String(i));
    const count = n * (n - 1) / 2;
    const pairs = Array.from({ length: count }, (_, i) => choosePair(ids, i + 1));
    expect(new Set(pairs.map((p) => [...p].sort().join(":"))).size).toBe(count);
    for (const [a, b] of pairs) expect(a).not.toBe(b);
  });
});

describe("Güncel kadrolar", () => {
  it("Kasım 2026 için güncel sezonu 2026–2027 olarak belirler", () => {
    expect(seasonForDate("2026-11-12")).toEqual([2026, 2027]);
    expect(seasonForDate("2027-01-12")).toEqual([2026, 2027]);
  });
});
import { answerNamesPlayer } from "@/lib/game-rules";
describe("answerNamesPlayer", () => {
  it("rejects descriptions without a player name", () => {
    expect(answerNamesPlayer("KALECİ ORTAK VAR ADINI HATIRLAMIYORUM", "Denys Boyko")).toBe(false);
  });
  it("accepts typos and surnames", () => {
    expect(answerNamesPlayer("Texeria", "Alex Teixeira")).toBe(true);
    expect(answerNamesPlayer("boyko", "Denys Boyko")).toBe(true);
    expect(answerNamesPlayer("Mesut Ozil", "Mesut Özil")).toBe(true);
  });
});
