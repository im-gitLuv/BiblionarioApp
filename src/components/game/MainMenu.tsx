"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Sparkles, Trophy, BookOpen, HelpCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SCRIPTURE_ROTATION,
  formatCrowns,
  shuffleScriptures,
  type ScoreRecord,
} from "@/lib/game-data";

interface MainMenuProps {
  best: ScoreRecord | null;
  onPlay: () => void;
  onHowTo: () => void;
  onHall: () => void;
}

/** Lozenge-shaped menu button, gold CTA or outlined secondary. */
function MenuButton({
  label,
  icon: Icon,
  variant = "secondary",
  onClick,
  delay = 0,
}: {
  label: string;
  icon: React.ElementType;
  variant?: "primary" | "secondary";
  onClick: () => void;
  delay?: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: "easeOut" }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group w-full sm:w-96",
        variant === "primary" ? "glow-pulse" : ""
      )}
    >
      <div
        className={cn(
          "clip-lozenge-slim p-[2px] transition-all duration-300",
          variant === "primary"
            ? "bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-600"
            : "bg-gradient-to-r from-amber-700/70 via-amber-500/70 to-amber-700/70 group-hover:from-amber-500 group-hover:via-yellow-300 group-hover:to-amber-500"
        )}
      >
        <div
          className={cn(
            "clip-lozenge-slim flex items-center justify-center gap-2.5 px-10 py-3.5",
            variant === "primary"
              ? "bg-gradient-to-b from-[#f6c453] to-[#e8a020] text-[#241708]"
              : "bg-gradient-to-b from-[#2b1c0d] to-[#211609] text-[#f3e8d8] group-hover:from-[#3a2612]"
          )}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span className="text-[15px] font-semibold tracking-wide">{label}</span>
          <ChevronRight
            className="h-4 w-4 shrink-0 opacity-60 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </div>
      </div>
    </motion.button>
  );
}

export function MainMenu({ best, onPlay, onHowTo, onHall }: MainMenuProps) {
  // The fixed first value keeps server/client rendering identical. Once mounted,
  // the effect replaces it with a shuffled deck and walks that deck without repeats.
  const [verse, setVerse] = useState(SCRIPTURE_ROTATION[0]);

  useEffect(() => {
    let deck = shuffleScriptures();
    let cursor = 0;
    const firstFrame = requestAnimationFrame(() => setVerse(deck[cursor]));

    const t = setInterval(() => {
      const previousRef = deck[cursor].ref;
      cursor += 1;

      if (cursor >= deck.length) {
        deck = shuffleScriptures();
        cursor = 0;

        // A new cycle should never begin with the verse that ended the last one.
        if (deck.length > 1 && deck[0].ref === previousRef) {
          [deck[0], deck[1]] = [deck[1], deck[0]];
        }
      }

      setVerse(deck[cursor]);
    }, 9000);
    return () => {
      cancelAnimationFrame(firstFrame);
      clearInterval(t);
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        {/* Emblem */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="float-soft relative mb-6"
        >
          <div className="absolute inset-0 -z-10 scale-[1.8] rounded-full bg-amber-400/15 blur-2xl" aria-hidden="true" />
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-amber-400/40 bg-gradient-to-b from-[#2e2010] to-[#1d1207] shadow-[0_0_45px_rgba(240,180,41,0.25)] sm:h-28 sm:w-28">
            <Crown
              className="h-12 w-12 text-amber-300 drop-shadow-[0_0_14px_rgba(240,180,41,0.7)] sm:h-14 sm:w-14"
              aria-hidden="true"
              strokeWidth={1.6}
            />
          </div>
          <Sparkles
            className="absolute -right-2 -top-1 h-5 w-5 text-amber-200/80"
            aria-hidden="true"
          />
          <Sparkles
            className="absolute -left-3 bottom-1 h-4 w-4 text-amber-200/60"
            aria-hidden="true"
          />
        </motion.div>

        {/* Overline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55 }}
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.4em] text-amber-300/80 sm:text-xs"
        >
          Un recorrido por las Escrituras
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.65 }}
          className="font-display text-shimmer text-5xl font-bold leading-tight tracking-tight sm:text-7xl"
        >
          Corona de Gloria
        </motion.h1>

        {/* Ornamental divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-5 flex items-center gap-3"
          aria-hidden="true"
        >
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/70 sm:w-24" />
          <span className="h-1.5 w-1.5 rotate-45 bg-amber-400/90" />
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/70 sm:w-24" />
        </motion.div>

        {/* Rotating verse */}
        <div className="mt-6 flex min-h-24 max-w-md items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={verse.ref}
              initial={{ opacity: 0, y: 9, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -7, filter: "blur(4px)" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="font-display text-[15px] italic leading-relaxed text-[#e9dcc4]/80 sm:text-base"
            >
              “{verse.text}”
              <span className="mt-1 block text-xs font-semibold not-italic tracking-[0.2em] text-amber-300/70">
                {verse.ref}
              </span>
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Best score */}
        {best && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-6 flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-200"
          >
            <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>
              Mejor marca global: <strong className="font-semibold">{formatCrowns(best.amount)} Coronas</strong>
            </span>
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-10 flex w-full flex-col items-center gap-3.5 sm:gap-4">
          <MenuButton label="Comenzar el camino" icon={Crown} variant="primary" onClick={onPlay} delay={0.55} />
          <MenuButton label="Cómo jugar" icon={HelpCircle} onClick={onHowTo} delay={0.68} />
          <MenuButton label="Salón de la Fe" icon={BookOpen} onClick={onHall} delay={0.81} />
        </div>
      </main>

      <footer className="mt-auto border-t border-amber-500/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[11px] tracking-wide text-[#c4a875]/60">
          15 preguntas · 3 comodines · 1.000.000 de Coronas — inspirado en{" "}
          <em>¿Quién quiere ser millonario?</em>
        </p>
      </footer>
    </div>
  );
}
