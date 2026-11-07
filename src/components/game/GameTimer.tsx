export function GameTimer({ seconds, timeLimit, paused = false }: { seconds: number; timeLimit: 0 | 30 | 45 | 60; paused?: boolean }) {
  const progress = timeLimit === 0 ? 100 : Math.max(0, Math.min(100, (seconds / timeLimit) * 100));
  return (
    <div role="timer" aria-label={paused ? "Reloj detenido para leer el resultado" : timeLimit === 0 ? "Sin límite de tiempo" : seconds + " segundos restantes"} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-[4px] shadow-[0_0_18px_rgba(240,180,41,0.12)]" style={{ background: `conic-gradient(#f0b429 ${progress}%, rgba(240,180,41,.14) 0)` }}>
      <span className="flex h-full w-full items-center justify-center rounded-full bg-[#171009] text-sm font-bold tabular-nums text-amber-100">{paused ? "Ⅱ" : timeLimit === 0 ? "∞" : seconds}</span>
    </div>
  );
}
