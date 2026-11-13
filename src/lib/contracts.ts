export type Outcome = "won" | "walked" | "lost";
export interface GameResult {
    outcome: Outcome;
    amount: number;
    level: number;
    lifelinesUsed: number;
    /** Siclos emitidos por este recorrido en total (libro contable por partida).
     *  Tras una Redención, el cierre acredita solo la diferencia pendiente. */
    siclos: number;
    /** Partida que produjo el resultado: la Redención de Jonás la reabre. */
    gameId: string;
    /** Versión al cierre: la Redención la valida para evitar dobles gastos. */
    version: number;
    /** El servidor decide si la Redención está disponible en esta derrota. */
    canRedeem: boolean;
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
    /** Cosméticos del Gazofilacio equipados por el jugador (opcional). */
    equippedMarco?: string | null;
    equippedTitulo?: string | null;
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
    /** Cosméticos equipados en el Gazofilacio. */
    equippedMarco: string | null;
    equippedTitulo: string | null;
}
export interface PublicGame {
    id: string;
    level: number;
    amount: number;
    version: number;
    siclos: number;
    /** Saldo vivo del jugador: las bendiciones se ofrendan contra él. */
    wallet: number;
    /** Bendiciones ya ofrendadas en el recorrido (lampara, sol…). */
    bendiciones: string[];
    deadline: string | null;
    timeLimit: 30 | 45 | 60 | 0;
    lifelines: string[];
    removed: number[];
    question: {
        category: string;
        question: string;
        options: string[];
        /** Solo se incluye cuando la Lámpara reveló la referencia: la
         *  instantánea privada nunca sale del servidor sin pagar. */
        reference?: string;
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
