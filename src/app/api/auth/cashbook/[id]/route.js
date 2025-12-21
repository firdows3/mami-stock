import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = params;

  try {
    // Fetch cashbook with its transactions
    const cashBook = await prisma.cashBook.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" }, // or "desc" for newest first
        },
      },
    });

    if (!cashBook) {
      return NextResponse.json(
        { success: false, message: "CashBook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, cashBook });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  const { id } = params;
  const data = await req.json();
  const { type, amount, remark, cashBookUser, transactionTitle } = data;

  if (!type || !amount || !transactionTitle) {
    return NextResponse.json(
      { success: false, message: "Type and amount are required" },
      { status: 400 }
    );
  }

  try {
    // Make sure the cashbook exists
    const cashBook = await prisma.cashBook.findUnique({ where: { id } });
    if (!cashBook)
      return NextResponse.json(
        { success: false, message: "CashBook not found" },
        { status: 404 }
      );

    // Get last balance
    const lastTransaction = await prisma.cashTransaction.findFirst({
      where: { cashBookId: id },
      orderBy: { createdAt: "desc" },
    });

    const previousBalance = lastTransaction ? lastTransaction.balanceAfter : 0;
    const balanceAfter =
      type === "CASH_IN"
        ? previousBalance + parseFloat(amount)
        : previousBalance - parseFloat(amount);

    const transaction = await prisma.cashTransaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        transactionTitle,
        remark,
        cashBookUser,
        cashBookId: id,
        balanceAfter,
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  const body = await req.json();
  const { id, type, amount, remark, cashBookUser, transactionTitle } = body;

  if (!id)
    return NextResponse.json(
      { success: false, message: "Transaction ID is required" },
      { status: 400 }
    );

  try {
    const updatedTransaction = await prisma.cashTransaction.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(transactionTitle && { transactionTitle }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(remark && { remark }),
        ...(cashBookUser && { cashBookUser }),
      },
    });

    return NextResponse.json({ success: true, updatedTransaction });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const body = await req.json();
  const { id } = body;

  if (!id)
    return NextResponse.json(
      { success: false, message: "Transaction ID is required" },
      { status: 400 }
    );

  try {
    await prisma.cashTransaction.delete({ where: { id } });
    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
