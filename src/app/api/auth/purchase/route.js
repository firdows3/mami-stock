// import { prisma } from "@/lib/prisma";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET(req) {
  try {
    const purchases = await prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(purchases, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      productId,
      productName,
      purchasingPrice,
      sellingPrice,
      quantity,
      supplierName,
      supplierPhone,
      paymentStatus,
      paidWith,
      date,
    } = body;

    if (!productId || !quantity || !sellingPrice) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Create purchase record
    const purchase = await prisma.purchase.create({
      data: {
        productId,
        productName,
        purchasingPrice: Number(purchasingPrice),
        sellingPrice: Number(sellingPrice),
        quantity: Number(quantity),
        supplierName,
        supplierPhone,
        paidWith,
        paymentStatus,
        date: new Date(date),
      },
    });
    // 2. Update product stock and selling price
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        inStore: {
          increment: Number(quantity),
        },
        sellingPrice: Number(sellingPrice),
      },
    });
    const totalStock = updatedProduct.inShop + updatedProduct.inStore;
    if (updatedProduct.maxStock > 0 && totalStock >= updatedProduct.maxStock) {
      await sendTelegramMessage(
        `📦 OVERSTOCK ALERT\n${productName} is overStocked.\nStock Quantity: ${totalStock}`
      );
    }
    const bankTransaction = await prisma.bankTransaction.create({
      data: {
        type: "Purchase",
        bankName: paidWith,
      },
    });

    return NextResponse.json({
      message: "Success",
      purchase,
      updatedProduct,
      bankTransaction,
    });
  } catch (error) {
    console.log("Error during purchase:", error);
    return NextResponse.json(
      { message: "Something went wrong", error },
      { status: 500 }
    );
  }
}
