"use client";

import { useEffect, useState } from "react";

/**
 * Returns true after the component has mounted in the browser.
 * Useful for deferring randomized / browser-only rendering (localStorage,
 * Math.random) so server and client HTML match during hydration.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return mounted;
}
