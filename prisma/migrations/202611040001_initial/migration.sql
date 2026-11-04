-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "answer" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'playing',
    "level" INTEGER NOT NULL DEFAULT 1,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "rounds" JSONB NOT NULL,
    "lifelines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "removed" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_tokenHash_key" ON "Player"("tokenHash");

-- CreateIndex
CREATE INDEX "Question_level_active_idx" ON "Question"("level", "active");

-- CreateIndex
CREATE INDEX "Game_playerId_createdAt_idx" ON "Game"("playerId", "createdAt");

-- CreateIndex
CREATE INDEX "Game_status_amount_finishedAt_idx" ON "Game"("status", "amount", "finishedAt");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Domain invariants also protect imports or maintenance performed outside the API.
ALTER TABLE "Question" ADD CONSTRAINT "Question_level_check" CHECK (level BETWEEN 1 AND 15), ADD CONSTRAINT "Question_answer_check" CHECK (answer BETWEEN 0 AND 3), ADD CONSTRAINT "Question_options_check" CHECK (options IS NOT NULL AND cardinality(options) = 4);
ALTER TABLE "Game" ADD CONSTRAINT "Game_status_check" CHECK (status IN ('playing', 'won', 'walked', 'lost')), ADD CONSTRAINT "Game_level_check" CHECK (level BETWEEN 1 AND 15), ADD CONSTRAINT "Game_amount_check" CHECK (amount >= 0), ADD CONSTRAINT "Game_version_check" CHECK (version >= 0);
