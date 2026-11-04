"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, DoorOpen, ListOrdered, MessageCircleQuestion, PhoneCall, ScrollText, X } from "lucide-react";
import { MoneyLadder } from "./MoneyLadder";
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

export function GameScreen({ onFinish, onBack, timeLimit }: { onFinish: (result: GameResult) => void; onBack: () => void; timeLimit: 0 | 30 | 45 | 60 }) {
  const [game, setGame] = useState<PublicGame | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(45);
  const [reply, setReply] = useState<ActionReply | null>(null);
  const [walk, setWalk] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
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
      if (response.reveal) await new Promise(resolve => setTimeout(resolve, 2300));
      if (mounted.current) {
        accept(response.game);
        if (response.reveal) setReply(null);
      }
    } catch (actionError) {
      setError((actionError as Error).message);
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  useEffect(() => {
    if (!game || game.result || !game.deadline) return;
    const deadline = game.deadline;
    const tick = () => setSeconds(Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [game]);

  useEffect(() => {
    if (seconds === 0 && game && game.deadline && !game.result && !busy && !error) {
      const timer = setTimeout(() => void action("timeout"), 0);
      return () => clearTimeout(timer);
    }
  }, [seconds, game, busy, error]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ladderOpen) {
        setLadderOpen(false);
        return;
      }
      if (busy || reply?.hint || walk || !game) return;
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
      setReply(null);
    } catch (recoverError) {
      setError((recoverError as Error).message);
    }
  };

  if (!game) {
    return <main className="relative m-auto flex flex-col gap-5 p-8 text-center"><Crown className="mx-auto text-amber-400"/><p role="status">Preparando tu camino…</p>{error ? <p role="alert">{error}</p> : null}<button className={panelButton} onClick={() => void load()}>Reintentar</button><button className={panelButton} onClick={onBack}>Volver al menú</button></main>;
  }

  const timerProgress = Math.max(0, Math.min(100, (seconds / (game.timeLimit || 45)) * 100));
  const hostMessage = getHostMessage(game, selected, reply, walk);

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="border-b border-amber-500/15 bg-[#150d06]/78 px-4 py-3 backdrop-blur-md sm:px-7">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-display text-lg font-semibold text-amber-200 sm:text-xl"><Crown className="h-5 w-5 text-amber-400" aria-hidden="true"/>Biblionario</span>
          <div className="hidden text-center sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400/80">Pregunta {game.level} de 15</p>
            <p className="font-display text-sm text-amber-100">{formatCrowns(prizeForLevel(game.level))} <span className="font-sans text-[10px] uppercase text-amber-300/65">Coronas en juego</span></p>
          </div>
          <div className="flex items-center gap-3">
            <div role="timer" aria-label={game.timeLimit === 0 ? "Sin límite de tiempo" : seconds + " segundos restantes"} className="flex h-12 w-12 items-center justify-center rounded-full p-[4px] shadow-[0_0_18px_rgba(240,180,41,0.12)]" style={{ background: `conic-gradient(#f0b429 ${game.timeLimit === 0 ? 100 : timerProgress}%, rgba(240,180,41,.14) 0)` }}>
              <span className="flex h-full w-full items-center justify-center rounded-full bg-[#171009] text-sm font-bold tabular-nums text-amber-100">{game.timeLimit === 0 ? "∞" : seconds}</span>
            </div>
            <button type="button" disabled={busy} className="hidden items-center gap-2 rounded-lg border border-amber-500/30 px-3 py-2 text-xs text-amber-200 transition hover:border-amber-300/60 hover:bg-amber-500/10 sm:flex" onClick={() => setWalk(true)}><DoorOpen className="h-4 w-4" aria-hidden="true"/>Retirarme</button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-7 px-4 py-6 sm:px-7 lg:flex-row lg:items-stretch lg:py-8">
        <main className="flex min-w-0 flex-1 flex-col justify-center gap-5">
          {error ? <div role="alert" className="rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-red-200">{error} <button className="underline" onClick={() => void recover()}>Recuperar partida</button></div> : null}

          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="flex justify-center gap-1 sm:gap-8">
            {LIFELINES.map(({ key, label, short, icon: Icon }) => {
              const used = game.lifelines.includes(key);
              return (
                <button key={key} type="button" aria-label={label} disabled={busy || !!reply?.hint || used} onClick={() => void action(key)} className="group flex w-16 flex-col items-center gap-2 text-center disabled:cursor-not-allowed sm:w-[76px]">
                  <span className={cn("flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500/60 bg-[#1c1107] text-amber-300 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-300 group-hover:shadow-[0_0_24px_rgba(240,180,41,0.2)] sm:h-14 sm:w-14", used && "border-amber-700/25 text-amber-200/25")}>
                    {key === "fifty" ? <span className="text-xs font-black">50:50</span> : <Icon className="h-6 w-6" aria-hidden="true"/>}
                  </span>
                  <span className={cn("text-[9px] font-bold uppercase tracking-[0.12em] text-amber-300/75", used && "line-through opacity-35")}>{short}{used ? " ✓" : ""}</span>
                </button>
              );
            })}
            <button type="button" aria-label="Abrir Escalera de Coronas" aria-expanded={ladderOpen} onClick={() => setLadderOpen(true)} className="group flex w-16 flex-col items-center gap-2 text-center sm:w-[76px] lg:hidden">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-400 bg-[#1c1107] text-amber-300 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-200 group-hover:shadow-[0_0_24px_rgba(240,180,41,0.25)] sm:h-14 sm:w-14">
                <ListOrdered className="h-6 w-6" aria-hidden="true"/>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-300/90">Escalera</span>
            </button>
          </motion.div>

          <motion.div key={game.version + "-question"} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="space-y-5">
            <p className="mx-auto w-fit rounded-full border border-amber-500/30 bg-amber-500/5 px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.26em] text-amber-300">{game.question?.category}</p>
            <div className="clip-lozenge bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 p-[2px] shadow-[0_12px_38px_rgba(0,0,0,0.22)]">
              <h1 className="clip-lozenge bg-gradient-to-b from-[#2a190b] to-[#211307] px-9 py-8 text-center font-display text-xl font-semibold leading-snug text-amber-50 sm:px-14 sm:py-10 sm:text-2xl">{game.question?.question}</h1>
            </div>
          </motion.div>

          <div className="grid gap-3 md:grid-cols-2">
            {game.question?.options.map((text, index) => {
              const removed = game.removed.includes(index);
              const isSelected = selected === index;
              const isCorrectReveal = reply?.reveal?.answer === index;
              const isWrongReveal = !!reply?.reveal && isSelected && !reply.reveal.correct;
              return (
                <motion.button
                  key={index}
                  type="button"
                  disabled={busy || !!reply?.hint || walk || removed}
                  onClick={() => setSelected(index)}
                  whileHover={removed ? undefined : { scale: 1.012 }}
                  whileTap={removed ? undefined : { scale: 0.988 }}
                  aria-pressed={isSelected}
                  className={cn("clip-lozenge-md min-h-16 bg-gradient-to-r p-[2px] text-left transition-all duration-300", isSelected ? "from-amber-400 via-yellow-200 to-amber-400 glow-pulse" : "from-amber-700/75 via-amber-500/75 to-amber-700/75 hover:from-amber-500 hover:via-yellow-300 hover:to-amber-500", removed && "cursor-not-allowed opacity-25", isCorrectReveal && "from-emerald-500 via-emerald-200 to-emerald-500", isWrongReveal && "from-red-600 via-red-300 to-red-600")}
                >
                  <span className={cn("lozenge-inner clip-lozenge-md flex min-h-16 items-center gap-4 bg-[#28180a] px-7 py-3 text-amber-50", isSelected && !reply?.reveal && "state-selected", isCorrectReveal && "state-correct", isWrongReveal && "state-wrong")}>
                    <span className="flex h-8 w-8 shrink-0 rotate-45 items-center justify-center rounded-md border border-amber-500/50 bg-[#231506] text-xs font-bold text-amber-300"><span className="-rotate-45">{LETTERS[index]}</span></span>
                    <span className="text-sm font-medium sm:text-[15px]">{removed ? "—" : text}</span>
                    {isSelected && !reply?.reveal ? <Check className="ml-auto h-4 w-4 text-amber-300" aria-hidden="true"/> : null}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {selected !== null && !reply?.reveal && !reply?.hint && !walk ? (
              <motion.div key="confirm" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="flex justify-center">
                <button type="button" disabled={busy} onClick={() => void action("answer", selected)} className="clip-lozenge-slim bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-600 p-[2px] shadow-[0_0_28px_rgba(240,180,41,0.18)] transition hover:brightness-110 disabled:opacity-50">
                  <span className="clip-lozenge-slim flex items-center gap-2 bg-gradient-to-b from-[#f5c454] to-[#df9517] px-9 py-3 text-sm font-bold text-[#241708]">¿Respuesta definitiva? <span className="rounded-full bg-[#241708]/12 px-2 py-0.5">{LETTERS[selected]}</span></span>
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {reply?.hint ? (
            <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} aria-label="Consejo del comodín" className="rounded-2xl border border-amber-400/35 bg-[#211307]/92 p-6 shadow-[0_14px_45px_rgba(0,0,0,0.22)]">
              <h2 className="mb-2 font-display text-xl text-amber-200">{reply.hint.votes ? "La congregación ha hablado" : "Voz profética"}</h2>
              <p className="mb-4 text-sm text-amber-100/55">Consejo simulado del juego; puede equivocarse.{game.timeLimit ? " Tienes 10 segundos adicionales para leerlo." : ""}</p>
              {reply.hint.votes?.map((vote, index) => <div key={index} className="mb-2 flex items-center gap-3 text-sm"><span className="w-5 text-amber-300">{LETTERS[index]}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-amber-950"><span className="block h-full rounded-full bg-amber-400" style={{ width: vote + "%" }}/></span><span className="w-10 text-right">{vote}%</span></div>)}
              {reply.hint.suggestion !== undefined ? <p className="text-amber-100">Mi consejo es <strong className="text-amber-300">{LETTERS[reply.hint.suggestion]}: {game.question?.options[reply.hint.suggestion]}</strong>.</p> : null}
              <button className={panelButton + " mt-5"} onClick={() => setReply(null)}>Volver a la pregunta</button>
            </motion.section>
          ) : null}

          {walk ? (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-amber-500/40 bg-[#211307]/92 p-6 text-center">
              <p className="font-display text-xl text-amber-100">¿Retirarte con {formatCrowns(walkAwayAmount(game.level))} Coronas?</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3"><button disabled={busy} className={panelButton} onClick={() => void action("walk")}>Sí, retirarme</button><button className={panelButton} onClick={() => setWalk(false)}>Seguir jugando</button></div>
            </motion.section>
          ) : null}

          <div className="sm:hidden"><button type="button" disabled={busy} className={panelButton + " w-full"} onClick={() => setWalk(true)}><DoorOpen className="mr-2 inline h-4 w-4"/>Retirarme</button></div>

          <section aria-label="Mensaje del anfitrión" aria-live="polite" className="host-panel overflow-hidden rounded-2xl border border-amber-500/25 bg-[#150d06]/88 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,220,140,0.04)]">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.3em] text-amber-400/65">El anfitrión</p>
            <AnimatePresence mode="wait">
              <motion.p key={hostMessage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28 }} className="font-display text-sm italic leading-6 text-[#eadbc4] sm:text-[15px]">“{hostMessage}”</motion.p>
            </AnimatePresence>
          </section>
        </main>

        <aside className="hidden w-72 shrink-0 lg:block"><MoneyLadder currentLevel={game.level}/></aside>
      </div>

      <AnimatePresence>
        {ladderOpen ? (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Cerrar Escalera de Coronas" className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-[2px]" onClick={() => setLadderOpen(false)}/>
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-ladder-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="absolute inset-y-0 right-0 w-[min(88vw,360px)] overflow-y-auto border-l border-amber-500/35 bg-[#1a1007] px-4 py-4 shadow-[-22px_0_60px_rgba(0,0,0,0.55)]"
            >
              <div className="mb-1 flex items-center justify-between gap-4">
                <h2 id="mobile-ladder-title" className="flex items-center gap-2 font-display text-xl font-semibold text-amber-100"><Crown className="h-5 w-5 text-amber-400" aria-hidden="true"/>Escalera de Coronas</h2>
                <button type="button" aria-label="Cerrar" onClick={() => setLadderOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/45 text-amber-200 transition hover:bg-amber-400/10"><X className="h-5 w-5" aria-hidden="true"/></button>
              </div>
              <p className="mb-4 text-sm text-amber-200/75">Refugios seguros en las preguntas 5 y 10</p>
              <MoneyLadder currentLevel={game.level} scrollable={false} showHeader={false} className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none"/>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
