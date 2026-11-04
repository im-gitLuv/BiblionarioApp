"use client";
import { MoneyLadder } from "./MoneyLadder";
export function HowToPlay({ onBack }: {
    onBack: () => void;
}) {
    const sections = [
        ["El camino", "Responde quince preguntas bíblicas, desde lo conocido hasta los detalles más desafiantes. Cada escalón tiene su propio banco de preguntas. Las preguntas y sus opciones se eligen al azar en cada partida."],
        ["Las Coronas", "Comienzas por 100 Coronas y puedes llegar a 1.000.000. Son puntos del juego. Al acertar las preguntas 5 y 10 alcanzas refugios seguros de 1.000 y 32.000 Coronas. Si fallas antes del primer refugio, el premio es cero."],
        ["El reloj", "Tienes 45 segundos por pregunta. El servidor controla el tiempo aunque cierres la ventana. La congregación y la voz profética añaden 10 segundos para leer su consejo. Puedes retomar la partida desde el mismo navegador."],
        ["Sabiduría de Salomón · 50:50", "Elimina dos respuestas incorrectas. Puedes usarlo una vez por partida."],
        ["Preguntar a la congregación", "Muestra una votación simulada. Su precisión disminuye a medida que subes. Puedes usarlo una vez por partida."],
        ["Voz profética", "Una voz del juego ofrece un consejo simulado que puede equivocarse. Puedes usarlo una vez por partida."],
        ["Retirarte con sabiduría", "Antes de responder puedes retirarte con las Coronas del último escalón superado. Tu respuesta queda confirmada al seleccionarla; no puedes cambiarla."],
        ["Salón de la Fe", "La clasificación pública muestra la mejor partida de cada perfil. En los empates cuentan el escalón alcanzado y quién lo logró primero. Tu perfil de invitado se conserva en este navegador; todavía no hay cuentas recuperables."],
    ];
    return <main className="relative mx-auto max-w-4xl space-y-6 px-4 py-10"><button onClick={onBack} className="rounded-full border border-amber-500/40 px-5 py-3 text-amber-200">← Volver al menú</button><h1 className="font-display text-4xl text-amber-200">Cómo jugar</h1><div className="grid gap-5 md:grid-cols-2">{sections.map(([title, text]) => <section key={title} className="rounded-xl border border-amber-500/20 bg-[#1d1207]/80 p-6"><h2 className="mb-3 font-display text-xl text-amber-200">{title}</h2><p className="leading-relaxed text-[#e9dcc4]">{text}</p></section>)}</div><div className="mx-auto max-w-sm"><MoneyLadder currentLevel={1}/></div></main>;
}
