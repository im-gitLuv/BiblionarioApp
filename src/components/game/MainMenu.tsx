"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronRight, Coins, Crown, Flame, HelpCircle, Settings, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { LozengeButton, fadeUp } from "@/components/game/ui";
import {
  SCRIPTURE_ROTATION,
  formatCrowns,
  shuffleScriptures,
  type ScoreRecord,
} from "@/lib/game-data";

interface MainMenuProps {
  best: ScoreRecord | null;
  /** Perfil guardado en este navegador (null si aún no hay ninguno). */
  profile: { name: string; tag: string } | null;
  /** Tesoro de Siclos y racha del perfil activo (null mientras se consulta). */
  wallet: { siclos: number; streak: number; bestStreak: number } | null;
  /** Modo "crear otro perfil": el nombre escrito fundará un perfil aparte. */
  newProfile: boolean;
  onStartNewProfile: () => void;
  onCancelNewProfile: () => void;
  name: string;
  onNameChange: (name: string) => void;
  /** Contador de intentos de inicio sin nombre; > 0 enciende el aviso. */
  nameAttention: number;
  busy: boolean;
  onPlay: () => void;
  onHowTo: () => void;
  onHall: () => void;
  onSettings: () => void;
}

export function MainMenu({
  best,
  profile,
  wallet,
  newProfile,
  onStartNewProfile,
  onCancelNewProfile,
  name,
  onNameChange,
  nameAttention,
  busy,
  onPlay,
  onHowTo,
  onHall,
  onSettings,
}: MainMenuProps) {
  const incomplete = nameAttention > 0 && name.trim().length < 2;
  const inputRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  // El campo vivo en su propio espacio: el aviso reutiliza la línea del texto
  // de ayuda, así que encenderlo nunca desplaza a los demás elementos.
  useEffect(() => {
    if (nameAttention > 0 && name.trim().length < 2) {
      shellRef.current?.getAnimations().forEach((animation) => {
        animation.cancel();
        animation.play();
      });
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "center",
      });
    }
     
  }, [nameAttention]);

  // La rotación de versículos conserva el comportamiento original: un mazo
  // mezclado que no repite hasta agotarse, con transición de opacidad.
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

        // Un ciclo nuevo nunca comienza con el versículo que cerró el anterior.
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
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center sm:py-10">
        {/* Emblema */}
        <motion.div {...fadeUp(0, 14)} className="float-soft relative mb-4 sm:mb-5">
          <div className="absolute inset-0 -z-10 scale-[1.8] rounded-full bg-amber-400/15 blur-2xl" aria-hidden="true" />
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/40 bg-gradient-to-b from-[#2e2010] to-[#1d1207] shadow-[0_0_45px_rgba(240,180,41,0.25)] sm:h-24 sm:w-24">
            <Crown
              className="h-10 w-10 text-amber-300 drop-shadow-[0_0_14px_rgba(240,180,41,0.7)] sm:h-12 sm:w-12"
              aria-hidden="true"
              strokeWidth={1.6}
            />
          </div>
          <Sparkles className="absolute -right-2 -top-1 h-5 w-5 text-amber-200/80" aria-hidden="true" />
          <Sparkles className="absolute -left-3 bottom-1 h-4 w-4 text-amber-200/60" aria-hidden="true" />
        </motion.div>

        {/* Sobrelínea y título */}
        <motion.p {...fadeUp(0.12)} className="mb-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-amber-300/80 sm:text-xs">
          Quién quiere ser…
        </motion.p>
        <motion.h1 {...fadeUp(0.2)} className="font-display text-shimmer text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
          Biblionario
        </motion.h1>

        {/* Divisor ornamentado */}
        <motion.div {...fadeUp(0.32)} className="mt-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/70 sm:w-24" />
          <span className="h-1.5 w-1.5 rotate-45 bg-amber-400/90" />
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/70 sm:w-24" />
        </motion.div>

        {/* Versículo en rotación: espacio reservado, solo cambia la opacidad */}
        <div className="mt-4 flex min-h-[72px] max-w-md items-center justify-center sm:mt-5">
          <AnimatePresence mode="wait">
            <motion.p
              key={verse.ref}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="font-display text-[15px] italic leading-relaxed text-[#e9dcc4]/80 sm:text-base"
            >
              “{verse.text}”
              <span className="mt-1 block text-xs font-semibold not-italic tracking-[0.2em] text-amber-300/70">
                {verse.ref}
              </span>
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Nombre del jugador — misma pieza lozenge que los botones */}
        <motion.div {...fadeUp(0.42)} className="mt-4 w-full max-w-sm">
          <label htmlFor="player" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300/70">
            {newProfile ? "Nombre del nuevo jugador" : "Tu nombre en el Salón de la Sabiduría"}
          </label>
          <div ref={shellRef} className={cn("w-full", incomplete && "name-attention")}>
            <div className="clip-lozenge-slim bg-gradient-to-r from-amber-700/60 via-amber-500/60 to-amber-700/60 p-[2px] transition-all duration-300 focus-within:from-amber-400 focus-within:via-yellow-300 focus-within:to-amber-400">
              <input
                ref={inputRef}
                id="player"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                minLength={2}
                maxLength={30}
                placeholder={newProfile ? "Escribe el nombre del nuevo perfil" : "Escribe tu nombre"}
                aria-invalid={incomplete}
                aria-describedby="player-help"
                className="clip-lozenge-slim w-full bg-gradient-to-b from-[#2b1c0d] to-[#211609] px-10 py-2.5 text-center text-[15px] text-[#f3e8d8] outline-none placeholder:text-[#c4a875]/55"
              />
            </div>
          </div>
          {/* Ranura de texto fija: el aviso sustituye a la ayuda, nunca la apila */}
          <p
            id="player-help"
            role={incomplete && !newProfile ? "alert" : undefined}
            className={cn(
              "mt-1.5 min-h-4 text-[11px] leading-4",
              incomplete && !newProfile ? "font-semibold text-amber-200" : "text-[#c4a875]/55"
            )}
          >
            {newProfile
              ? "Perfil nuevo: sus Coronas se contarán por separado de las de " + (profile ? profile.name : "tus perfiles anteriores") + "."
              : incomplete
                ? "Primero escribe tu nombre (al menos 2 caracteres) para comenzar."
                : busy
                  ? "Preparando tu perfil…"
                  : profile
                    ? `Jugando como ${profile.name} · ${profile.tag} en este navegador.`
                    : "Perfil de invitado guardado en este navegador. Nombre público."}
          </p>
          {/* Acciones de perfil: texto discreto dentro del mismo bloque */}
          {profile && !busy ? (
            <div className="min-h-5">
              {newProfile ? (
                <button
                  type="button"
                  onClick={onCancelNewProfile}
                  className="text-[11px] font-medium text-amber-300/80 underline decoration-amber-400/40 underline-offset-4 transition-colors hover:text-amber-200"
                >
                  Volver a mi perfil ({profile.name} · {profile.tag})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartNewProfile}
                  className="text-[11px] font-medium text-amber-300/80 underline decoration-amber-400/40 underline-offset-4 transition-colors hover:text-amber-200"
                >
                  ¿No eres tú? Crear otro perfil
                </button>
              )}
            </div>
          ) : null}
        </motion.div>

        {/* Acciones */}
        <motion.div {...fadeUp(0.5)} className="mt-4 flex w-full max-w-md flex-col items-center gap-3 sm:max-w-xl">
          <LozengeButton variant="primary" size="md" icon={Crown} trailing={ChevronRight} onClick={onPlay} disabled={busy} className="max-w-sm">
            {newProfile ? "Crear perfil y jugar" : "Comenzar el camino"}
          </LozengeButton>
          {/* El Salón de la Sabiduría ocupa fila propia en móvil y su ancho
              natural en escritorio: el nombre completo nunca se trunca. */}
          <div className="grid w-full max-sm:grid-cols-2 gap-3 max-sm:justify-items-stretch sm:grid-cols-[auto_auto_auto] sm:justify-center sm:gap-x-4">
            <LozengeButton variant="secondary" size="sm" icon={BookOpen} onClick={onHall} className="w-full max-sm:col-span-2 sm:w-auto sm:order-2">
              Salón de la Sabiduría
            </LozengeButton>
            <LozengeButton variant="secondary" size="sm" icon={HelpCircle} onClick={onHowTo} className="w-full sm:w-auto sm:order-1">
              Cómo jugar
            </LozengeButton>
            <LozengeButton variant="secondary" size="sm" icon={Settings} onClick={onSettings} className="w-full sm:w-auto sm:order-3">
              Configuración
            </LozengeButton>
          </div>
        </motion.div>

        {/* Líder histórico */}
        {best ? (
          <motion.div {...fadeUp(0.58)} className="mt-5 flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-200">
            <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>
              Líder histórico: <strong className="font-semibold">{formatCrowns(best.amount)} Coronas · ♛ {best.knowledgeCrowns}</strong>
            </span>
          </motion.div>
        ) : null}

        {/* Tesoro del perfil: Siclos ganados y racha diaria vigente */}
        {wallet ? (
          <motion.div {...fadeUp(0.64)} className="mt-3 flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-200">
            <Coins className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span><strong className="font-semibold">{formatCrowns(wallet.siclos)}</strong> Siclos</span>
            <span className="text-amber-300/40" aria-hidden="true">·</span>
            <Flame className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>{wallet.streak > 0 ? <>Racha de <strong className="font-semibold">{wallet.streak}</strong> {wallet.streak === 1 ? "día" : "días"}</> : "Aún sin racha"}</span>
          </motion.div>
        ) : null}
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
