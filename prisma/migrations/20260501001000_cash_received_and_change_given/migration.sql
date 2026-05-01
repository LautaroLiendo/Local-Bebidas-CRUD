ALTER TABLE "Sale"
ADD COLUMN "cashReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "changeGiven" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Sale"
SET "cashReceived" = "total"
WHERE "paymentMethod" = 'EFECTIVO' AND "cashReceived" = 0;

ALTER TABLE "CashRegister"
ADD COLUMN "cashReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "changeGiven" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "CashRegister"
SET "cashReceived" = "cash"
WHERE "cashReceived" = 0;
