"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, DoorOpen, ListOrdered, MessageCircleQuestion, PhoneCall, ScrollText, X } from "lucide-react";
import { MoneyLadder } from "./MoneyLadder";
import { GameTimer } from "./GameTimer";
import { LozengeButton } from "@/components/game/ui";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { LETTERS, formatCrowns, prizeForLevel, walkAwayAmount } from "@/lib/rules";
import { getHostMessage } from "@/lib/host-messages";
import type { ActionReply, PublicGame, GameResult } from "@/lib/contracts";

const LIFELINES = [
  { key: "fifty", label: "Los Dos Testigos", short: "Testigos", icon: ScrollText },
  { key: "audience", label: "Concilio de los Setenta", short: "Concilio", icon: MessageCircleQuestion },
  { key: "prophet", label: "Consejo de un Sabio", short: "Sabio", icon: PhoneCall },
] as const;
type Lifeline = typeof LIFELINES[number]['key'];
const LIFELINE_INVITATIONS = {
  fifty: "Los Dos Testigos apartarán dos respuestas falsas para dejarte dos declaraciones: por boca de dos testigos se decide el asunto, y solo una es verdadera. ¿Quieres usar este comodín?",
  audience: "Podemos reunir al Concilio de los Setenta para que vote por la respuesta que considera correcta. Su consejo puede equivocarse. ¿Quieres usar este comodín?",
  prophet: "El Consejo de un Sabio te dará una sugerencia para esta pregunta, aunque puede equivocarse. ¿Quieres usar este comodín?",
};

/** Movimiento contenido para el interior de los contenedores reservados:
    solo opacidad y una elevación mínima; el contenedor nunca cambia de tamaño. */
const swap = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: 0.18 } },
  transition: { duration: 0.24, ease: "easeOut" as const },
};

