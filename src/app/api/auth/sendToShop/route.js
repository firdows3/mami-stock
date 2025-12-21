// import { prisma } from "@/lib/prisma";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  try {
    let sentHistory;

    if (productId) {
      // ✅ Get records for specific product
      sentHistory = await prisma.sentToShop.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // ✅ Get all records
      sentHistory = await prisma.sentToShop.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(sentHistory, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch sent to shop:", error);
    return NextResponse.json(
      { message: "Error fetching sent to shop" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      productId,
      productName,
      sellingPrice,
      buyingPrice,
      quantitySent,
      date,
    } = body;

    if (!productId || !quantitySent) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    if (product.inStore === 0) {
      return NextResponse.json(
        { message: "Product is out of stock" },
        { status: 400 }
      );
    }
    if (Number(quantitySent) > product.inStore) {
      return NextResponse.json(
        {
          message: `Cannot sell ${quantitySold} items; only ${product.inShop} available in shop.`,
        },
        { status: 400 }
      );
    }

    // 1. Create purchase record
    const sendToShop = await prisma.sentToShop.create({
      data: {
        productId,
        productName,
        sellingPrice: Number(sellingPrice),
        buyingPrice: Number(buyingPrice),
        quantitySent: Number(quantitySent),
        date: new Date(date),
      },
    });

    // 2. Update product stock and selling price
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        inStore: {
          decrement: Number(quantitySent),
        },
        inShop: {
          increment: Number(quantitySent),
        },
      },
    });

    return NextResponse.json({
      message: "Success",
      sendToShop,
      updatedProduct,
    });
  } catch (error) {
    console.error("Error while Selling:", error);
    return NextResponse.json(
      { message: "Something went wrong", error },
      { status: 500 }
    );
  }
}
