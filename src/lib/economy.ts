// ─────────────────────────────────────────────────────────────────────────────
// Economía de Siclos y racha diaria (v1.1).
// Pure and shared: the server awards with it and the tests import it directly.
// The issuance follows the progression table: escalones 1–5 pay 5 Siclos,
// 6–10 pay 10 and 11–15 pay 20, so reaching the crown is worth 175.
// Playing without a clock is Sabbath mode: half the issuance.
// The streak counts calendar days of the player (America/Caracas, UTC-4 all
// year): playing on the following day adds 1, skipping a day resets it, and
// playing twice on the same day does not duplicate it.
// ─────────────────────────────────────────────────────────────────────────────

export const PEACE_SICLOS_MULTIPLIER = 0.5;
export const STREAK_BONUS_PER_DAY = 0.05;
export const STREAK_BONUS_CAP_DAYS = 10;

export function siclosPerLevel(level: number): number {
  if (level <= 5) return 5;
  if (level <= 10) return 10;
  return 20;
}

/** Siclos base by escalones correctly answered in the partida (0–15). */
export function siclosForLevels(completed: number): number {
  const capped = Math.min(Math.max(Math.floor(completed), 0), 15);
  let total = 0;
  for (let level = 1; level <= capped; level++) total += siclosPerLevel(level);
  return total;
}

/** Bono by streak: 5% of the base per continuous day, with a cap of +50%. */
export function streakBonus(base: number, streak: number): number {
  const days = Math.min(Math.max(streak, 0), STREAK_BONUS_CAP_DAYS);
  return Math.floor(base * days * STREAK_BONUS_PER_DAY);
}

/** Calendar day YYYY-MM-DD in the player's zone (Caracas, without DST). */
export function caracasDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(date);
}

export function daysBetween(fromDay: string, toDay: string): number {
  const [fy, fm, fd] = fromDay.split("-").map(Number);
  const [ty, tm, td] = toDay.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86400000);
}

/** Streak after a completed partida: 1 if it is the first one, keeps the value
 *  if it was already played today, +1 if it was played yesterday, reset if a
 *  complete day was skipped. */
export function nextStreak(current: number, lastPlayedAt: Date | null, now: Date): number {
  if (!lastPlayedAt) return 1;
  const diff = daysBetween(caracasDay(lastPlayedAt), caracasDay(now));
  if (diff <= 0) return current;
  return diff === 1 ? current + 1 : 1;
}

/** Final issuance of a partida: base (halved in Sabbath mode) plus bonus
 *  by streak, calculated with the already updated streak of the day. */
export function awardSiclos(completed: number, isPeace: boolean, streak: number): { base: number; bonus: number; total: number } {
  const base = Math.floor(siclosForLevels(completed) * (isPeace ? PEACE_SICLOS_MULTIPLIER : 1));
  const bonus = streakBonus(base, streak);
  return { base, bonus, total: base + bonus };
}
