-- AlterTable
ALTER TABLE "Purchase" ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SentToShop" ALTER COLUMN "productId" DROP NOT NULL;
