import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  const now = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(now.getDate() - 7);

  // 🧾 SALES
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: { gte: lastWeek },
    },
  });

  const totalSalesAmount = sales.reduce(
    (sum, s) => sum + Number(s.sellingPrice) * Number(s.quantitySold),
    0
  );

  // 🏦 BANK TRANSACTIONS
  const bankTransactions = await prisma.bankTransaction.findMany({
    where: {
      createdAt: { gte: lastWeek },
    },
    include: { bank: true },
  });

  // 💰 AMOUNT PER BANK
  const bankSummary = {};

  bankTransactions.forEach((tx) => {
    const bankName = tx.bank.bankName;
    if (!bankSummary[bankName]) {
      bankSummary[bankName] = 0;
    }
    bankSummary[bankName] += Number(tx.amount);
  });

  // 📩 FORMAT MESSAGE
  let message = `📊 WEEKLY REPORT\n`;
  message += `🗓 ${lastWeek.toDateString()} → ${now.toDateString()}\n\n`;

  message += `🧾 SALES\n`;
  message += `• Total sales: ${sales.length}\n`;
  message += `• Total amount: ${totalSalesAmount} ETB\n\n`;

  message += `🏦 BANK SUMMARY\n`;
  Object.entries(bankSummary).forEach(([bank, amount]) => {
    message += `• ${bank}: ${amount} ETB\n`;
  });

  await sendTelegramMessage(message);

  return NextResponse.json({ success: true });
}
