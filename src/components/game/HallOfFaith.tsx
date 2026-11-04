"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Crown,
  DoorOpen,
  Skull,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatCrowns,
  type Outcome,
  type ScoreRecord,
} from "@/lib/game-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HallOfFaithProps {
  scores: ScoreRecord[];
  onBack: () => void;
}

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  if (outcome === "won")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
        <Crown className="h-3 w-3" aria-hidden="true" />
        Corona de Gloria
      </span>
    );
  if (outcome === "walked")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200/80">
        <DoorOpen className="h-3 w-3" aria-hidden="true" />
        Se retiró
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-400/25 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-200/80">
      <Skull className="h-3 w-3" aria-hidden="true" />
      Fin del camino
    </span>
  );
}

function rankStyle(rank: number): string {
  if (rank === 1) return "border-amber-400/60 bg-amber-500/20 text-amber-300";
  if (rank === 2) return "border-amber-500/30 bg-amber-500/10 text-amber-200/80";
  if (rank === 3) return "border-amber-700/40 bg-amber-700/10 text-amber-200/60";
  return "border-[#c4a875]/20 bg-transparent text-[#c4a875]/60";
}

export function HallOfFaith({ scores, onBack }: HallOfFaithProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-500/40 text-amber-300 transition-all hover:border-amber-300 hover:bg-amber-500/15"
              aria-label="Volver al menú principal"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/70">
                Quienes recorrieron el camino
              </p>
              <h1 className="font-display text-3xl font-bold text-[#f7e2b0] sm:text-4xl">
                Salón de la Fe
              </h1>
            </div>
          </div>


        </div>

        {/* List */}
        {scores.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-amber-500/25 bg-[#1d1207]/50 px-6 py-16 text-center"
          >
            <Sparkles className="h-10 w-10 text-amber-400/60" aria-hidden="true" />
            <p className="font-display text-xl italic text-[#e9dcc4]/80">
              Aún no hay nombres escritos aquí.
            </p>
            <p className="max-w-sm text-sm text-[#c4a875]">
              Completa una partida y escribe tu nombre entre quienes recorrieron el camino.
            </p>
          </motion.div>
        ) : (
          <ol className="flex flex-col gap-3">
            {scores.map((s, i) => (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.45, ease: "easeOut" }}
                className={cn(
                  "flex items-center gap-4 rounded-xl border bg-[#1d1207]/80 p-4",
                  i === 0
                    ? "border-amber-400/40 shadow-[0_0_25px_rgba(240,180,41,0.12)]"
                    : "border-amber-500/15"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold tabular-nums",
                    rankStyle(i + 1)
                  )}
                  aria-label={`Puesto ${i + 1}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-amber-200">{s.name}</p>
                  <p className="text-base font-bold tabular-nums text-amber-100">
                    {formatCrowns(s.amount)}{" "}
                    <span className="text-xs font-normal text-amber-300/70">Coronas</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#c4a875]">
                    Llegó a la pregunta {s.level} de 15 ·{" "}
                    {new Date(s.date).toLocaleDateString("es-VE", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <OutcomeBadge outcome={s.outcome} />
              </motion.li>
            ))}
          </ol>
        )}
      </main>

      <footer className="mt-auto border-t border-amber-500/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[11px] tracking-wide text-[#c4a875]/60">
          “Teniendo en derredor nuestro tan grande nube de testigos…” — Hebreos 12:1
        </p>
      </footer>
    </div>
  );
}
