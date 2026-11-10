-- Etiqueta pública de perfil: distingue a jugadores con el mismo nombre.
-- 4 caracteres hexadecimales en mayúsculas (sin letras ambiguas O, I, S).
ALTER TABLE "Player" ADD COLUMN "tag" TEXT;

-- Relleno sin colisiones para los perfiles ya existentes.
DO $$
DECLARE
  r RECORD;
  t TEXT;
BEGIN
  FOR r IN SELECT id FROM "Player" ORDER BY "createdAt" LOOP
    LOOP
      t := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "Player" WHERE "tag" = t);
    END LOOP;
    UPDATE "Player" SET "tag" = t WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE "Player" ALTER COLUMN "tag" SET NOT NULL;

-- Nombre estándar de Prisma para el índice único.
CREATE UNIQUE INDEX "Player_tag_key" ON "Player"("tag");
