/*
  Warnings:

  - Added the required column `brand` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "maxStock" INTEGER,
ADD COLUMN     "minStock" INTEGER,
ADD COLUMN     "productCode" TEXT,
ADD COLUMN     "productImage" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'active',
ADD COLUMN     "unit" TEXT NOT NULL;
