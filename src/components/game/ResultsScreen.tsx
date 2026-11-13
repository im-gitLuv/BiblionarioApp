"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";
import {
  BookOpen,
  Coins,
  Crown,
  DoorOpen,
  Flame,
  HeartHandshake,
  Home,
  RotateCcw,
} from "lucide-react";
import { GoldenConfetti } from "@/components/game/GoldenConfetti";
import { LozengeButton, fadeUp } from "@/components/game/ui";
import { formatCrowns, type GameResult } from "@/lib/game-data";

interface ResultsScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onHall: () => void;
  onMenu: () => void;
}

const VERSES: Record<GameResult["outcome"], { text: string; ref: string }> = {
  won: {
    text: "He peleado la buena batalla, he acabado la carrera, he guardado la fe. Por lo demás, me está guardada la corona de justicia.",
    ref: "2 Timoteo 4:7–8",
  },
  walked: {
    text: "El avisado ve el mal y se esconde; mas los simples pasan y reciben el daño.",
    ref: "Proverbios 22:3",
  },
  lost: {
    text: "Porque siete veces cae el justo, y vuelve a levantarse.",
    ref: "Proverbios 24:16",
  },
};

export function ResultsScreen({ result, onPlayAgain, onHall, onMenu }: ResultsScreenProps) {
  const [history, setHistory] = useState<{ totalCrowns: number; knowledgeCrowns: number; gamesPlayed: number; siclos: number; streak: number; bestStreak: number } | null>(null);
  const [historyError, setHistoryError] = useState(false);
  useEffect(() => {
    let mounted = true;
    void api<{ totalCrowns: number; knowledgeCrowns: number; gamesPlayed: number; siclos: number; streak: number; bestStreak: number }>("/api/player")
      .then(value => { if (mounted) setHistory(value); })
      .catch(() => { if (mounted) setHistoryError(true); });
    return () => { mounted = false; };
  }, []);
  const won = result.outcome === "won";
  const walked = result.outcome === "walked";

  const headline = won
    ? "¡Eres Biblionario!"
    : walked
      ? "Te retiras en paz"
      : "El camino termina aquí";

  const subline = won
    ? "Has respondido las quince preguntas: sumas un millón de Coronas a tu historial y una Corona de conocimiento por esta victoria."
    : walked
      ? `Te retiraste en la pregunta ${result.level}, conservando las Coronas ganadas.`
      : `Tu camino terminó en la pregunta ${result.level} de 15. Conservas lo ganado en el último refugio seguro.`;

  const Icon = won ? Crown : walked ? DoorOpen : HeartHandshake;

  const verse = VERSES[result.outcome];

  return (
    <div className="flex min-h-screen flex-col">
      {won && <GoldenConfetti />}

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        {/* Emblema */}
        <motion.div
          {...fadeUp(0, 10)}
          className="relative mb-7"
        >
          <div
            className="absolute inset-0 -z-10 scale-[1.9] rounded-full bg-amber-400/15 blur-2xl"
            aria-hidden="true"
          />
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full border sm:h-28 sm:w-28 ${
              won
                ? "border-amber-400/60 bg-gradient-to-b from-[#2e2010] to-[#1d1207] shadow-[0_0_50px_rgba(240,180,41,0.4)]"
                : "border-amber-500/30 bg-gradient-to-b from-[#2e2010] to-[#1d1207]"
            }`}
          >
            <Icon
              className={`h-11 w-11 sm:h-[52px] sm:w-[52px] ${
                won
                  ? "text-amber-300 drop-shadow-[0_0_16px_rgba(240,180,41,0.8)]"
                  : "text-amber-300/90"
              }`}
              aria-hidden="true"
              strokeWidth={1.5}
            />
          </div>
        </motion.div>

        {/* Titular */}
        <motion.h1
          {...fadeUp(0.12)}
          className={`font-display text-4xl font-bold leading-tight sm:text-6xl ${
            won ? "text-shimmer" : "text-[#f7e2b0]"
          }`}
        >
          {headline}
        </motion.h1>

        {/* Premio */}
        <motion.div
          {...fadeUp(0.24)}
          className="mt-6 flex flex-col items-center gap-1.5 rounded-2xl border border-amber-500/25 bg-[#1d1207]/80 px-10 py-6"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/70">
            {won ? "Premio total" : "Te llevas"}
          </p>
          <p className="font-display text-4xl font-bold tabular-nums text-amber-200 sm:text-5xl">
            {formatCrowns(result.amount)}
            <span className="ml-2 text-base font-normal text-amber-300/70">Coronas</span>
          </p>
          <p className="mt-1 text-xs text-[#c4a875]">
            {result.lifelinesUsed} de 3 comodines utilizados
          </p>
          {result.siclos > 0 ? (
            <p className="mt-2 flex items-center justify-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
              <Coins className="h-3.5 w-3.5" aria-hidden="true" />
              +{formatCrowns(result.siclos)} Siclos para tu tesoro
            </p>
          ) : null}
        </motion.div>

        {/* Historial */}
        <div aria-live="polite" className="mt-5 text-sm text-amber-200">
          {history ? <><p>Histórico: <strong>{formatCrowns(history.totalCrowns)} Coronas</strong></p><p className="mt-2 flex items-center justify-center gap-2"><Crown className="h-5 w-5 text-amber-400" aria-hidden="true"/>{history.knowledgeCrowns} {history.knowledgeCrowns === 1 ? "Corona" : "Coronas"} de conocimiento · {history.gamesPlayed} {history.gamesPlayed === 1 ? "partida" : "partidas"}</p><p className="mt-2 flex items-center justify-center gap-2"><Coins className="h-4 w-4 text-amber-400" aria-hidden="true"/>{formatCrowns(history.siclos)} Siclos{history.streak > 0 ? <> · <Flame className="h-4 w-4 text-amber-400" aria-hidden="true"/> Racha de {history.streak} {history.streak === 1 ? "día" : "días"} · Récord {history.bestStreak}</> : null}</p></> : <p>{historyError ? "Consulta tu historial en el Salón de la Sabiduría." : "Consultando tu historial…"}</p>}
        </div>
        <motion.p
          {...fadeUp(0.36)}
          className="mt-6 max-w-md text-[15px] leading-relaxed text-[#e9dcc4]/85"
        >
          {subline}
        </motion.p>

        {/* Versículo */}
        <motion.blockquote
          {...fadeUp(0.48)}
          className="mt-8 max-w-lg border-l-2 border-amber-500/40 pl-4 text-left"
        >
          <p className="font-display text-sm italic leading-relaxed text-[#e9dcc4]/75 sm:text-[15px]">
            “{verse.text}”
          </p>
          <cite className="mt-1.5 block text-xs font-semibold not-italic tracking-[0.2em] text-amber-300/70">
            {verse.ref}
          </cite>
        </motion.blockquote>

        {/* Acciones */}
        <motion.div
          {...fadeUp(0.58)}
          className="mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4"
        >
          <LozengeButton variant="primary" size="md" icon={RotateCcw} onClick={onPlayAgain} className="w-full sm:w-auto">
            Volver a jugar
          </LozengeButton>
          <LozengeButton variant="secondary" size="md" icon={BookOpen} onClick={onHall} className="w-full sm:w-auto">
            Salón de la Sabiduría
          </LozengeButton>
          <LozengeButton variant="ghost" size="sm" icon={Home} onClick={onMenu} className="w-full sm:w-auto">
            Menú principal
          </LozengeButton>
        </motion.div>
      </main>

      <footer className="mt-auto border-t border-amber-500/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[11px] tracking-wide text-[#c4a875]/60">
          “Corramos con paciencia la carrera que tenemos por delante.” — Hebreos 12:1
        </p>
      </footer>
    </div>
  );
}
