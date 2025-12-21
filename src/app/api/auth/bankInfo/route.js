// /app/api/bank-transaction/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const bankInfo = await prisma.bankInfo.findMany({
      orderBy: { createdAt: "desc" },
    });
    const bankTransaction = await prisma.bankTransaction.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      {
        bankInfo,
        bankTransaction,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
}

export async function POST(req) {
  const data = await req.json();

  const { bankName, accountNo } = data;

  try {
    const bankInfo = await prisma.bankInfo.create({
      data: {
        bankName,
        accountNo,
      },
    });

    return NextResponse.json({ success: true, bankInfo });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}

export async function PUT(req) {
  try {
    const { id, bankName, accountNo } = await req.json();

    const updatedBank = await prisma.bankInfo.update({
      where: { id },
      data: {
        bankName,
        accountNo,
      },
    });

    return NextResponse.json({ success: true, updatedBank }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { id } = body;

    await prisma.bankInfo.delete({
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
