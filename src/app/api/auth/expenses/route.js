// import { prisma } from "@/lib/prisma";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, amount, note, paymentMethod } = body;

    // 1. Create purchase record
    const expense = await prisma.expense.create({
      data: {
        title,
        amount: Number(amount),
        note,
        paymentMethod,
      },
    });

    const bankTransaction = await prisma.bankTransaction.create({
      data: {
        type: "expense",
        bankName: [{ amount: amount, method: paymentMethod }],
      },
    });

    return NextResponse.json({ message: "Success", expense, bankTransaction });
  } catch (error) {
    console.error("Error during expense:", error);
    return NextResponse.json(
      { message: "Something went wrong", error },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, title, amount, note, paymentMethod } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(note && { note }),
        ...(paymentMethod && { paymentMethod }),
      },
    });

    return NextResponse.json({ success: true, updatedExpense });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { id } = body;

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
