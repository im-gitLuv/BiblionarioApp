"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Gramática de movimiento del escenario.
   Todos los componentes usan la misma curva, duración y desplazamiento.
   Regla única: las animaciones solo cambian opacidad y transform; nunca
   alturas, márgenes ni nada que desplace a los elementos vecinos.
   ───────────────────────────────────────────────────────────── */

export const STAGE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Entrada estándar: fundido + elevación breve. Esparcir sobre un motion.* */
export function fadeUp(delay = 0, distance = 12) {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: STAGE_EASE },
  };
}

/* ─────────────────────────────────────────────────────────────
   LozengeButton — el único botón del juego.
   Tres variantes: primary (oro sólido), secondary (contorno dorado)
   y ghost (píldora sobria). El anfitrión, el menú, la configuración,
   los resultados y los diálogos comparten esta misma pieza.
   ───────────────────────────────────────────────────────────── */

export interface LozengeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  /** md para llamadas principales; sm para acciones de apoyo y filas compactas. */
  size?: "md" | "sm";
  icon?: React.ElementType;
  /** El icono ocupa el lado izquierdo; «trailing» el derecho (p. ej. chevron). */
  trailing?: React.ElementType;
}

export function LozengeButton({
  variant = "secondary",
  size = "md",
  icon: Icon,
  trailing: Trailing,
  className,
  children,
  ...props
}: LozengeButtonProps) {
  const slim = variant === "ghost" ? null : "clip-lozenge-slim";
  const hoverable = !props.disabled;
  return (
    <button
      type="button"
      className={cn(
        "group w-full sm:w-auto",
        variant === "primary" && "transition hover:brightness-110",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "block p-[2px] transition-colors duration-300",
          slim,
          variant === "primary" && "glow-lozenge bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-600",
          variant === "secondary" &&
            "bg-gradient-to-r from-amber-700/70 via-amber-500/70 to-amber-700/70 group-hover:from-amber-500 group-hover:via-yellow-300 group-hover:to-amber-500",
          variant === "ghost" && "bg-transparent"
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center gap-2 transition-colors duration-300",
            slim,
            size === "md"
              ? "px-9 py-3 text-[15px]"
              : "whitespace-nowrap px-5 py-2 text-[13px] font-medium",
            variant === "primary" && "bg-gradient-to-b from-[#f6c453] to-[#e8a020] font-bold text-ink",
            variant === "secondary" &&
              "bg-gradient-to-b from-[#2b1c0d] to-[#211609] font-semibold text-[#f3e8d8] group-hover:from-[#3a2612]",
            variant === "ghost" &&
              "rounded-full border border-amber-500/30 bg-transparent px-7 py-3 font-medium text-amber-200/90 transition-colors group-hover:border-amber-400/60 group-hover:bg-amber-500/10",
            props.disabled && "cursor-not-allowed opacity-50",
            hoverable && variant === "primary" && "group-hover:brightness-105"
          )}
        >
          {Icon ? <Icon className={cn("shrink-0", size === "md" ? "h-[18px] w-[18px]" : "h-4 w-4")} aria-hidden="true" /> : null}
          {children}
          {Trailing ? (
            <Trailing
              className={cn(
                "h-4 w-4 shrink-0 opacity-60 transition-transform duration-300 group-hover:translate-x-1",
                variant === "ghost" && "group-hover:translate-x-0"
              )}
              aria-hidden="true"
            />
          ) : null}
        </span>
      </span>
    </button>
  );
}

/** Encabezado de sección interior: sobrelínea + título serif dorado. */
export function StageHeading({
  overline,
  title,
  shimmer = true,
  className,
}: {
  overline: string;
  title: string;
  shimmer?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.34em] text-amber-400/80">{overline}</p>
      <h1
        className={cn(
          "font-display text-3xl font-bold sm:text-4xl",
          shimmer ? "text-shimmer" : "text-[#f7e2b0]"
        )}
      >
        {title}
      </h1>
    </div>
  );
}

/** Botón circular de icono (volver, cerrar…). Compañero sobrio del lozenge. */
export function RoundIconButton({
  icon: Icon,
  label,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: React.ElementType; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-500/45 text-amber-300 transition-all duration-300 hover:border-amber-300 hover:bg-amber-500/10 hover:shadow-[0_0_22px_rgba(240,180,41,0.16)]",
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

/** Franja de panel estándar (anfitrión, avisos, resultados de lectura). */
export function PanelStrip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-500/25 bg-stage-deep/88 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,220,140,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Punto de entrada reutilizable para listas y rejillas (movimiento contenido). */
export function FadeIn({
  delay = 0,
  distance = 12,
  className,
  children,
}: {
  delay?: number;
  distance?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div {...fadeUp(delay, distance)} className={className}>
      {children}
    </motion.div>
  );
}
