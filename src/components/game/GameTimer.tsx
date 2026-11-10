export function GameTimer({ seconds, timeLimit, paused = false }: { seconds: number; timeLimit: 0 | 30 | 45 | 60; paused?: boolean }) {
  const progress = timeLimit === 0 ? 100 : Math.max(0, Math.min(100, (seconds / timeLimit) * 100));
  return (
    <div role="timer" aria-label={paused ? "Reloj detenido para leer el resultado" : timeLimit === 0 ? "Sin límite de tiempo" : seconds + " segundos restantes"} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-[4px] shadow-[0_0_18px_rgba(240,180,41,0.12)]" style={{ background: `conic-gradient(#f0b429 ${progress}%, rgba(240,180,41,.14) 0)` }}>
      <span className="flex h-full w-full items-center justify-center rounded-full bg-stage text-sm font-bold tabular-nums text-amber-100">
        {paused ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
            <rect x="3" y="2.5" width="3.4" height="11" rx="1.2" />
            <rect x="9.6" y="2.5" width="3.4" height="11" rx="1.2" />
          </svg>
        ) : timeLimit === 0 ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M8.5 15.5c-2 0-3.5-1.6-3.5-3.5s1.5-3.5 3.5-3.5c2.9 0 4.1 3.5 7 3.5 2 0 3.5-1.6 3.5-3.5S17.5 5 15.5 5c-2.9 0-4.1 3.5-7 3.5" transform="translate(0 3.5)" />
          </svg>
        ) : (
          seconds
        )}
      </span>
    </div>
  );
}
