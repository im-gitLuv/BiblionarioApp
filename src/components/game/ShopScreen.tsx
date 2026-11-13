"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Coins,
  Fish,
  Landmark,
  Lightbulb,
  ScrollText,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarFrame } from "./AvatarFrame";
import { RoundIconButton, StageHeading, fadeUp } from "@/components/game/ui";
import { STORE_ITEMS, storeItem, type StoreItem } from "@/lib/store";
import { formatCrowns } from "@/lib/game-data";

interface StoreView {
  siclos: number;
  equippedMarco: string | null;
  equippedTitulo: string | null;
  owned: string[];
  history: { item: string; price: number; gameId: string | null; createdAt: string }[];
}

const BLESSING_ICONS: Record<string, typeof Lightbulb> = {
  lampara: Lightbulb,
  sol: Sun,
  redencion: Fish,
};

function priceLabel(item: StoreItem): string {
  if (item.key === "redencion")
    return `45 · 90 · 150 según tramo (caes en el 2–5, 6–10 o 11–15)`;
  return `${formatCrowns(item.price ?? 0)} Siclos`;
}

export function ShopScreen({ onBack, onChanged }: { onBack: () => void; onChanged: () => void }) {
  const [store, setStore] = useState<StoreView | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  // Confirmación explícita: ningún artículo se adquiere con un solo toque.
  const [armed, setArmed] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/store", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo abrir el Gazofilacio.");
        return data as StoreView;
      })
      .then(view => { if (mounted) setStore(view); })
      .catch(loadError => { if (mounted) setError((loadError as Error).message); });
    return () => { mounted = false; };
  }, []);

  const send = async (action: "comprar" | "equipar" | "quitar", item: string) => {
    setBusy(item + action);
    setError("");
    setNotice("");
    try {
      const view = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, item }),
      }).then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "La ofrenda no pudo completarse.");
        return data as StoreView;
      });
      setStore(view);
      setArmed(null);
      setNotice(action === "comprar"
        ? `Ofrenda recibida: ${storeItem(item)?.name} es tuyo.`
        : action === "equipar"
          ? `${storeItem(item)?.name} equipado.`
          : `${storeItem(item)?.name} guardado en tu arca.`);
      onChanged();
    } catch (sendError) {
      setError((sendError as Error).message);
      setArmed(null);
    } finally {
      setBusy("");
    }
  };

  const owned = new Set(store?.owned ?? []);
  const marcos = STORE_ITEMS.filter(item => item.kind === "marco");
  const titulos = STORE_ITEMS.filter(item => item.kind === "titulo");
  const bendiciones = STORE_ITEMS.filter(item => item.kind === "bendicion");

  const cosmeticCard = (item: StoreItem) => {
    const isOwned = owned.has(item.key);
    const isMarco = item.kind === "marco";
    const equipped = isMarco ? store?.equippedMarco === item.key : store?.equippedTitulo === item.key;
    const affordable = (store?.siclos ?? 0) >= (item.price ?? 0);
    const confirming = armed === item.key;
    return (
      <motion.article key={item.key} {...fadeUp(0.1, 10)} className="rounded-xl border border-amber-600/30 bg-[#170d05]/55 p-5 transition-colors hover:border-amber-400/40">
        <div className="mb-3 flex items-center gap-3">
          {isMarco ? (
            <AvatarFrame name="Biblionario" marco={item.key} className="h-10 w-10 text-[11px]" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/45 bg-amber-500/5 text-amber-300">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-amber-300">{item.name}</h3>
            <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300/60">{item.scripture}</p>
          </div>
        </div>
        <p className="mb-1 text-sm leading-6 text-[#eadbc4]/80">{item.effect}</p>
        <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-amber-200">
          <Coins className="h-4 w-4 text-amber-400" aria-hidden="true" />
          {priceLabel(item)}
          <span className="font-normal text-amber-300/50">· {item.limit}</span>
        </p>
        {equipped ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300"><Check className="h-4 w-4" aria-hidden="true" />Equipado</p>
        ) : isOwned ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => void send("equipar", item.key)}
              className="clip-lozenge-slim bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-600 p-[2px] transition hover:brightness-110 disabled:opacity-50"
            >
              <span className="clip-lozenge-slim block bg-gradient-to-b from-[#f6c453] to-[#e8a020] px-4 py-2 text-[13px] font-bold text-ink">Equipar</span>
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => void send("quitar", item.key)}
              className="text-xs font-medium text-amber-300/80 underline decoration-amber-400/40 underline-offset-4 transition hover:text-amber-200 disabled:opacity-50"
            >
              Quitar
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              disabled={!!busy || (!affordable && !confirming)}
              onClick={() => (confirming ? void send("comprar", item.key) : setArmed(item.key))}
              className={cn(
                "clip-lozenge-slim w-full p-[2px] transition",
                confirming ? "bg-gradient-to-r from-emerald-500 via-emerald-300 to-emerald-500 hover:brightness-110" : "bg-gradient-to-r from-amber-700/70 via-amber-500/70 to-amber-700/70 hover:from-amber-500 hover:via-yellow-300 hover:to-amber-500",
                !affordable && !confirming && "cursor-not-allowed opacity-45"
              )}
            >
              <span className={cn(
                "clip-lozenge-slim block px-4 py-2 text-[13px] font-bold",
                confirming ? "bg-gradient-to-b from-emerald-500 to-emerald-700 text-emerald-50" : "bg-gradient-to-b from-[#2b1c0d] to-[#211609] text-[#f3e8d8]"
              )}>
                {confirming
                  ? `¿Ofrendar ${formatCrowns(item.price ?? 0)} Siclos?`
                  : affordable
                    ? "Comprar"
                    : `Te faltan ${formatCrowns((item.price ?? 0) - (store?.siclos ?? 0))} Siclos`}
              </span>
            </button>
            {confirming ? (
              <button type="button" onClick={() => setArmed(null)} className="mt-2 text-xs font-medium text-amber-300/80 underline decoration-amber-400/40 underline-offset-4 transition hover:text-amber-200">
                Cancelar
              </button>
            ) : null}
          </div>
        )}
      </motion.article>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-center gap-4">
          <RoundIconButton icon={ArrowLeft} label="Volver al menú principal" onClick={onBack} />
          <StageHeading overline="La tienda de Siclos" title="El Gazofilacio" />
        </div>

        {/* Saldo en grande: la puerta de la tienda recuerda que la moneda sirve */}
        <motion.div {...fadeUp(0.06)} className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/25 bg-[#1d1207]/80 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/70">Tu tesoro</p>
            <p className="font-display text-3xl font-bold tabular-nums text-amber-200">
              {store ? formatCrowns(store.siclos) : "…"}
              <span className="ml-2 text-sm font-normal text-amber-300/70">Siclos</span>
            </p>
          </div>
          <p className="flex max-w-xs items-start gap-2 text-xs leading-5 text-[#c4a875]">
            <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            Aquí se ofrenda lo ganado recorriendo las Escrituras (Lucas 21:1): segundas oportunidades, ayudas de estudio y señal de caminar.
          </p>
        </motion.div>

        {error ? <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : null}
        {notice && !error ? <p role="status" className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{notice}</p> : null}

        {/* Bendiciones: se ofrendan dentro de la partida; la tienda las presenta */}
        <motion.section {...fadeUp(0.14)} className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-amber-200">
            <ScrollText className="h-5 w-5 text-amber-400" aria-hidden="true" />
            Bendiciones de partida
          </h2>
          <p className="mb-4 text-sm leading-6 text-[#eadbc4]/75">No se compran aquí: se ofrendan dentro de la partida, desde su fila plateada debajo de los comodines. Los tres comodines de la casa siguen siendo gratuitos.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {bendiciones.map(item => {
              const Icon = BLESSING_ICONS[item.key] ?? ScrollText;
              return (
                <article key={item.key} className="rounded-xl border border-amber-600/30 bg-[#170d05]/55 p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-300"><Icon className="h-4 w-4" aria-hidden="true" />{item.name}</h3>
                  <p className="mb-2 text-sm leading-6 text-[#eadbc4]/80">{item.effect}</p>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-200"><Coins className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />{priceLabel(item)}<span className="font-normal text-amber-300/50">· {item.limit}</span></p>
                </article>
              );
            })}
          </div>
        </motion.section>

        {/* Marcos de perfil */}
        <motion.section {...fadeUp(0.2)} className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-amber-200">
            <Landmark className="h-5 w-5 text-amber-400" aria-hidden="true" />
            Marcos de perfil
          </h2>
          <p className="mb-4 text-sm leading-6 text-[#eadbc4]/75">Un marco permanente para tus iniciales, en el menú, en tus resultados y en el Salón de la Sabiduría. Equipa uno a la vez.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {marcos.map(cosmeticCard)}
          </div>
        </motion.section>

        {/* Títulos del Salón */}
        <motion.section {...fadeUp(0.26)} className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-amber-200">
            <BadgeCheck className="h-5 w-5 text-amber-400" aria-hidden="true" />
            Títulos del Salón
          </h2>
          <p className="mb-4 text-sm leading-6 text-[#eadbc4]/75">Un tratamiento permanente junto a tu nombre en el Salón de la Sabiduría.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {titulos.map(cosmeticCard)}
          </div>
        </motion.section>

        {/* Historial breve */}
        <motion.section {...fadeUp(0.32)}>
          <h2 className="mb-3 font-display text-lg font-semibold text-amber-200">Ofrendas recientes</h2>
          {store && store.history.length ? (
            <ul className="flex flex-col gap-2">
              {store.history.map((row, index) => (
                <li key={index} className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/15 bg-[#1d1207]/60 px-4 py-2.5 text-sm">
                  <span className="text-amber-100">{storeItem(row.item)?.name ?? row.item}</span>
                  <span className="flex items-center gap-3 text-amber-300/70">
                    <span className="flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />{formatCrowns(row.price)}</span>
                    <span className="text-xs">{new Date(row.createdAt).toLocaleDateString("es-VE", { month: "short", day: "numeric" })}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-amber-500/25 bg-[#1d1207]/50 px-6 py-8 text-center text-sm text-[#c4a875]">
              Aún no has ofrendado nada. Cada recorrido llena el arca.
            </p>
          )}
        </motion.section>
      </main>

      <footer className="mt-auto border-t border-amber-500/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[11px] tracking-wide text-[#c4a875]/60">
          “Y viendo las riquezas de sus ofrendas…” — Lucas 21:1 · El Gazofilacio, el arca de las ofrendas del Templo
        </p>
      </footer>
    </div>
  );
}
