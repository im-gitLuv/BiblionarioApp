"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Crown,
  DoorOpen,
  Skull,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RoundIconButton, StageHeading, fadeUp } from "@/components/game/ui";
import { AvatarFrame } from "./AvatarFrame";
import { storeItem } from "@/lib/store";
import {
  formatCrowns,
  type Outcome,
  type ScoreRecord,
} from "@/lib/game-data";

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
  // Nombres repetidos en la clasificación: su etiqueta de perfil los
  // distingue ("Luis · 3F7A" frente a "Luis · 9B1C").
  const repeated = new Map<string, number>();
  for (const s of scores)
    repeated.set(s.name, (repeated.get(s.name) ?? 0) + 1);
  const isRepeated = (s: ScoreRecord) => (repeated.get(s.name) ?? 0) > 1;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <RoundIconButton icon={ArrowLeft} label="Volver al menú principal" onClick={onBack} />
          <StageHeading overline="Quienes recorrieron el camino" title="Salón de la Sabiduría" shimmer={false} />
        </div>

        <p className="mb-6 text-sm leading-relaxed text-amber-100/70">Clasificación por Coronas históricas: se suman los premios de todas tus partidas terminadas. Cada victoria de 15 preguntas concede una Corona de conocimiento. Los premios parciales suman al total, pero no conceden esa distinción. Si dos nombres coinciden, su etiqueta de perfil los distingue.</p>
        {/* List */}
        {scores.length === 0 ? (
          <motion.div
            {...fadeUp(0, 12)}
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
                {...fadeUp(Math.min(i * 0.05, 0.4), 10)}
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
                  <p className="flex items-center gap-1.5 text-sm text-amber-200">
                    {s.equippedMarco ? <AvatarFrame name={s.name} marco={s.equippedMarco} className="h-6 w-6 text-[9px]" /> : null}
                    <span className="truncate">{s.name}</span>
                    {isRepeated(s) && (
                      <span
                        className="inline-block shrink-0 rounded border border-amber-500/25 bg-amber-500/10 px-1 py-px align-baseline font-mono text-[10px] font-semibold tracking-wider text-amber-300/70"
                        title={`Perfil ${s.tag}`}
                      >
                        {s.tag}
                      </span>
                    )}
                    {s.equippedTitulo ? (
                      <span
                        className="hidden shrink-0 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-px text-[10px] font-semibold text-amber-300 sm:inline"
                        title="Título del Gazofilacio"
                      >
                        «{storeItem(s.equippedTitulo)?.name ?? s.equippedTitulo}»
                      </span>
                    ) : null}
                  </p>
                  <p className="text-base font-bold tabular-nums text-amber-100">
                    {formatCrowns(s.amount)}{" "}
                    <span className="text-xs font-normal text-amber-300/70">Coronas históricas</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#c4a875]">
                    {s.gamesPlayed} {s.gamesPlayed === 1 ? "partida" : "partidas"} · Máximo escalón {s.level}/15 ·{" "}
                    {new Date(s.date).toLocaleDateString("es-VE", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-300" title="Una Corona de conocimiento por cada partida ganada de 15 preguntas"><Crown className="h-4 w-4" aria-hidden="true"/>{s.knowledgeCrowns} <span className="hidden sm:inline">de conocimiento</span></span>
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
