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
      <>Quince preguntas recorren las Escrituras, desde Génesis hasta Apocalipsis. Cada respuesta correcta te acerca a la <strong>Corona de Gloria de 1.000.000 de Coronas</strong>.</>,
      <>La dificultad aumenta con cada escalón. Primero eliges una opción y después confirmas tu <strong>respuesta definitiva</strong>.</>,
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
      <motion.header initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="mb-8 flex items-center gap-4">
        <button type="button" onClick={onBack} aria-label="Volver al menú" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-500/45 text-amber-300 transition-all duration-300 hover:border-amber-300 hover:bg-amber-500/10 hover:shadow-[0_0_22px_rgba(240,180,41,0.16)]">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.34em] text-amber-400/80">Antes de comenzar</p>
          <h1 className="font-display text-4xl font-semibold text-shimmer sm:text-5xl">Cómo jugar</h1>
        </div>
      </motion.header>

      <div className="grid gap-5 md:grid-cols-2">
        {GUIDE_CARDS.map(({ title, icon: Icon, paragraphs }, index) => (
          <motion.section key={title} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.08, duration: 0.5, ease: "easeOut" }} className="group rounded-2xl border border-amber-600/35 bg-[#1b1007]/80 p-6 shadow-[inset_0_1px_0_rgba(255,220,140,0.03)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/45 hover:shadow-[0_14px_45px_rgba(0,0,0,0.18)] sm:p-7">
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

      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46, duration: 0.55, ease: "easeOut" }} className="mt-5 rounded-2xl border border-amber-600/35 bg-[#1b1007]/80 p-6 shadow-[inset_0_1px_0_rgba(255,220,140,0.03)] backdrop-blur-sm sm:p-7">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/45 bg-amber-500/5 text-amber-300">
            <CircleHelp className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold text-amber-200">Tres comodines</h2>
        </div>
        <p className="mb-5 text-[15px] leading-6 text-[#eadbc4]/90">Cada uno puede utilizarse <strong className="text-amber-100">una vez por recorrido</strong>.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {LIFELINES.map(({ title, icon: Icon, text }, index) => (
            <motion.article key={title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 + index * 0.08, duration: 0.42 }} className="rounded-xl border border-amber-600/30 bg-[#170d05]/55 p-5 transition-colors hover:border-amber-400/40">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-300"><Icon className="h-4 w-4" aria-hidden="true" />{title}</h3>
              <p className="text-sm leading-6 text-[#eadbc4]/80">{text}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }} className="mx-auto mt-9 max-w-sm">
        <h2 className="mb-4 text-center font-display text-xl font-semibold text-amber-200">♛ La escalera de Coronas</h2>
        <MoneyLadder currentLevel={1} />
      </motion.section>
    </main>
  );
}
