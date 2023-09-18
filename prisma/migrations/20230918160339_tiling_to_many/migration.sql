-- CreateTable
CREATE TABLE "_ImageToTiling" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToTiling_A_fkey" FOREIGN KEY ("A") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToTiling_B_fkey" FOREIGN KEY ("B") REFERENCES "Tiling" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tiling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "json" TEXT NOT NULL
);
INSERT INTO "new_Tiling" ("hash", "id", "imageId", "json") SELECT "hash", "id", "imageId", "json" FROM "Tiling";
DROP TABLE "Tiling";
ALTER TABLE "new_Tiling" RENAME TO "Tiling";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToTiling_AB_unique" ON "_ImageToTiling"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToTiling_B_index" ON "_ImageToTiling"("B");
