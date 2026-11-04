"use client";
import { useCallback, useEffect, useState } from "react";
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
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
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
    const play = async () => { setBusy(true); setError(""); try {
        await api("/api/player", { name });
        setScreen("game");
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    return <div className="flex min-h-screen flex-col bg-background font-sans text-foreground"><AmbientBackground />
 {error && <div role="alert" className="relative z-10 p-4 text-center text-red-300">{error} <button className="underline" onClick={() => void refresh()}>Reintentar</button></div>}
 {screen === "menu" && <><div className="relative z-10 mx-auto mt-6 flex flex-col gap-2 px-4"><label htmlFor="player">Tu nombre en el Salón de la Fe</label><input id="player" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={30} placeholder="Escribe tu nombre" className="rounded-lg border border-amber-500/40 bg-[#241709] px-4 py-2"/><small className="text-amber-200/60">Perfil de invitado guardado en este navegador. Nombre público.</small>{busy && <p role="status">Preparando tu perfil…</p>}</div><MainMenu best={scores[0] ?? null} onPlay={() => { if (!busy)
        void play(); }} onHowTo={() => setScreen("howto")} onHall={hall}/></>}
 {screen === "howto" && <HowToPlay onBack={menu}/>}
 {screen === "hall" && <HallOfFaith scores={scores} onBack={menu}/>}
 {screen === "game" && <GameScreen onBack={menu} onFinish={r => { setResult(r); setScreen("results"); void refresh(); }}/>}
 {screen === "results" && result && <ResultsScreen result={result} onMenu={menu} onHall={hall} onPlayAgain={() => setScreen("game")}/>}
 </div>;
}
