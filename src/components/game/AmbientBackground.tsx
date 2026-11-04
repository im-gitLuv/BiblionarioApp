"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Warm "stage-light" backdrop: golden glow from above, ember glow below,
 * vignette, and slowly drifting light motes. Purely decorative.
 */
export function AmbientBackground() {
  const mounted = useMounted();
  const motes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 3 + Math.random() * 5,
        duration: 7 + Math.random() * 7,
        delay: Math.random() * 6,
        drift: 10 + Math.random() * 24,
      })),
    []
  );

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-[#171009]">
      {/* Key light from above */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 55% at 50% -12%, rgba(240,180,41,0.17), transparent 62%)",
        }}
      />
      {/* Ember glow from below */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 112%, rgba(150,72,12,0.20), transparent 65%)",
        }}
      />
      {/* Side warmth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 35% 60% at -8% 45%, rgba(120,60,10,0.10), transparent 60%), radial-gradient(ellipse 35% 60% at 108% 55%, rgba(120,60,10,0.10), transparent 60%)",
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 42%, rgba(10,6,2,0.55) 100%)",
        }}
      />
      {/* Floating light motes — browser only, randomized positions */}
      {mounted &&
        motes.map((m) => (
          <motion.span
            key={m.id}
            className="absolute rounded-full bg-amber-200/25 blur-[2px]"
            style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size }}
            animate={{ y: [0, -m.drift, 0], opacity: [0, 0.55, 0] }}
            transition={{
              duration: m.duration,
              delay: m.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
    </div>
  );
}
