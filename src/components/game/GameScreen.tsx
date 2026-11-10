"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, DoorOpen, ListOrdered, MessageCircleQuestion, PhoneCall, ScrollText, X } from "lucide-react";
import { MoneyLadder } from "./MoneyLadder";
import { GameTimer } from "./GameTimer";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { LETTERS, formatCrowns, prizeForLevel, walkAwayAmount } from "@/lib/rules";
import { getHostMessage } from "@/lib/host-messages";
import type { ActionReply, PublicGame, GameResult } from "@/lib/contracts";

const panelButton = "rounded-xl border border-amber-500/35 bg-[#211407] px-5 py-3 text-sm text-amber-100 transition-all duration-300 hover:border-amber-300/60 hover:bg-amber-800/25 disabled:cursor-not-allowed disabled:opacity-40";

const LIFELINES = [
  { key: "fifty", label: "Sabiduría", short: "50:50", icon: ScrollText },
  { key: "audience", label: "Congregación", short: "Asamblea", icon: MessageCircleQuestion },
  { key: "prophet", label: "Voz profética", short: "Profeta", icon: PhoneCall },
] as const;
type Lifeline = typeof LIFELINES[number]['key'];
const LIFELINE_INVITATIONS = {
  fifty: "La Sabiduría de Salomón apartará dos respuestas incorrectas para dejarte dos caminos. ¿Quieres usar este comodín?",
  audience: "Podemos pedir a la congregación que vote por la respuesta que considera correcta. Su consejo puede equivocarse. ¿Quieres usar este comodín?",
  prophet: "La voz profética te dará una sugerencia para esta pregunta, aunque puede equivocarse. ¿Quieres usar este comodín?",
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

  const accept = (nextGame: PublicGame) => {
    setGame(nextGame);
    setSelected(null);
    setReply(nextGame.review ? { game: nextGame, reveal: nextGame.review } : null);
    if (nextGame.result) onFinish(nextGame.result);
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
          setReply(response);
          if (actionName === "audience" || actionName === "prophet") setLifelineModal(actionName);
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
      if (busy || error || reply?.reveal || lifelineModal || chosenLifeline || ladderOpen || walk || !game) return;
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

  const reveal = reply?.reveal;
  const question = game?.question;
  const hostMessage = chosenLifeline ? LIFELINE_INVITATIONS[chosenLifeline] : game ? getHostMessage(game, selected, reply, walk) : "";
  const canConfirm = selected !== null && !reveal && !lifelineModal && !chosenLifeline && !walk;

  return (
    <div className="game-screen relative flex min-h-dvh flex-col">
      <header className="border-b border-amber-500/15 bg-[#150d06]/78 px-3 py-1.5 backdrop-blur-md sm:px-7 sm:py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3">
          <span className="flex items-center gap-2 font-display text-sm font-semibold text-amber-200 sm:text-xl"><Crown className="hidden h-5 w-5 text-amber-400 sm:block" aria-hidden="true"/>Biblionario</span>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400/80 sm:tracking-[0.3em]">Pregunta {game?.level ?? "–"} de 15</p>
            <p className="font-display text-sm text-amber-100">{game ? formatCrowns(prizeForLevel(game.level)) : "–"} <span className="font-sans text-[9px] uppercase text-amber-300/65">Coronas<span className="hidden sm:inline"> en juego</span></span></p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <GameTimer seconds={game ? seconds : timeLimit} timeLimit={game?.timeLimit ?? timeLimit} paused={!!reveal}/>
            <button type="button" aria-label="Retirarme" disabled={!game || busy || !!reveal} className="flex h-11 items-center rounded-lg border border-amber-500/30 px-2.5 text-xs text-amber-200 transition hover:border-amber-300/60 hover:bg-amber-500/10 disabled:opacity-40 sm:h-auto sm:gap-2 sm:px-3 sm:py-2" onClick={() => setWalk(true)}><DoorOpen className="h-4 w-4" aria-hidden="true"/><span className="hidden sm:inline">Retirarme</span></button>
          </div>
        </div>
      </header>

      {!ladderOpen ? <button type="button" aria-label="Abrir Escalera de Coronas" aria-expanded={false} aria-controls="mobile-ladder" disabled={!game} onClick={() => setLadderOpen(true)} className="fixed right-0 game-ladder-tab z-40 flex h-16 w-12 flex-col items-center justify-center gap-1 rounded-l-xl border border-r-0 border-amber-400/65 bg-[#1a1007] text-amber-300 shadow-[-4px_0_18px_rgba(0,0,0,0.35)] transition hover:bg-[#30200c] focus-visible:outline-2 focus-visible:outline-amber-200 lg:hidden"><ListOrdered className="h-6 w-6" aria-hidden="true"/><span className="text-[8px] font-bold uppercase tracking-wide">Escalera</span></button> : null}

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-7 px-2.5 py-2 sm:px-7 sm:py-5 lg:flex-row lg:items-stretch lg:py-6">
        <main className="game-board grid min-w-0 flex-1">
          <div className="game-lifelines flex items-center justify-center gap-1 sm:gap-8">
            {LIFELINES.map(({ key, label, short, icon: Icon }) => {
              const used = game?.lifelines.includes(key);
              return (
                <button key={key} type="button" aria-label={label} aria-pressed={chosenLifeline === key} disabled={!game || busy || !!reveal || !!lifelineModal || !!error || used} onClick={() => { setChosenLifeline(key); setSelected(null); setWalk(false); }} className="group flex w-16 flex-col items-center gap-1 sm:gap-2 text-center disabled:cursor-not-allowed sm:w-[76px]">
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-500/60 bg-[#1c1107] text-amber-300 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-300 group-hover:shadow-[0_0_24px_rgba(240,180,41,0.2)] sm:h-14 sm:w-14", chosenLifeline === key && "glow-pulse border-yellow-200 shadow-[0_0_32px_rgba(252,211,77,0.65)]", used && "border-amber-700/25 text-amber-200/25")}>
                    {key === "fifty" ? <span className="text-xs font-black">50:50</span> : <Icon className="h-6 w-6" aria-hidden="true"/>}
                  </span>
                  <span className={cn("text-[9px] font-bold uppercase tracking-[0.12em] text-amber-300/75", used && "line-through opacity-35")}>{short}{used ? " ✓" : ""}</span>
                </button>
              );
            })}
          </div>

          <div className="game-question grid min-w-0">
            <p className="mx-auto flex h-6 w-fit max-w-full items-center rounded-full border border-amber-500/30 bg-amber-500/5 px-4 text-[10px] font-bold uppercase tracking-[0.26em] text-amber-300"><span className="truncate" title={question?.category}>{question?.category ?? "Pregunta"}</span></p>
            <div className="clip-lozenge min-h-0 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 p-[2px]">
              <h1 className="clip-lozenge grid h-full min-h-0 place-items-center bg-gradient-to-b from-[#2a190b] to-[#211307] px-5 text-center font-display text-base font-semibold leading-snug text-amber-50 sm:px-12 sm:text-2xl">
                <span key={game?.level ?? "loading"} role={question ? undefined : "status"} className="game-prompt-text fade-in-place min-h-0 min-w-0 max-h-full max-w-full overflow-y-auto wrap-anywhere">{question?.question ?? "Preparando tu camino."}</span>
              </h1>
            </div>
          </div>

          <div role="group" aria-label="Opciones de respuesta" className="game-answers grid min-w-0 grid-cols-2">
            {LETTERS.map((letter, index) => {
              const option = question?.options[index];
              const removed = game?.removed.includes(index);
              const isSelected = selected === index;
              const isCorrectReveal = reply?.reveal?.answer === index;
              const isWrongReveal = !!reply?.reveal && isSelected && !reply.reveal.correct;
              return (
                <motion.button
                  key={index}
                  type="button"
                  disabled={!option || busy || !!reveal || !!lifelineModal || !!chosenLifeline || walk || !!error || removed}
                  onClick={() => setSelected(index)}
                  whileHover={removed ? undefined : { scale: 1.012 }}
                  whileTap={removed ? undefined : { scale: 0.988 }}
                  aria-pressed={isSelected}
                  className={cn("clip-lozenge-md min-w-0 bg-gradient-to-r p-[2px] text-left transition-colors duration-300", isSelected ? "from-amber-400 via-yellow-200 to-amber-400 glow-pulse" : "from-amber-700/75 via-amber-500/75 to-amber-700/75 hover:from-amber-500 hover:via-yellow-300 hover:to-amber-500", removed && "cursor-not-allowed opacity-25", isCorrectReveal && "from-emerald-500 via-emerald-200 to-emerald-500", isWrongReveal && "from-red-600 via-red-300 to-red-600")}
                >
                  <span className={cn("lozenge-inner clip-lozenge-md relative flex h-full items-center gap-2 bg-[#28180a] px-3.5 text-amber-50 sm:gap-4 sm:px-7", isSelected && !reply?.reveal && "state-selected", isCorrectReveal && "state-correct", isWrongReveal && "state-wrong")}>
                    <span className="flex h-5 w-5 shrink-0 rotate-45 sm:h-8 sm:w-8 items-center justify-center rounded-md border border-amber-500/50 bg-[#231506] text-xs font-bold text-amber-300"><span className="-rotate-45">{letter}</span></span>
                    <span key={game?.level ?? "loading"} className="game-option-text fade-in-place min-w-0 max-h-full overflow-y-auto wrap-anywhere text-xs font-medium leading-tight sm:text-[15px]">{removed ? "–" : option ?? "…"}</span>
                    {isSelected && !reveal ? <Check className="absolute right-2 top-1 h-3 w-3 text-amber-300 sm:right-5 sm:top-2" aria-hidden="true"/> : null}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="game-context host-panel rounded-2xl border border-amber-500/25 bg-[#150d06]/88 px-3 py-2 sm:px-5 sm:py-3">
            {error ? (
              <p role="alert" className="fade-in-place text-sm text-red-200">{error}</p>
            ) : reveal ? (
              <section aria-label="Resultado de la pregunta" aria-live="polite" className="fade-in-place text-center">
                <h2 className="font-display text-base text-amber-200 sm:text-xl">{reveal.correct ? "¡Respuesta correcta!" : "La respuesta correcta era:"}</h2>
                <p className="mt-1 text-xs text-amber-100 sm:text-sm">{LETTERS[reveal.answer]}: {question?.options[reveal.answer]}</p>
                <p className="mt-1 text-xs text-amber-200/75 sm:text-sm">Referencia: {reveal.reference}</p>
              </section>
            ) : (
              <section aria-label="Mensaje del anfitrión" aria-live="polite">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.3em] text-amber-400/65">El anfitrión</p>
                {hostMessage && <p key={hostMessage} className="fade-in-place font-display text-sm italic leading-[1.25] text-[#eadbc4] sm:text-[15px] sm:leading-5">"{hostMessage}"</p>}
                {walk && game && <p className="fade-in-place mt-1 text-sm font-bold text-amber-100">¿Retirarte con {formatCrowns(walkAwayAmount(game.level))} Coronas?</p>}
              </section>
            )}
          </div>

          <div className="game-actions flex min-w-0 items-center justify-center gap-2">
            {error || !game ? (
              <>
                {error && <button type="button" className={panelButton} onClick={() => void recover()}>{game ? "Recuperar partida" : "Reintentar"}</button>}
                <button type="button" className={panelButton} onClick={onBack}>Volver al menú</button>
              </>
            ) : reveal && reply ? (
              <button key="next" type="button" disabled={busy} className={panelButton + " fade-in-place border-amber-300 bg-amber-500/20 font-bold"} onClick={() => { if (reply.game.result) onFinish(reply.game.result); else void action("next"); }}>
                {reply.game.result ? "Ver resultado" : "Siguiente pregunta"}
              </button>
            ) : walk ? (
              <div className="fade-in-place flex justify-center gap-2">
                <button type="button" disabled={busy} className={panelButton} onClick={() => void action("walk")}>Sí, retirarme</button>
                <button type="button" className={panelButton} onClick={() => setWalk(false)}>Seguir jugando</button>
              </div>
            ) : chosenLifeline ? (
              <div className="fade-in-place flex justify-center gap-2">
                <button type="button" disabled={busy} className={panelButton + " border-amber-300 bg-amber-500/20"} onClick={() => void action(chosenLifeline)}>Usar comodín</button>
                <button type="button" disabled={busy} className={panelButton} onClick={() => setChosenLifeline(null)}>Cancelar</button>
              </div>
            ) : canConfirm ? (
              <button key="confirm" type="button" disabled={busy} onClick={() => void action("answer", selected)} className="fade-in-place clip-lozenge-slim bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-600 p-[2px] transition hover:brightness-110 disabled:opacity-50">
                <span className="clip-lozenge-slim flex items-center gap-2 bg-gradient-to-b from-[#f5c454] to-[#df9517] px-7 py-2.5 text-sm font-bold text-[#241708]">¿Respuesta definitiva? <span className="rounded-full bg-[#241708]/12 px-2 py-0.5">{LETTERS[selected]}</span></span>
              </button>
            ) : null}
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 lg:block"><MoneyLadder currentLevel={game?.level ?? 0}/></aside>
      </div>


      <Dialog.Root open={!!lifelineModal} onOpenChange={open => { if (!open) { setLifelineModal(null); setReply(null); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fade-in-place fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
          <Dialog.Content className="fade-in-place fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-amber-400/50 bg-[#211307] p-5 text-amber-100 shadow-[0_0_60px_rgba(240,180,41,0.18)] sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <Dialog.Title className="font-display text-xl text-amber-200">{lifelineModal === "audience" ? "La congregación ha hablado" : "Voz profética"}</Dialog.Title>
              <GameTimer seconds={seconds} timeLimit={game?.timeLimit ?? timeLimit}/>
            </div>
            <Dialog.Description className="mb-5 text-sm leading-6 text-amber-100/65">Consejo simulado del juego; puede equivocarse.{game?.timeLimit ? " Tienes 10 segundos adicionales para leerlo." : ""}</Dialog.Description>
            {reply?.hint?.votes?.map((vote, index) => <div key={index} className="mb-4 space-y-1"><p className="text-sm">{LETTERS[index]}: {question?.options[index]}</p><div className="flex items-center gap-3"><span className="h-2 flex-1 overflow-hidden rounded-full bg-amber-950"><span className="block h-full rounded-full bg-amber-400" style={{ width: vote + "%" }}/></span><span className="w-10 text-right text-sm">{vote}%</span></div></div>)}
            {reply?.hint?.suggestion !== undefined ? <p className="rounded-xl border border-amber-500/30 p-4">Mi consejo es <strong className="text-amber-300">{LETTERS[reply.hint.suggestion]}: {question?.options[reply.hint.suggestion]}</strong>.</p> : null}
            <Dialog.Close asChild><button type="button" className={panelButton + " mt-5 w-full"}>Volver a la pregunta</button></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AnimatePresence>
        {ladderOpen ? (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Cerrar Escalera de Coronas" className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-[2px]" onClick={() => setLadderOpen(false)}/>
            <motion.aside
              id="mobile-ladder"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-ladder-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="absolute inset-y-0 right-0 w-[min(calc(100vw-3rem),360px)] border-l border-amber-500/35 bg-[#1a1007] shadow-[-22px_0_60px_rgba(0,0,0,0.55)]"
            >
              <button type="button" aria-label="Cerrar pestaña de Escalera" aria-expanded={true} aria-controls="mobile-ladder" onClick={() => setLadderOpen(false)} className="absolute -left-12 game-ladder-tab flex h-16 w-12 flex-col items-center justify-center gap-1 rounded-l-xl border border-r-0 border-amber-400/65 bg-[#1a1007] text-amber-300 shadow-[-4px_0_18px_rgba(0,0,0,0.35)] transition hover:bg-[#30200c] focus-visible:outline-2 focus-visible:outline-amber-200"><ListOrdered className="h-6 w-6" aria-hidden="true"/><span className="text-[8px] font-bold uppercase tracking-wide">Escalera</span></button>
              <div className="h-full overflow-y-auto px-4 py-4">
              <div className="mb-1 flex items-center justify-between gap-4">
                <h2 id="mobile-ladder-title" className="flex items-center gap-2 font-display text-xl font-semibold text-amber-100"><Crown className="h-5 w-5 text-amber-400" aria-hidden="true"/>Escalera de Coronas</h2>
                <button type="button" aria-label="Cerrar" onClick={() => setLadderOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/45 text-amber-200 transition hover:bg-amber-400/10"><X className="h-5 w-5" aria-hidden="true"/></button>
              </div>
              <p className="mb-4 text-sm text-amber-200/75">Refugios seguros en las preguntas 5 y 10</p>
              <MoneyLadder currentLevel={game?.level ?? 0} scrollable={false} showHeader={false} className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none"/>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
