-- CreateTable
CREATE TABLE "Tiling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "json" TEXT NOT NULL,
    CONSTRAINT "Tiling_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
