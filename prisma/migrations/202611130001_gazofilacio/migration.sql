-- Migración aditiva v1.2 «El Gazofilacio»: tienda de Siclos.
-- Una tabla nueva y tres columnas: nada restringe ni obliga sobre datos
-- existentes (columnas nulables o con valor por defecto), de modo que el
-- código anterior convive con el esquema nuevo y el rollback sigue
-- disponible sin migración inversa (Promote to Production en Vercel).

-- Historial de compras y ofrendas: cosméticos de la tienda y bendiciones
-- cobradas en partida (con gameId cuando aplica). gameId no lleva llave
-- foránea a propósito: limpiar partidas en pruebas no arrastra el historial.
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "gameId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- Historial y métricas de gasto por jugador (capítulo 9 del diseño).
CREATE INDEX "Purchase_playerId_createdAt_idx" ON "Purchase"("playerId", "createdAt");

-- Cosmético equipado: el marco rodea las iniciales y el título acompaña al
-- nombre en el Salón de la Sabiduría. Dos columnas porque se equipan en
-- paralelo (marco y título a la vez).
ALTER TABLE "Player" ADD COLUMN "equippedMarco" TEXT;
ALTER TABLE "Player" ADD COLUMN "equippedTitulo" TEXT;

-- Bendiciones ofrendadas en el recorrido (lampara, sol, redencion), al
-- estilo del arreglo lifelines de los comodines de la casa.
ALTER TABLE "Game" ADD COLUMN "bendiciones" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
