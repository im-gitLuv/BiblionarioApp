"use client";
import { useEffect, useRef, useState } from "react";
import { Crown } from "lucide-react";
import { MoneyLadder } from "./MoneyLadder";
import { api } from "@/lib/api-client";
import { LETTERS, formatCrowns, prizeForLevel, walkAwayAmount } from "@/lib/rules";
import type { ActionReply, PublicGame, GameResult } from "@/lib/contracts";
const button = "rounded-xl border border-amber-500/40 bg-[#2b1c0d] px-5 py-3 text-amber-100 transition hover:bg-amber-800/40 disabled:opacity-40";
export function GameScreen({ onFinish, onBack }: {
    onFinish: (result: GameResult) => void;
    onBack: () => void;
}) {
    const [game, setGame] = useState<PublicGame | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [seconds, setSeconds] = useState(45);
    const [reply, setReply] = useState<ActionReply | null>(null);
    const [walk, setWalk] = useState(false);
    const lock = useRef(false);
    const started = useRef(false);
    const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const accept = (g: PublicGame) => { setGame(g); if (g.result)
        onFinish(g.result); };
    const load = async () => { setError(""); try {
        accept(await api<PublicGame>("/api/games", {}));
    }
    catch (e) {
        setError((e as Error).message);
    } };
    useEffect(() => { if (!started.current) {
        started.current = true;
        void load();
    } }, []);
    const action = async (action: string, option?: number) => {
        if (!game || lock.current)
            return;
        lock.current = true;
        setBusy(true);
        setError("");
        setWalk(false);
        try {
            const response = await api<ActionReply>("/api/games/" + game.id, { version: game.version, action, option });
            setReply(response);
            if (response.reveal)
                await new Promise(resolve => setTimeout(resolve, 2500));
            if (mounted.current) {
                accept(response.game);
                if (response.reveal)
                    setReply(null);
            }
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            lock.current = false;
            if (mounted.current)
                setBusy(false);
        }
    };
    useEffect(() => {
        if (!game || game.result)
            return;
        const tick = () => setSeconds(Math.max(0, Math.ceil((new Date(game.deadline).getTime() - Date.now()) / 1000)));
        tick();
        const timer = setInterval(tick, 250);
        return () => clearInterval(timer);
    }, [game]);
    useEffect(() => { if (seconds === 0 && game && !game.result && !busy && !error) { const timer = setTimeout(() => void action("timeout"), 0); return () => clearTimeout(timer); } }, [seconds, game, busy, error]);
    useEffect(() => {
        const listener = (e: KeyboardEvent) => { if (busy || reply?.hint || walk)
            return; const index = "abcd".indexOf(e.key.toLowerCase()); if (index >= 0 && game && !game.removed.includes(index))
            void action("answer", index); };
        window.addEventListener("keydown", listener);
        return () => window.removeEventListener("keydown", listener);
    });
    const recover = async () => { if (!game) {
        await load();
        return;
    } setError(""); try {
        accept(await api<PublicGame>("/api/games/" + game.id));
        setReply(null);
    }
    catch (e) {
        setError((e as Error).message);
    } };
    if (!game)
        return <main className="relative m-auto flex flex-col gap-5 p-8 text-center"><Crown className="mx-auto text-amber-400"/><p role="status">Preparando tu camino…</p>{error && <p role="alert">{error}</p>}<button className={button} onClick={() => void load()}>Reintentar</button><button className={button} onClick={onBack}>Volver al menú</button></main>;
    return <div className="relative flex min-h-screen flex-col">
 <header className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 p-5"><span className="font-display text-xl text-amber-200">♛ Corona de Gloria</span><span>Pregunta {game.level} de 15 · {formatCrowns(prizeForLevel(game.level))} Coronas</span><span role="timer" aria-label={seconds + " segundos restantes"} className="text-xl text-amber-300">{seconds}s</span><button disabled={busy} className={button} onClick={() => setWalk(true)}>Retirarme</button></header>
 <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 sm:p-8 lg:flex-row"><main className="flex flex-1 flex-col justify-center gap-6">
 {error && <div role="alert" className="text-red-300">{error} <button className="underline" onClick={() => void recover()}>Recuperar partida</button></div>}
 <div className="flex flex-wrap justify-center gap-3">{[["fifty", "Sabiduría de Salomón · 50:50"], ["audience", "Preguntar a la congregación"], ["prophet", "Voz profética"]].map(([key, label]) => <button key={key} className={button + " text-sm"} disabled={busy || !!reply?.hint || game.lifelines.includes(key)} onClick={() => void action(key)}>{label}{game.lifelines.includes(key) ? " ✓" : ""}</button>)}</div>
 <p className="text-center text-xs uppercase tracking-widest text-amber-300">{game.question?.category}</p>
 <div className="clip-lozenge bg-gradient-to-r from-amber-700 via-yellow-400 to-amber-700 p-[2px]"><h1 className="clip-lozenge bg-[#241709] px-10 py-9 text-center font-display text-2xl text-amber-100">{game.question?.question}</h1></div>
 <div className="grid gap-4 md:grid-cols-2">{game.question?.options.map((text, i) => <button key={i} disabled={busy || !!reply?.hint || walk || game.removed.includes(i)} onClick={() => void action("answer", i)} className={button + " min-h-20 text-left " + (reply?.reveal?.answer === i ? " border-emerald-400 bg-emerald-900/60" : "")}><span className="mr-4 font-bold text-amber-300">{LETTERS[i]}</span>{game.removed.includes(i) ? "—" : text}</button>)}</div>
 {reply?.reveal && <p role="status" className="text-center text-amber-200">{reply.reveal.correct ? "¡Respuesta correcta!" : "La respuesta correcta era " + LETTERS[reply.reveal.answer] + "."} · {reply.reveal.reference}</p>}
 {reply?.hint && <section aria-label="Consejo del comodín" className="rounded-xl border border-amber-400/40 bg-[#241709] p-6"><h2 className="mb-3 font-display text-xl text-amber-200">{reply.hint.votes ? "La congregación ha hablado" : "Voz profética"}</h2><p className="mb-4 text-sm text-amber-200/70">Consejo simulado del juego; puede equivocarse. Tienes 10 segundos adicionales para leerlo.</p>{reply.hint.votes?.map((vote, i) => <p key={i}>{LETTERS[i]} · {vote}%</p>)}{reply.hint.suggestion !== undefined && <p>Mi consejo es {LETTERS[reply.hint.suggestion]}: {game.question?.options[reply.hint.suggestion]}.</p>}<button className={button + " mt-4"} onClick={() => setReply(null)}>Volver a la pregunta</button></section>}
 {walk && <section className="rounded-xl border border-amber-500/40 p-6"><p>¿Retirarte con {formatCrowns(walkAwayAmount(game.level))} Coronas?</p><div className="mt-4 flex gap-3"><button disabled={busy} className={button} onClick={() => void action("walk")}>Sí, retirarme</button><button className={button} onClick={() => setWalk(false)}>Seguir jugando</button></div></section>}
 </main><aside className="w-full lg:w-72"><MoneyLadder currentLevel={game.level}/></aside></div></div>;
}
