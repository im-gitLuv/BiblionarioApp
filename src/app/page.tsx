"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AmbientBackground } from "@/components/game/AmbientBackground";
import { MainMenu } from "@/components/game/MainMenu";
import { HowToPlay } from "@/components/game/HowToPlay";
import { HallOfFaith } from "@/components/game/HallOfFaith";
import { SettingsScreen } from "@/components/game/SettingsScreen";
import { GameScreen } from "@/components/game/GameScreen";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { api } from "@/lib/api-client";
import { STAGE_EASE } from "@/components/game/ui";
import type { GameResult, PlayerProfile, ScoreRecord } from "@/lib/contracts";
export default function Home() {
    const [screen, setScreen] = useState("menu");
    const [scores, setScores] = useState<ScoreRecord[]>([]);
    const [result, setResult] = useState<GameResult | null>(null);
    const [nameAttention, setNameAttention] = useState(0);
    const [name, setName] = useState("");
    const [profile, setProfile] = useState<{ name: string; tag: string } | null>(null);
    const [newProfile, setNewProfile] = useState(false);
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
    useEffect(() => { const timer = setTimeout(() => { void refresh(); void api<PlayerProfile>("/api/player").then(p => { setName(p.name); setProfile({ name: p.name, tag: p.tag }); }).catch(() => { }); }, 0); return () => clearTimeout(timer); }, [refresh]);
    const menu = () => { setScreen("menu"); void refresh(); };
    const hall = () => { setScreen("hall"); void refresh(); };
    const play = async () => {
        if (name.trim().length < 2) {
            setNameAttention(value => value + 1);
            return;
        }
        setBusy(true); setError(""); try {
        const saved = await api<{ name: string; tag: string }>("/api/player", { name, newProfile: newProfile || undefined });
        setProfile({ name: saved.name, tag: saved.tag });
        setNewProfile(false);
        setScreen("game");
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    // "No soy yo": dejar el perfil actual intacto y preparar uno nuevo en
    // el mismo navegador (Coronas por separado) — también sirve para empezar
    // de cero sin borrar la historia del Salón de la Fe.
    const startNewProfile = () => {
        setNewProfile(true);
        setName("");
        setNameAttention(value => value + 1);
    };
    const cancelNewProfile = () => {
        setNewProfile(false);
        setName(profile?.name ?? "");
    };
    const screenContent = screen === "menu"
        ? <MainMenu best={scores[0] ?? null} profile={profile} newProfile={newProfile} onStartNewProfile={startNewProfile} onCancelNewProfile={cancelNewProfile} name={name} onNameChange={value => { setName(value); setNameAttention(0); }} nameAttention={nameAttention} busy={busy} onPlay={() => { if (!busy) void play(); }} onHowTo={() => setScreen("howto")} onHall={hall} onSettings={() => setScreen("settings")}/>
        : screen === "settings"
            ? <SettingsScreen timeLimit={timeLimit} onTimeLimitChange={setTimeLimit} onBack={menu}/>
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
  <motion.div key={screen} className="relative z-10 flex min-h-0 flex-1 flex-col" initial={{ opacity: 0, y: 8, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -5, filter: "blur(3px)" }} transition={{ duration: 0.42, ease: STAGE_EASE }}>
   {screenContent}
  </motion.div>
 </AnimatePresence>
 </div>;
}
