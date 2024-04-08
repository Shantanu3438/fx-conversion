-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "usd_balance" INTEGER NOT NULL DEFAULT 0,
    "eur_balance" INTEGER NOT NULL DEFAULT 0,
    "gbp_balance" INTEGER NOT NULL DEFAULT 0,
    "aud_balance" INTEGER NOT NULL DEFAULT 0,
    "cad_balance" INTEGER NOT NULL DEFAULT 0,
    "cny_balance" INTEGER NOT NULL DEFAULT 0,
    "hkd_balance" INTEGER NOT NULL DEFAULT 0,
    "krw_balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
