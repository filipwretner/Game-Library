-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "igdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT,
    "summary" TEXT,
    "releaseDate" DATETIME,
    "platforms" TEXT NOT NULL DEFAULT '[]',
    "igdbRating" REAL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "rank" INTEGER,
    "ownedPlatform" TEXT,
    "price" REAL,
    "normalPrice" REAL,
    "discountPct" INTEGER,
    "priceCurrency" TEXT,
    "priceStore" TEXT,
    "priceUpdatedAt" DATETIME,
    "dateCompleted" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Entry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_igdbId_key" ON "Game"("igdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_gameId_key" ON "Entry"("gameId");

-- CreateIndex
CREATE INDEX "Entry_status_rank_idx" ON "Entry"("status", "rank");
