/*
  Warnings:

  - You are about to drop the column `amount` on the `BankTransaction` table. All the data in the column will be lost.
  - The `bankName` column on the `BankTransaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paidWith` column on the `Purchase` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `saleSource` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BankTransaction" DROP COLUMN "amount",
DROP COLUMN "bankName",
ADD COLUMN     "bankName" JSONB;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "paidWith" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "paidWith" JSONB;

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "paidWith",
ADD COLUMN     "paidWith" JSONB;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "saleSource" TEXT NOT NULL,
ALTER COLUMN "paidWith" DROP NOT NULL;
