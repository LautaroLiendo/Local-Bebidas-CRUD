ALTER TABLE "SaleItem" ADD COLUMN "productName" TEXT;

UPDATE "SaleItem"
SET "productName" = "Product"."name"
FROM "Product"
WHERE "SaleItem"."productId" = "Product"."id";

UPDATE "SaleItem"
SET "productName" = 'Producto eliminado'
WHERE "productName" IS NULL;

ALTER TABLE "SaleItem" ALTER COLUMN "productName" SET NOT NULL;
