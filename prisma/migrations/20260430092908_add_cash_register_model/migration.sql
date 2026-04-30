-- CreateTable
CREATE TABLE "CashRegister" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "opening" DOUBLE PRECISION NOT NULL,
    "cash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transfer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashRegister_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashRegister_date_key" ON "CashRegister"("date");
