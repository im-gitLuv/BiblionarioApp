"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AmbientBackground } from "@/components/game/AmbientBackground";
import { MainMenu } from "@/components/game/MainMenu";
import { HowToPlay } from "@/components/game/HowToPlay";
import { HallOfFaith } from "@/components/game/HallOfFaith";
import { GameScreen } from "@/components/game/GameScreen";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { api } from "@/lib/api-client";
import type { GameResult, ScoreRecord } from "@/lib/contracts";
export default function Home() {
    const [screen, setScreen] = useState("menu");
    const [scores, setScores] = useState<ScoreRecord[]>([]);
    const [result, setResult] = useState<GameResult | null>(null);
    const nameInput = useRef<HTMLInputElement>(null);
    const [nameAttention, setNameAttention] = useState(0);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [timeLimit, setTimeLimit] = useState<0 | 30 | 45 | 60>(45);
    const refresh = useCallback(async () => { try {
        setScores(await api<ScoreRecord[]>("/api/leaderboard"));
        setError("");
    }
    catch (e) {
        setError((e as Error).message);
    } }, []);
    useEffect(() => { const timer = setTimeout(() => { void refresh(); void api<{
        name: string;
    }>("/api/player").then(p => setName(p.name)).catch(() => { }); }, 0); return () => clearTimeout(timer); }, [refresh]);
    const menu = () => { setScreen("menu"); void refresh(); };
    const hall = () => { setScreen("hall"); void refresh(); };
    const play = async () => {
        if (name.trim().length < 2) {
            setNameAttention(value => value + 1);
            nameInput.current?.getAnimations().forEach(animation => { animation.cancel(); animation.play(); });
            nameInput.current?.focus({ preventScroll: true });
            nameInput.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
            return;
        }
        setBusy(true); setError(""); try {
        await api("/api/player", { name });
        setScreen("game");
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    const screenContent = screen === "menu"
        ? <><div className="relative z-10 mx-auto mt-6 flex w-full max-w-sm flex-col gap-2 px-4"><label htmlFor="player" className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300/70">Tu nombre en el Salón de la Fe</label><input ref={nameInput} aria-invalid={nameAttention > 0 && name.trim().length < 2} aria-describedby={nameAttention ? "player-help" : undefined} id="player" value={name} onChange={e => { setName(e.target.value); setNameAttention(0); }} minLength={2} maxLength={30} placeholder="Escribe tu nombre" className={`${nameAttention ? "name-attention " : ""}rounded-xl border border-amber-500/30 bg-[#1a1007]/85 px-4 py-2.5 text-sm shadow-[inset_0_0_18px_rgba(240,180,41,0.04)] outline-none transition focus:border-amber-300/70 focus:ring-2 focus:ring-amber-400/10`}/>{nameAttention > 0 ? <p id="player-help" role="alert" className="text-sm font-semibold text-amber-200">Primero escribe tu nombre (al menos 2 caracteres) para comenzar.</p> : null}<small className="text-[11px] text-amber-100/45">Perfil de invitado guardado en este navegador. Nombre público.</small>{busy ? <p role="status" className="text-xs text-amber-300">Preparando tu perfil…</p> : null}</div><MainMenu best={scores[0] ?? null} onPlay={() => { if (!busy) void play(); }} onHowTo={() => setScreen("howto")} onHall={hall} onSettings={() => setScreen("settings")}/></>
        : screen === "settings"
            ? <main className="m-auto w-full max-w-md px-5 py-12"><button type="button" onClick={menu} className="mb-6 text-amber-300">← Volver al menú</button><h1 className="font-display text-4xl text-amber-100">Configuración</h1><fieldset className="mt-8 rounded-2xl border border-amber-500/30 bg-[#1d1207]/85 p-6"><legend className="px-2 text-sm font-semibold text-amber-300">Tiempo por pregunta</legend><div className="grid grid-cols-2 gap-3">{([30,45,60,0] as const).map(value => <label key={value} className={`cursor-pointer rounded-xl border px-4 py-4 text-center text-sm ${timeLimit === value ? "border-amber-400 bg-amber-500/20 text-amber-100" : "border-amber-500/25 text-amber-200/70"}`}><input type="radio" name="timeLimit" value={value} checked={timeLimit === value} onChange={() => setTimeLimit(value)} className="sr-only"/>{value === 0 ? "Sin límite" : value === 60 ? "1 minuto" : `${value} segundos`}</label>)}</div><p className="mt-4 text-xs leading-5 text-amber-100/65">La elección se aplica a una partida nueva. Una partida ya iniciada conserva su configuración.</p></fieldset><button type="button" onClick={menu} className="mt-6 w-full rounded-xl bg-amber-400 px-5 py-3 font-bold text-[#241708]">Listo</button></main>
        : screen === "howto"
            ? <HowToPlay onBack={menu}/>
            : screen === "hall"
                ? <HallOfFaith scores={scores} onBack={menu}/>
                : screen === "game"
                    ? <GameScreen timeLimit={timeLimit} onBack={menu} onFinish={r => { setResult(r); setScreen("results"); void refresh(); }}/>
                    : result
                        ? <ResultsScreen result={result} onMenu={menu} onHall={hall} onPlayAgain={() => setScreen("game")}/>
                        : null;
    return <div className="flex min-h-screen flex-col overflow-x-hidden bg-background font-sans text-foreground"><AmbientBackground />
 {error && <div role="alert" className="relative z-10 p-4 text-center text-red-300">{error} <button className="underline" onClick={() => void refresh()}>Reintentar</button></div>}
 <AnimatePresence mode="wait" initial={false}>
  <motion.div key={screen} className="relative z-10 flex min-h-0 flex-1 flex-col" initial={{ opacity: 0, y: 8, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -5, filter: "blur(3px)" }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
   {screenContent}
  </motion.div>
 </AnimatePresence>
 </div>;
}
