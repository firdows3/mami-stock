import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  const today = new Date();

  const oneMonthLater = new Date();
  oneMonthLater.setMonth(today.getMonth() + 1);

  const expired = await prisma.product.findMany({
    where: {
      expiredAt: { lt: today },
    },
    orderBy: { expiredAt: "asc" },
  });

  const expiringSoon = await prisma.product.findMany({
    where: {
      expiredAt: {
        gte: today,
        lte: oneMonthLater,
      },
    },
    orderBy: { expiredAt: "asc" },
  });

  // 🔔 EXPIRED ALERT
  if (expired.length > 0) {
    const message = `🚨 EXPIRED PRODUCTS ALERT\n${expired
      .map((p) => `• ${p.productName} (expired: ${p.expiredAt.toDateString()})`)
      .join("\n")}`;

    await sendTelegramMessage(message);
  }

  // ⏳ EXPIRING SOON ALERT
  if (expiringSoon.length > 0) {
    const message = `⏳ EXPIRING SOON (within 30 days)\n\n${expiringSoon
      .map((p) => `• ${p.productName} (expires: ${p.expiredAt.toDateString()})`)
      .join("\n")}`;

    await sendTelegramMessage(message);
  }

  return NextResponse.json({
    expired,
    expiringSoon,
  });
}
