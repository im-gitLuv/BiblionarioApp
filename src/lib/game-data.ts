// Solo datos públicos. El banco de preguntas se consulta exclusivamente en el servidor.
export * from "./rules";
export type { GameResult, ScoreRecord, Outcome } from "./contracts";
export const SCRIPTURE_ROTATION = [
    { text: "El principio de la sabiduría es el temor de Jehová.", ref: "Proverbios 9:10" },
    { text: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.", ref: "Salmos 119:105" },
    { text: "Bienaventurado el hombre que halla la sabiduría.", ref: "Proverbios 3:13" },
];
