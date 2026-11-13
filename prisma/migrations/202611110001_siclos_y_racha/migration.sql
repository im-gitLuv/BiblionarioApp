-- Siclos y racha diaria (v1.1). El saldo de Siclos vive en el perfil y cada
-- partida terminada registra lo emitido, como libro contable de la economía.
-- La racha se cuenta por día calendario del jugador (America/Caracas, UTC-4
-- todo el año): completar cualquier partida la mantiene o la aumenta.

ALTER TABLE "Player" ADD COLUMN "siclos" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "streak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bestStreak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastPlayedAt" TIMESTAMP(3);

ALTER TABLE "Game" ADD COLUMN "siclos" INTEGER NOT NULL DEFAULT 0;
