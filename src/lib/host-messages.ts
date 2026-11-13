import type { ActionReply, PublicGame } from "./contracts";
import { LETTERS, formatCrowns, walkAwayAmount } from "./rules";

// Banco editorial del anfitrión. Puedes ampliar las palabras clave o cambiar
// las frases sin tocar la lógica de la partida.
export const HOST_CATEGORY_COUNSEL = [
  { terms: ["génesis", "patriarca"], message: "Vuelve al origen de la historia y escucha bien los nombres." },
  { terms: ["evangel", "cristo"], message: "Recuerda las palabras y los pasos del Maestro." },
  { terms: ["rey", "profeta"], message: "En tiempos de reyes y profetas, cada nombre lleva una historia." },
  { terms: ["poes", "sabidur"], message: "La sabiduría suele esconderse en una palabra precisa." },
  { terms: ["apóstol", "iglesia"], message: "Piensa en quienes llevaron el mensaje más allá de Jerusalén." },
] as const;

export const HOST_PROGRESS_MESSAGES = {
  opening: "Comienza el recorrido. Lee cada palabra: a veces lo conocido esconde el primer tropiezo.",
  middle: "La escalera se estrecha. No respondas por impulso; deja que la memoria encuentre el pasaje.",
  final: "Estás cerca de la corona. Aquí cada detalle de las Escrituras puede decidir el camino.",
  fallback: "Respira, repasa el pasaje y confía en lo que has aprendido.",
  walk: "Retirarse también puede ser una decisión sabia. Mira lo que has ganado antes de elegir.",
  audience: "El Concilio de los Setenta ya ha dado su parecer. La decisión final, sin embargo, sigue siendo tuya.",
  prophet: "Has escuchado al sabio. Considera su consejo, pero recuerda que puede equivocarse.",
} as const;

function categoryCounsel(category: string) {
  const normalized = category.toLowerCase();
  return HOST_CATEGORY_COUNSEL.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.message
    ?? HOST_PROGRESS_MESSAGES.fallback;
}

export function getHostMessage(
  game: PublicGame,
  selected: number | null,
  reply: ActionReply | null,
  walk: boolean,
) {
  if (walk) {
    const amount = formatCrowns(walkAwayAmount(game.level));
    return `¿Retirarte con ${amount} Coronas? El prudente conoce cuándo descansar; el valiente decide cuándo continuar.`;
  }
  if (reply?.reveal) {
    return reply.reveal.correct
      ? `¡Correcto! La Escritura confirma el camino: ${reply.reveal.reference}.`
      : `Esta vez la corona deberá esperar. La referencia era ${reply.reveal.reference}.`;
  }
  if (reply?.hint) return reply.hint.votes ? HOST_PROGRESS_MESSAGES.audience : HOST_PROGRESS_MESSAGES.prophet;
  if (selected !== null && game.question) {
    const option = game.question.options[selected];
    // La pregunta ya está en pantalla y la confirmación en su botón:
    // el anfitrión acompaña sin repetir lo que el jugador ya está leyendo.
    return `Eliges ${LETTERS[selected]}: «${option}». ${categoryCounsel(game.question.category)}`;
  }
  if (game.level <= 5) return HOST_PROGRESS_MESSAGES.opening;
  if (game.level <= 10) return HOST_PROGRESS_MESSAGES.middle;
  return HOST_PROGRESS_MESSAGES.final;
}
