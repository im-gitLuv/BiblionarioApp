"use client";

import { Crown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { LADDER, formatCrowns } from "@/lib/game-data";

interface MoneyLadderProps {
  /** The level currently being played for (1–15). */
  currentLevel: number;
  className?: string;
  /** When false, the list grows freely (e.g. inside the mobile sheet). */
  scrollable?: boolean;
  /** When false, hides the “Escalera de Coronas” header (used inside the sheet). */
  showHeader?: boolean;
}

/**
 * The 15-step prize ladder, top prize first — classic game-show style.
 * Current level glows gold; refugio seguros are marked with a shield.
 */
export function MoneyLadder({
  currentLevel,
  className,
  scrollable = true,
  showHeader = true,
}: MoneyLadderProps) {
  const rows = [...LADDER].reverse(); // 15 → 1

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-500/20 bg-panel/85 p-3 shadow-[0_0_40px_rgba(240,180,41,0.07)] backdrop-blur-sm",
        className
      )}
      role="list"
      aria-label="Escalera de Coronas"
    >
      {showHeader && (
        <div className="mb-2 flex items-center justify-center gap-2 border-b border-amber-500/15 pb-2">
          <Crown className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300/90">
            Escalera de Coronas
          </span>
        </div>
      )}
      <ol
        className={cn(
          "warm-scroll flex flex-col gap-1 pr-0.5",
          scrollable && "max-h-[62vh] overflow-y-auto"
        )}
      >
        {rows.map((step) => {
          const isCurrent = step.level === currentLevel;
          const isPassed = step.level < currentLevel;
          return (
            <li
              key={step.level}
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Escalón ${step.level}, ${formatCrowns(step.amount)} coronas${step.safe ? ", refugio seguro" : ""}${isCurrent ? ", actual" : ""}`}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm tabular-nums transition-all duration-300",
                isCurrent &&
                  "scale-[1.03] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 font-bold text-[#241708] shadow-[0_0_18px_rgba(240,180,41,0.45)]",
                !isCurrent && step.safe && "border border-amber-400/30 bg-amber-500/10",
                !isCurrent && !step.safe && "border border-transparent",
                isPassed && !step.safe && "text-amber-300/60",
                !isCurrent && !isPassed && !step.safe && "text-[#f3e8d8]/45"
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-5 text-right text-xs font-semibold",
                    isCurrent ? "text-[#241708]/80" : "text-[#c4a875]/70"
                  )}
                >
                  {step.level}
                </span>
                {isCurrent && (
                  <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {step.safe && !isCurrent && (
                  <ShieldCheck
                    className="h-3.5 w-3.5 text-amber-400/80"
                    aria-label="Refugio seguro"
                  />
                )}
              </span>
              <span className="flex items-baseline gap-1">
                {formatCrowns(step.amount)}
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wide",
                    isCurrent ? "text-[#241708]/70" : "text-[#c4a875]/60"
                  )}
                >
                  coronas
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
