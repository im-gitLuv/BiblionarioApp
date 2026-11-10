"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  CircleHelp,
  DoorOpen,
  Hourglass,
  MessageCircleQuestion,
  PhoneCall,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { MoneyLadder } from "./MoneyLadder";
import { RoundIconButton, StageHeading, fadeUp } from "@/components/game/ui";

interface GuideCard {
  title: string;
  icon: LucideIcon;
  paragraphs: React.ReactNode[];
}

const GUIDE_CARDS: GuideCard[] = [
  {
    title: "El camino",
    icon: ScrollText,
    paragraphs: [
      <>Quince preguntas recorren las Escrituras, desde Génesis hasta Apocalipsis. Cada respuesta correcta te acerca a la <strong>Corona del conocimiento y al premio de 1.000.000 de Coronas</strong>.</>,
      <>La dificultad aumenta con cada escalón. Primero eliges una opción y después confirmas tu <strong>respuesta definitiva</strong>. Después podrás leer el resultado y la referencia con calma antes de pulsar <strong>Siguiente pregunta</strong>.</>,
    ],
  },
  {
    title: "Refugios seguros",
    icon: ShieldCheck,
    paragraphs: [
      <>Dos escalones son <strong>refugios seguros</strong>: 1.000 Coronas en la pregunta 5 y 32.000 Coronas en la pregunta 10.</>,
      <>Si fallas después de un refugio, conservas ese premio. Antes del primero, una respuesta incorrecta devuelve el premio a cero.</>,
    ],
  },
  {
    title: "El reloj",
    icon: Hourglass,
    paragraphs: [
      <>En Configuración puedes elegir <strong>30 segundos, 45 segundos, un minuto o sin límite</strong> por pregunta. Si el reloj se agota, la ronda termina como una respuesta incorrecta.</>,
      <>Con reloj, la congregación y la voz profética añaden 10 segundos para escuchar el consejo.</>,
    ],
  },
  {
    title: "Retirarse con sabiduría",
    icon: DoorOpen,
    paragraphs: [
      <>Antes de confirmar una respuesta puedes <strong>retirarte</strong> con las Coronas que ya hayas ganado.</>,
      <>El prudente conoce cuándo descansar; el valiente decide cuándo continuar hacia la corona.</>,
    ],
  },
];

const LIFELINES = [
  { title: "Sabiduría de Salomón", icon: ScrollText, text: "Dos respuestas incorrectas desaparecen y quedan solamente dos caminos." },
  { title: "Preguntar a la congregación", icon: MessageCircleQuestion, text: "La asamblea vota; su certeza puede disminuir en las preguntas más difíciles." },
  { title: "Voz profética", icon: PhoneCall, text: "Una voz del juego ofrece su consejo. Puede ser sabia, pero también puede equivocarse." },
] as const;

export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <motion.header {...fadeUp(0)} className="mb-8 flex items-center gap-4">
        <RoundIconButton icon={ArrowLeft} label="Volver al menú" onClick={onBack} />
        <StageHeading overline="Antes de comenzar" title="Cómo jugar" />
      </motion.header>

      <div className="grid gap-5 md:grid-cols-2">
        {GUIDE_CARDS.map(({ title, icon: Icon, paragraphs }, index) => (
          <motion.section key={title} {...fadeUp(0.08 + index * 0.08, 14)} className="group rounded-2xl border border-amber-600/35 bg-[#1b1007]/80 p-6 shadow-[inset_0_1px_0_rgba(255,220,140,0.03)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/45 hover:shadow-[0_14px_45px_rgba(0,0,0,0.18)] sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/45 bg-amber-500/5 text-amber-300 transition group-hover:bg-amber-500/10 group-hover:shadow-[0_0_18px_rgba(240,180,41,0.12)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-base font-bold text-amber-200">{title}</h2>
            </div>
            <div className="space-y-3.5 text-[15px] leading-6 text-[#eadbc4]/90">
              {paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
            </div>
          </motion.section>
        ))}
      </div>

      <motion.section {...fadeUp(0.44, 14)} className="mt-5 rounded-2xl border border-amber-600/35 bg-[#1b1007]/80 p-6 shadow-[inset_0_1px_0_rgba(255,220,140,0.03)] backdrop-blur-sm sm:p-7">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/45 bg-amber-500/5 text-amber-300">
            <CircleHelp className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold text-amber-200">Tres comodines</h2>
        </div>
        <p className="mb-5 text-[15px] leading-6 text-[#eadbc4]/90">Cada uno puede utilizarse <strong className="text-amber-100">una vez por recorrido</strong>. Selecciónalo, escucha al anfitrión y pulsa «Usar comodín». El 50:50 elimina dos opciones directamente en la pregunta. Los otros dos muestran su consejo en una ventana con el reloj visible; pulsa «Volver a la pregunta» para continuar.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {LIFELINES.map(({ title, icon: Icon, text }, index) => (
            <motion.article key={title} {...fadeUp(0.52 + index * 0.08, 10)} className="rounded-xl border border-amber-600/30 bg-[#170d05]/55 p-5 transition-colors hover:border-amber-400/40">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-300"><Icon className="h-4 w-4" aria-hidden="true" />{title}</h3>
              <p className="text-sm leading-6 text-[#eadbc4]/80">{text}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section {...fadeUp(0.7, 10)} className="mx-auto mt-9 max-w-sm">
        <h2 className="mb-4 text-center font-display text-xl font-semibold text-amber-200">♛ La escalera de Coronas</h2>
        <MoneyLadder currentLevel={1} />
      </motion.section>
    </main>
  );
}
