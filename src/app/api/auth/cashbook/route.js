import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cashBooks = await prisma.cashBook.findMany({
      include: {
        transactions: {
          orderBy: { createdAt: "desc" }, // or "desc" for newest first
        },
      },
    });
    return NextResponse.json(cashBooks, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const data = await req.json();
  const { title, note } = data;

  try {
    const newCashBook = await prisma.cashBook.create({
      data: { title, note },
    });
    return NextResponse.json({ success: true, newCashBook });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}

export async function PUT(req) {
  const body = await req.json();
  const { id, title, note } = body;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "CashBook ID is required." },
      { status: 400 }
    );
  }

  try {
    const updatedCashBook = await prisma.cashBook.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(note && { note }),
      },
    });
    return NextResponse.json({ success: true, updatedCashBook });
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

  if (!id) {
    return NextResponse.json(
      { success: false, message: "CashBook ID is required." },
      { status: 400 }
    );
  }

  try {
    // First delete all related transactions
    await prisma.cashTransaction.deleteMany({ where: { cashBookId: id } });

    // Then delete the cashbook itself
    await prisma.cashBook.delete({ where: { id } });
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
