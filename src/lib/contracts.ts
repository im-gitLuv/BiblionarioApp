export type Outcome = "won" | "walked" | "lost";
export interface GameResult {
    outcome: Outcome;
    amount: number;
    level: number;
    lifelinesUsed: number;
    /** Siclos emitidos por esta partida (libro contable por partida). */
    siclos: number;
}
export interface ScoreRecord {
    knowledgeCrowns: number;
    gamesPlayed: number;
    id: string;
    name: string;
    tag: string;
    amount: number;
    level: number;
    outcome: Outcome;
    date: string;
}
export interface PlayerProfile {
    name: string;
    tag: string;
    totalCrowns: number;
    knowledgeCrowns: number;
    gamesPlayed: number;
    /** Tesoro de Siclos del perfil y racha diaria vigente. */
    siclos: number;
    streak: number;
    bestStreak: number;
}
export interface PublicGame {
    id: string;
    level: number;
    amount: number;
    version: number;
    siclos: number;
    deadline: string | null;
    timeLimit: 30 | 45 | 60 | 0;
    lifelines: string[];
    removed: number[];
    question: {
        category: string;
        question: string;
        options: string[];
    } | null;
    review?: ActionReply['reveal'];
    result: GameResult | null;
}
export interface ActionReply {
    game: PublicGame;
    reveal?: {
        answer: number;
        reference: string;
        correct: boolean;
    };
    hint?: {
        votes?: number[];
        suggestion?: number;
    };
}
