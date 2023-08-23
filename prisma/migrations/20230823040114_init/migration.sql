-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Password" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Pattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternId" TEXT NOT NULL,
    "location" TEXT,
    "source" TEXT,
    "date" TEXT,
    "url" TEXT NOT NULL,
    CONSTRAINT "Image_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PatternToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PatternToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Pattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PatternToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_LinkToPattern" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_LinkToPattern_A_fkey" FOREIGN KEY ("A") REFERENCES "Link" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_LinkToPattern_B_fkey" FOREIGN KEY ("B") REFERENCES "Pattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Password_userId_key" ON "Password"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Link_kind_url_key" ON "Link"("kind", "url");

-- CreateIndex
CREATE INDEX "Tag_category_idx" ON "Tag"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_category_name_key" ON "Tag"("category", "name");

-- CreateIndex
CREATE UNIQUE INDEX "_PatternToTag_AB_unique" ON "_PatternToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PatternToTag_B_index" ON "_PatternToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_LinkToPattern_AB_unique" ON "_LinkToPattern"("A", "B");

-- CreateIndex
CREATE INDEX "_LinkToPattern_B_index" ON "_LinkToPattern"("B");
