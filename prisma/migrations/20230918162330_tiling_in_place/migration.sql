/*
  Warnings:

  - You are about to drop the `_ImageToTiling` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `imageId` on the `Tiling` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "_ImageToTiling_B_index";

-- DropIndex
DROP INDEX "_ImageToTiling_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ImageToTiling";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ImageTiling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageId" TEXT NOT NULL,
    "tilingId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "w" INTEGER NOT NULL,
    "h" INTEGER NOT NULL,
    CONSTRAINT "ImageTiling_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImageTiling_tilingId_fkey" FOREIGN KEY ("tilingId") REFERENCES "Tiling" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tiling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hash" TEXT NOT NULL,
    "json" TEXT NOT NULL
);
INSERT INTO "new_Tiling" ("hash", "id", "json") SELECT "hash", "id", "json" FROM "Tiling";
DROP TABLE "Tiling";
ALTER TABLE "new_Tiling" RENAME TO "Tiling";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
