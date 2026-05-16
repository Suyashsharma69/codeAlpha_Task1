-- CreateTable
CREATE TABLE "public"."ShortUrl" (
    "id" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "longUrl" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortUrl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortUrl_shortCode_key" ON "public"."ShortUrl"("shortCode");
