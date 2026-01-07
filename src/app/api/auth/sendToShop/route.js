// import { prisma } from "@/lib/prisma";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
const shopFieldMap = {
  "shop 235": "inShop235",
  "shop 116": "inShop116",
  "shop siti": "inShopSiti",
};

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
    const { productId, productName, quantitySent, source, destination, date } =
      body;

    if (!productId || !quantitySent || !source || !destination) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (source === destination) {
      return NextResponse.json(
        { message: "Source and destination cannot be the same" },
        { status: 400 }
      );
    }

    const sourceField = shopFieldMap[source];
    const destinationField = shopFieldMap[destination];

    if (!sourceField || !destinationField) {
      return NextResponse.json(
        { message: "Invalid shop selected" },
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

    if (Number(quantitySent) > product[sourceField]) {
      return NextResponse.json(
        {
          message: `Only ${product[sourceField]} items available in ${source}.`,
        },
        { status: 400 }
      );
    }

    // 1️⃣ Record transfer
    const sendToShop = await prisma.sentToShop.create({
      data: {
        productId,
        productName,
        source,
        destination,
        quantitySent: Number(quantitySent),
        date: new Date(date),
      },
    });

    // 2️⃣ Update stock (atomic)
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        [sourceField]: { decrement: Number(quantitySent) },
        [destinationField]: { increment: Number(quantitySent) },
      },
    });

    return NextResponse.json({
      message: "Stock transferred successfully",
      sendToShop,
      updatedProduct,
    });
  } catch (error) {
    console.log("Error while transferring stock:", error);
    return NextResponse.json(
      { message: "Something went wrong", error },
      { status: 500 }
    );
  }
}
