import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // UUID string

    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    // Find payments where purchaseId or saleId matches the id
    const payments = await prisma.payment.findMany({
      where: {
        OR: [{ purchaseId: id }, { saleId: id }],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, id, amount, note, paidWith } = body;

    if (!type || !id || !amount) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (type !== "purchase" && type !== "sale") {
      return NextResponse.json(
        { message: "Invalid credit type" },
        { status: 400 }
      );
    }

    let totalDue = 0;
    let totalPaid = 0;
    let amountRemaining = 0;

    if (type === "purchase") {
      const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: { payment: true },
      });

      if (!purchase) {
        return NextResponse.json(
          { message: "Purchase not found" },
          { status: 404 }
        );
      }

      totalDue = purchase.purchasingPrice * purchase.quantity;
      totalPaid =
        purchase.payment.reduce((sum, p) => sum + Number(p.amount), 0) +
        Number(amount); // Include new payment

      amountRemaining = totalDue - totalPaid;
      if (amountRemaining < 0) {
        return NextResponse.json(
          { message: "Payment exceeds remaining balance" },
          { status: 400 }
        );
      }
      const payment = await prisma.payment.create({
        data: {
          creditPurchse: { connect: { id } },
          amount: amount.toString(),
          amountRemaining: amountRemaining.toString(),
          note,
          paidWith,
        },
      });

      const updatedPaidWith = Array.isArray(purchase.paidWith)
        ? [...purchase.paidWith, { method: paidWith, amount: Number(amount) }]
        : [{ method: paidWith, amount: Number(amount) }];

      if (amountRemaining === 0) {
        await prisma.purchase.update({
          where: { id },
          data: {
            paidWith: updatedPaidWith,
            paymentStatus: "paid",
          },
        });
      } else if (amountRemaining > 0) {
        await prisma.purchase.update({
          where: { id },
          data: {
            paidWith: updatedPaidWith,
            paymentStatus: "partial",
          },
        });
      }

      const bankTransaction = await prisma.bankTransaction.create({
        data: {
          type: "Pay Credits Taken",
          bankName: [{ amount: amount, method: paidWith }],
        },
      });
      return NextResponse.json(
        { message: "Payment added", payment },
        { status: 201 }
      );
    }

    // sale
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!sale) {
      return NextResponse.json({ message: "Sale not found" }, { status: 404 });
    }

    totalDue = sale.sellingPrice * sale.quantitySold;
    totalPaid =
      sale.payment.reduce((sum, p) => sum + Number(p.amount), 0) +
      Number(amount); // Include new payment

    amountRemaining = totalDue - totalPaid;
    if (amountRemaining < 0) {
      return NextResponse.json(
        { message: "Payment exceeds remaining balance" },
        { status: 400 }
      );
    }
    const payment = await prisma.payment.create({
      data: {
        creditSell: { connect: { id } },
        amount: amount.toString(),
        amountRemaining: amountRemaining.toString(),
        note,
        paidWith,
      },
    });

    const updatedPaidWith = Array.isArray(sale.paidWith)
      ? [...sale.paidWith, { method: paidWith, amount: Number(amount) }]
      : [{ method: paidWith, amount: Number(amount) }];

    if (amountRemaining === 0) {
      await prisma.sale.update({
        where: { id },
        data: {
          paidWith: updatedPaidWith,
          paymentStatus: "paid",
        },
      });
    } else if (amountRemaining > 0) {
      await prisma.sale.update({
        where: { id },
        data: {
          paidWith: updatedPaidWith,
          paymentStatus: "partial",
        },
      });
    }
    const bankTransaction = await prisma.bankTransaction.create({
      data: {
        type: "Pay Credits Taken",
        bankName: [{ amount: amount, method: paidWith }],
      },
    });
    return NextResponse.json(
      { message: "Payment added", payment },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error adding payment:", error);
    return NextResponse.json(
      { message: "Failed to add payment", error },
      { status: 500 }
    );
  }
}
