"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#f0b429", "#ffd24d", "#f7e2b0", "#d97b29", "#fff7e0", "#c47a1d"];

/**
 * Golden confetti rain — used on the victory screen.
 */
export function GoldenConfetti({ pieces = 90 }: { pieces?: number }) {
  const confetti = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3.8 + Math.random() * 3.2,
        width: 5 + Math.random() * 7,
        height: 3 + Math.random() * 5,
        rotation: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.6,
        drift: (Math.random() - 0.5) * 160,
      })),
    [pieces]
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {confetti.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-[-6%]"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : "1.5px",
          }}
          initial={{ y: "-8vh", opacity: 0, rotate: p.rotation }}
          animate={{
            y: "108vh",
            x: p.drift,
            opacity: [0, 1, 1, 0.85],
            rotate: p.rotation + 420,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: 1.2,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
