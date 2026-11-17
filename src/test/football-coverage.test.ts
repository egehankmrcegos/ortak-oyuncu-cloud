import { describe, expect, it, vi } from "vitest";
import { judgeWithCatalog } from "@/lib/football-referee.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const db = { from: vi.fn() } as unknown as SupabaseClient<Database>;
const cases: [string, string, string][] = [
  ["Ajax", "Inter", "ibrahimovic"],
  ["Arsenal", "Real Madrid", "adebayor"],
  ["Barcelona", "PSG", "ibrahimovic"],
  ["Galatasaray", "Inter", "sneijder"],
  ["Manchester United", "Real Madrid", "beckham"],
];
describe("popular player coverage", () => {
  for (const [a, b, p] of cases) it(`${p}: ${a} × ${b}`, async () => {
    expect((await judgeWithCatalog(db, a, b, p)).correct).toBe(true);
  });
});
