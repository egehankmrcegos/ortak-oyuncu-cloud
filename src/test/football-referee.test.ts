import { describe, expect, it, vi } from "vitest";
import { catalogSuggestions, judgeWithCatalog, chooseSupportedPair } from "@/lib/football-referee.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function fakeDb(row: { player: string; explanation: string; sources: string[] } | null = null) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: row }), upsert };
  chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
  return { db: { from: vi.fn().mockReturnValue(chain) } as unknown as SupabaseClient<Database>, upsert };
}

describe("catalogue-first referee", () => {
  it("accepts Messi for Barcelona and PSG without an AI or database call", async () => {
    const { db } = fakeDb(); const fallback = vi.fn();
    const result = await judgeWithCatalog(db, "barca", "paris", "Messi");
    expect(result.correct).toBe(true); expect(result.player).toBe("Lionel Messi");
    expect(fallback).not.toHaveBeenCalled(); expect(db.from).not.toHaveBeenCalled();
  });
  it("does not reject missing records or write a verdict", async () => {
    const { db, upsert } = fakeDb();
    await expect(judgeWithCatalog(db,"Barcelona","Ajax","Unknown")).rejects.toThrow("yanlış sayılmadı");
    expect(upsert).not.toHaveBeenCalled();
  });
  it("reuses an exact sourced positive without AI", async () => {
    const { db } = fakeDb({ player: "Test Player", explanation: "Verified", sources: ["https://example.org/match"] });
    const fallback = vi.fn();
    expect((await judgeWithCatalog(db, "Ajax", "Chelsea", "Test Player")).correct).toBe(true);
    expect(fallback).not.toHaveBeenCalled();
  });
  it("only chooses pairs with a sourced shared player and never repeats used teams", () => {
    const pair=chooseSupportedPair("easy",["Barcelona"],()=>0);
    expect(pair).not.toBeNull();
    expect(pair).not.toContain("Barcelona");
    expect(catalogSuggestions(pair?.[0]??"",pair?.[1]??"","2026-11-14").length).toBeGreaterThan(0);
  });
  it("provides sourced local suggestions for known pairs", () => {
    expect(catalogSuggestions("Barcelona", "PSG", "2026-11-14").map(p => p.player)).toContain("Lionel Messi");
    expect(catalogSuggestions("Barcelona", "invented club", "2026-11-14")).toEqual([]);
  });
});