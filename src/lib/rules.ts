export const LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000].map((amount, i) => ({ level: i + 1, amount, safe: i === 4 || i === 9 }));
export const TIME_PER_QUESTION = 45;
export const LETTERS = ["A", "B", "C", "D"] as const;
export function prizeForLevel(level: number) { return LADDER[Math.min(Math.max(level, 1), 15) - 1].amount; }
export function safeHavenAmount(level: number) { return level >= 11 ? 32000 : level >= 6 ? 1000 : 0; }
export function walkAwayAmount(level: number) { return level > 1 ? prizeForLevel(level - 1) : 0; }
export function formatCrowns(amount: number) { return new Intl.NumberFormat("es-VE").format(amount); }
