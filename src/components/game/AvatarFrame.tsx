"use client";

import { cn } from "@/lib/utils";
import { storeItem } from "@/lib/store";

/* ─────────────────────────────────────────────────────────────
   AvatarFrame — las iniciales del jugador, con el marco del
   Gazofilacio cuando tiene uno equipado. Sin marco, la pieza
   conserva el contorno dorado sobrio del resto del juego.
   ───────────────────────────────────────────────────────────── */

const MARCO_STYLES: Record<string, string> = {
  "marco:cedro": "border-emerald-400/80 shadow-[0_0_16px_rgba(52,211,153,0.3)]",
  "marco:onix": "border-slate-200/80 shadow-[0_0_16px_rgba(226,232,240,0.25)]",
  "marco:zafiro": "border-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.35)]",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AvatarFrame({
  name,
  marco,
  className,
}: {
  name: string;
  marco?: string | null;
  className?: string;
}) {
  const style = marco ? MARCO_STYLES[marco] : null;
  const title = marco ? storeItem(marco)?.name : undefined;
  return (
    <span
      title={title}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-gradient-to-b from-[#2e2010] to-[#1d1207] text-[10px] font-bold text-amber-200",
        style ?? "border-amber-500/40",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
