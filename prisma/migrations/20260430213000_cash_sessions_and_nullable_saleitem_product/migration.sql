-- Allow multiple cash register closures on the same day.
DROP INDEX IF EXISTS "CashRegister_date_key";

ALTER TABLE "CashRegister"
ADD COLUMN IF NOT EXISTS "transactionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Keep sales history when a product is deleted.
ALTER TABLE "SaleItem" DROP CONSTRAINT IF EXISTS "SaleItem_productId_fkey";
ALTER TABLE "SaleItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
