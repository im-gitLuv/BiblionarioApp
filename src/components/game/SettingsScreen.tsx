"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LozengeButton, RoundIconButton, StageHeading, fadeUp } from "@/components/game/ui";

interface SettingsScreenProps {
  timeLimit: 0 | 30 | 45 | 60;
  onTimeLimitChange: (value: 0 | 30 | 45 | 60) => void;
  onBack: () => void;
}

const TIME_OPTIONS: Array<{ value: 0 | 30 | 45 | 60; label: string; hint: string }> = [
  { value: 30, label: "30 segundos", hint: "Ritmo ágil" },
  { value: 45, label: "45 segundos", hint: "Recomendado" },
  { value: 60, label: "1 minuto", hint: "Reflexivo" },
  { value: 0, label: "Sin límite", hint: "A tu paso" },
];

export function SettingsScreen({ timeLimit, onTimeLimitChange, onBack }: SettingsScreenProps) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-8 sm:py-10">
      <motion.header {...fadeUp(0)} className="mb-8 flex items-center gap-4">
        <RoundIconButton icon={ArrowLeft} label="Volver al menú" onClick={onBack} />
        <StageHeading overline="Ajustes del recorrido" title="Configuración" shimmer={false} />
      </motion.header>

      <motion.section {...fadeUp(0.1)} className="rounded-2xl border border-amber-600/35 bg-panel/85 p-6 shadow-[inset_0_1px_0_rgba(255,220,140,0.03)] backdrop-blur-sm sm:p-7">
        <h2 className="mb-1 text-base font-bold text-amber-200">El reloj</h2>
        <p className="mb-5 text-sm leading-6 text-[#eadbc4]/80">
          Tiempo para responder cada pregunta. La elección se aplica a una partida nueva; una partida ya iniciada conserva su configuración.
        </p>
        <div role="radiogroup" aria-label="Tiempo por pregunta" className="grid grid-cols-2 gap-3">
          {TIME_OPTIONS.map(({ value, label, hint }) => {
            const selected = timeLimit === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onTimeLimitChange(value)}
                className="clip-lozenge-slim group text-left"
              >
                <span
                  className={cn(
                    "clip-lozenge-slim flex flex-col gap-0.5 px-6 py-3 transition-colors duration-300",
                    selected
                      ? "state-gold"
                      : "bg-gradient-to-b from-[#2b1c0d] to-[#211609] text-amber-200/75 group-hover:from-[#3a2612]"
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                    {label}
                  </span>
                  <span className={cn("text-[10px] font-medium uppercase tracking-[0.18em]", selected ? "text-ink/70" : "text-[#c4a875]/60")}>
                    {hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </motion.section>

      <motion.div {...fadeUp(0.2)} className="mt-6 flex justify-center">
        <LozengeButton variant="primary" size="md" onClick={onBack} className="w-full max-w-xs">
          Listo
        </LozengeButton>
      </motion.div>
    </main>
  );
}