export function GameScreen({ onFinish, onBack, timeLimit }: { onFinish: (result: GameResult) => void; onBack: () => void; timeLimit: 0 | 30 | 45 | 60 }) {
  const [game, setGame] = useState<PublicGame | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(45);
  const [reply, setReply] = useState<ActionReply | null>(null);
  const [walk, setWalk] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [chosenLifeline, setChosenLifeline] = useState<Lifeline | null>(null);
  const [lifelineModal, setLifelineModal] = useState<Exclude<Lifeline, "fifty"> | null>(null);
  const [ladderOpen, setLadderOpen] = useState(false);
  const hostPanel = useRef<HTMLElement>(null);
  const questionPanel = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const started = useRef(false);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    if (!ladderOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [ladderOpen]);

  useEffect(() => {
    if (chosenLifeline) hostPanel.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
  }, [chosenLifeline]);

  const accept = (nextGame: PublicGame) => {
    // Partida terminada: pasar directo a Resultados sin tocar el estado
    // interno. Reanimar los interiores (pregunta, mensaje del anfitrión, pie)
    // en el mismo commit que inicia la salida de la pantalla completa puede
    // trabar la transición de framer-motion; los interiores deben quedar
    // estables mientras la pantalla sale — el mismo patrón de la vía «Ver
    // resultado», que llega a Resultados desde un clic posterior.
    if (nextGame.result) {
      onFinish(nextGame.result);
      return;
    }
    setGame(nextGame);
    setSelected(null);
    setReply(nextGame.review ? { game: nextGame, reveal: nextGame.review } : null);
  };

  const load = async () => {
    setError("");
    try {
      accept(await api<PublicGame>("/api/games", { timeLimit }));
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  };

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void load();
    }
     
  }, []);

  const action = async (actionName: string, option?: number) => {
    if (!game || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setWalk(false);
    if (actionName !== "answer") setSelected(null);
    try {
      const response = await api<ActionReply>("/api/games/" + game.id, { version: game.version, action: actionName, option });
      setReply(response);
      if (mounted.current) {
        setChosenLifeline(null);
        if (response.reveal) {
          setLifelineModal(null);
          if (!response.game.result) setGame(response.game);
        } else {
          accept(response.game);
          // Con la partida terminada se omite este setReply: los interiores
          // permanecen estables mientras la pantalla completa sale hacia
          // Resultados (véase accept).
          if (!response.game.result) setReply(response);
          if (actionName === "audience" || actionName === "prophet") setLifelineModal(actionName);
          if (actionName === "fifty") questionPanel.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
        }
      }
    } catch (actionError) {
      setError((actionError as Error).message);
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  useEffect(() => {
    if (!game || game.result || reply?.reveal || !game.deadline) return;
    const deadline = game.deadline;
    const tick = () => setSeconds(Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [game, reply?.reveal]);

  useEffect(() => {
    if (seconds === 0 && game && game.deadline && !game.result && !busy && !error && !reply?.reveal && Date.now() >= new Date(game.deadline).getTime()) {
      const timer = setTimeout(() => void action("timeout"), 0);
      return () => clearTimeout(timer);
    }
     
  }, [seconds, game, busy, error, reply?.reveal]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ladderOpen) {
        setLadderOpen(false);
        return;
      }
      if (event.target instanceof HTMLElement && event.target.closest("button, input, [role=dialog]")) return;
      if (busy || reply?.reveal || lifelineModal || chosenLifeline || walk || !game) return;
      const index = "abcd".indexOf(event.key.toLowerCase());
      if (index >= 0 && !game.removed.includes(index)) setSelected(index);
      if (event.key === "Enter" && selected !== null) void action("answer", selected);
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  const recover = async () => {
    if (!game) {
      await load();
      return;
    }
    setError("");
    try {
      accept(await api<PublicGame>("/api/games/" + game.id));
      setChosenLifeline(null);
      setLifelineModal(null);
    } catch (recoverError) {
      setError((recoverError as Error).message);
    }
  };

  if (!game) {
    return (
      <main className="relative m-auto flex flex-col items-center gap-5 p-8 text-center">
        <Crown className="text-amber-400" aria-hidden="true" />
        <p role="status">Preparando tu camino…</p>
        {error ? <p role="alert" className="max-w-sm text-red-300">{error}</p> : null}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <LozengeButton variant="primary" size="sm" onClick={() => void load()}>Reintentar</LozengeButton>
          <LozengeButton variant="secondary" size="sm" onClick={onBack}>Volver al menú</LozengeButton>
        </div>
      </main>
    );
  }

  const hostMessage = chosenLifeline ? LIFELINE_INVITATIONS[chosenLifeline] : getHostMessage(game, selected, reply, walk);
  const reveal = reply?.reveal;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      {/* ── Cabecera: marca · pregunta y premio · reloj y retirada ── */}
      <header className="flex-none border-b border-amber-500/15 bg-stage-deep/78 px-3 py-2 backdrop-blur-md sm:px-7 sm:py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3">
          <span className="flex items-center gap-2 font-display text-lg font-semibold text-amber-200 sm:text-xl">
            <Crown className="h-5 w-5 text-amber-400" aria-hidden="true" />Biblionario
          </span>
          <div className="hidden text-center sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400/80">Pregunta {game.level} de 15</p>
            <p className="font-display text-sm text-amber-100">{formatCrowns(prizeForLevel(game.level))} <span className="font-sans text-[10px] uppercase text-amber-300/65">Coronas en juego</span></p>
          </div>
          <div className="text-center sm:hidden">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Pregunta {game.level} de 15</p>
            <p className="font-display text-xs text-amber-100">{formatCrowns(prizeForLevel(game.level))} Coronas</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <GameTimer seconds={seconds} timeLimit={game.timeLimit} paused={!!reply?.reveal} />
            <button type="button" aria-label="Abrir Escalera de Coronas" aria-expanded={ladderOpen} aria-controls="mobile-ladder" onClick={() => setLadderOpen(true)} className="-mr-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/35 text-amber-300 transition hover:border-amber-300 hover:bg-amber-500/10 sm:mr-0 lg:hidden">
              <ListOrdered className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" disabled={busy || !!reply?.reveal} className="hidden items-center gap-2 rounded-lg border border-amber-500/30 px-3 py-2 text-xs text-amber-200 transition hover:border-amber-300/60 hover:bg-amber-500/10 sm:flex" onClick={() => setWalk(true)}>
              <DoorOpen className="h-4 w-4" aria-hidden="true" />Retirarme
            </button>
          </div>
        </div>
      </header>

      {/* ── Cuerpo: escenario + escalera de escritorio ── */}
      <div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 gap-6 px-3 py-3 sm:px-7 sm:py-5 lg:gap-8">
        <main className="game-board flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Zona de juego: cada bloque vive en su propio espacio */}
          <section className="warm-scroll flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-y-auto sm:gap-4" aria-label="Pregunta">
            <motion.div {...swap} className="flex flex-none justify-center gap-2 sm:gap-8" aria-label="Comodines">
              {LIFELINES.map(({ key, label, short, icon: Icon }) => {
                const used = game.lifelines.includes(key);
                return (
                  <button key={key} type="button" aria-label={label} aria-pressed={chosenLifeline === key} disabled={busy || !!reply?.reveal || !!lifelineModal || used} onClick={() => { setChosenLifeline(key); setSelected(null); setWalk(false); }} className="group flex w-16 flex-none flex-col items-center gap-1.5 text-center disabled:cursor-not-allowed sm:w-[76px]">
                    <span className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500/60 bg-panel-mid text-amber-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-amber-300 group-hover:shadow-[0_0_24px_rgba(240,180,41,0.2)] sm:h-14 sm:w-14",
                      chosenLifeline === key && "glow-pulse border-yellow-200 shadow-[0_0_32px_rgba(252,211,77,0.65)]",
                      used && "border-amber-700/25 text-amber-200/25"
                    )}>
                      {key === "fifty" ? <span className="text-xs font-black">50:50</span> : <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />}
                    </span>
                    <span className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300/75", used && "text-amber-300/35")}>
                      {short}
                      {used ? <Check className="h-3 w-3" aria-label="Ya utilizado" /> : null}
                    </span>
                  </button>
                );
              })}
            </motion.div>

            <motion.div ref={questionPanel} key={game.version + "-question"} {...swap} className="flex-none space-y-2.5 sm:space-y-3">
              <p className="mx-auto w-fit rounded-full border border-amber-500/30 bg-amber-500/5 px-5 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-amber-300">{game.question?.category}</p>
              <div className="clip-lozenge bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 p-[2px] shadow-[0_12px_38px_rgba(0,0,0,0.22)]">
                <h1 className="clip-lozenge bg-gradient-to-b from-panel-raised to-panel-soft px-7 py-5 text-center font-display text-lg font-semibold leading-snug text-amber-50 sm:px-14 sm:py-9 sm:text-2xl">{game.question?.question}</h1>
              </div>
            </motion.div>

            <div role="group" aria-label="Opciones de respuesta" className="game-answers grid flex-none grid-cols-2 gap-2.5 sm:gap-3">
              {game.question?.options.map((text, index) => {
                const removed = game.removed.includes(index);
                const isSelected = selected === index;
                const isCorrectReveal = reveal?.answer === index;
                const isWrongReveal = !!reveal && isSelected && !reveal.correct;
                return (
                  <motion.button
                    key={index}
                    type="button"
                    disabled={busy || !!reply?.reveal || !!lifelineModal || !!chosenLifeline || walk || removed}
                    onClick={() => setSelected(index)}
                    whileHover={removed ? undefined : { scale: 1.012 }}
                    whileTap={removed ? undefined : { scale: 0.988 }}
                    aria-pressed={isSelected}
                    className={cn("clip-lozenge-md min-h-14 bg-gradient-to-r p-[2px] text-left transition-all duration-300 sm:min-h-16", isSelected ? "from-amber-400 via-yellow-200 to-amber-400 glow-pulse" : "from-amber-700/75 via-amber-500/75 to-amber-700/75 hover:from-amber-500 hover:via-yellow-300 hover:to-amber-500", removed && "cursor-not-allowed opacity-25", isCorrectReveal && "from-emerald-500 via-emerald-200 to-emerald-500", isWrongReveal && "from-red-600 via-red-300 to-red-600")}
                  >
                    <span className={cn("lozenge-inner clip-lozenge-md flex min-h-14 items-center gap-2.5 bg-[#28180a] px-3.5 py-2 text-amber-50 sm:min-h-16 sm:gap-4 sm:px-7 sm:py-3", isSelected && !reply?.reveal && "state-selected", isCorrectReveal && "state-correct", isWrongReveal && "state-wrong")}>
                      <span className="flex h-7 w-7 shrink-0 rotate-45 items-center justify-center rounded-md border border-amber-500/50 bg-[#231506] text-[10px] font-bold text-amber-300 sm:h-8 sm:w-8 sm:text-xs"><span className="-rotate-45">{LETTERS[index]}</span></span>
                      <span className="text-[13px] font-medium leading-snug sm:text-[15px]">{removed ? "—" : text}</span>
                      {isSelected && !reply?.reveal ? <Check className="ml-auto hidden h-4 w-4 shrink-0 text-amber-300 sm:block" aria-hidden="true" /> : null}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* ── Base fija del escenario: el anfitrión y la zona de acción.
              Ninguna aparición cambia estas alturas, así que nada rueda. ── */}
          <section ref={hostPanel} aria-label="Mensaje del anfitrión" aria-live="polite" className="host-panel mt-2 flex-none rounded-2xl border border-amber-500/25 bg-stage-deep/88 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,220,140,0.04)] sm:px-5 sm:py-2.5">
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-amber-400/65">El anfitrión</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={error ? "error" : hostMessage}
                {...swap}
                className={cn("font-display text-[13px] italic leading-5 text-[#eadbc4] line-clamp-3 min-h-[3.75rem] sm:text-[15px] sm:leading-6 sm:line-clamp-2 sm:min-h-12", error && "not-italic text-red-300")}
              >
                {error ? (
                  <>
                    {error}{" "}
                    <button type="button" className="underline underline-offset-2" onClick={() => void recover()}>
                      {game ? "Recuperar partida" : "Reintentar"}
                    </button>
                  </>
                ) : (
                  `“${hostMessage}”`
                )}
              </motion.p>
            </AnimatePresence>
          </section>

          <div className="mt-2 flex-none pb-[max(0px,env(safe-area-inset-bottom))]">
            <div className="relative h-14 sm:h-16" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                {reply?.reveal ? (
                  <motion.div key="reveal" {...swap} className="absolute inset-0 flex items-center justify-between gap-2 sm:gap-4">
                    <div className="min-w-0 flex-1 rounded-2xl border border-amber-400/35 bg-panel-soft/95 px-3.5 py-1.5 sm:px-5 sm:py-2">
                      <p className={cn("truncate font-display text-sm sm:text-base", reply.reveal.correct ? "text-emerald-300" : "text-amber-200")}>
                        {reply.reveal.correct ? "¡Respuesta correcta!" : `La correcta era ${LETTERS[reply.reveal.answer]}`}
                      </p>
                      <p className="truncate text-xs text-amber-200/70">Referencia: {reply.reveal.reference}</p>
                    </div>
                    <LozengeButton variant="primary" size="sm" disabled={busy} aria-label={reply.game.result ? undefined : "Siguiente pregunta"} className="w-auto flex-none" onClick={() => { if (reply.game.result) onFinish(reply.game.result); else void action("next"); }}>
                      {reply.game.result ? "Ver resultado" : (
                        <>
                          <span className="sm:hidden">Siguiente</span>
                          <span className="hidden sm:inline">Siguiente pregunta</span>
                        </>
                      )}
                    </LozengeButton>
                  </motion.div>
                ) : walk ? (
                  <motion.div key="walk" {...swap} className="absolute inset-0 flex items-center justify-center gap-2 sm:gap-3">
                    <LozengeButton variant="primary" size="sm" icon={DoorOpen} disabled={busy} onClick={() => void action("walk")}>Sí, retirarme</LozengeButton>
                    <LozengeButton variant="secondary" size="sm" onClick={() => setWalk(false)}>Seguir jugando</LozengeButton>
                  </motion.div>
                ) : chosenLifeline ? (
                  <motion.div key="lifeline" {...swap} className="absolute inset-0 flex items-center justify-center gap-2 sm:gap-3">
                    <LozengeButton variant="primary" size="sm" disabled={busy} onClick={() => void action(chosenLifeline)}>Usar comodín</LozengeButton>
                    <LozengeButton variant="secondary" size="sm" disabled={busy} onClick={() => setChosenLifeline(null)}>Cancelar</LozengeButton>
                  </motion.div>
                ) : selected !== null ? (
                  <motion.div key="confirm" {...swap} className="absolute inset-0 flex items-center justify-center">
                    <LozengeButton variant="primary" size="sm" disabled={busy} onClick={() => void action("answer", selected)}>
                      ¿Respuesta definitiva?
                      <span className="ml-1 rounded-full bg-ink/15 px-2 py-0.5">{LETTERS[selected]}</span>
                    </LozengeButton>
                  </motion.div>
                ) : (
                  <motion.div key="idle" {...swap} className="absolute inset-0 flex items-center justify-center sm:hidden">
                    <LozengeButton variant="secondary" size="sm" icon={DoorOpen} disabled={busy || !!reply?.reveal} onClick={() => setWalk(true)}>Retirarme</LozengeButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 lg:block"><MoneyLadder currentLevel={game.level} /></aside>
      </div>

      <Dialog.Root open={!!lifelineModal} onOpenChange={open => { if (!open) { setLifelineModal(null); setReply(null); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-amber-400/50 bg-panel-soft p-5 text-amber-100 shadow-[0_0_60px_rgba(240,180,41,0.18)] sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <Dialog.Title className="font-display text-xl text-amber-200">{lifelineModal === "audience" ? "El Concilio ha hablado" : "Consejo de un Sabio"}</Dialog.Title>
              <GameTimer seconds={seconds} timeLimit={game.timeLimit} />
            </div>
            <Dialog.Description className="mb-5 text-sm leading-6 text-amber-100/65">Consejo simulado del juego; puede equivocarse.{game.timeLimit ? " Tienes 10 segundos adicionales para leerlo." : ""}</Dialog.Description>
            {reply?.hint?.votes?.map((vote, index) => <div key={index} className="mb-4 space-y-1"><p className="text-sm">{LETTERS[index]}: {game.question?.options[index]}</p><div className="flex items-center gap-3"><span className="h-2 flex-1 overflow-hidden rounded-full bg-amber-950"><span className="block h-full rounded-full bg-amber-400 transition-[width] duration-700" style={{ width: vote + "%" }} /></span><span className="w-10 text-right text-sm">{vote}%</span></div></div>)}
            {reply?.hint?.suggestion !== undefined ? <p className="rounded-xl border border-amber-500/30 p-4">Mi consejo es <strong className="text-amber-300">{LETTERS[reply.hint.suggestion]}: {game.question?.options[reply.hint.suggestion]}</strong>.</p> : null}
            <Dialog.Close asChild><LozengeButton variant="secondary" size="sm" className="mt-5 w-full">Volver a la pregunta</LozengeButton></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AnimatePresence>
        {ladderOpen ? (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Cerrar Escalera de Coronas" className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-[2px]" onClick={() => setLadderOpen(false)} />
            <motion.aside
              id="mobile-ladder"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-ladder-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="absolute inset-y-0 right-0 w-[min(calc(100vw-3rem),360px)] border-l border-amber-500/35 bg-panel-mid shadow-[-22px_0_60px_rgba(0,0,0,0.55)]"
            >
              <div className="h-full overflow-y-auto px-4 py-4">
                <div className="mb-1 flex items-center justify-between gap-4">
                  <h2 id="mobile-ladder-title" className="flex items-center gap-2 font-display text-xl font-semibold text-amber-100"><Crown className="h-5 w-5 text-amber-400" aria-hidden="true" />Escalera de Coronas</h2>
                  <button type="button" aria-label="Cerrar" onClick={() => setLadderOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/45 text-amber-200 transition hover:bg-amber-400/10"><X className="h-5 w-5" aria-hidden="true" /></button>
                </div>
                <p className="mb-4 text-sm text-amber-200/75">Refugios seguros en las preguntas 5 y 10</p>
                <MoneyLadder currentLevel={game.level} scrollable={false} showHeader={false} className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none" />
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
