-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CASH_IN', 'CASH_OUT');

-- CreateTable
CREATE TABLE "CashBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashTransaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "transactionTitle" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "remark" TEXT,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cashBookUser" TEXT,
    "cashBookId" TEXT NOT NULL,

    CONSTRAINT "CashTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_cashBookId_fkey" FOREIGN KEY ("cashBookId") REFERENCES "CashBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
