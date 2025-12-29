// import { prisma } from "@/lib/prisma";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  try {
    if (productId) {
      const salesHistory = await prisma.sale.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(salesHistory, { status: 200 });
    } else {
      const sales = await prisma.sale.findMany({
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(sales, { status: 200 });
    }
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    return NextResponse.json(
      { message: "Error fetching sales" },
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
      quantitySold,
      customerName,
      plateNo,
      address,
      paidWith,
      saleSource,
      date,
      paymentStatus,
    } = body;
    console.log(paymentStatus);

    if (!productId || !quantitySold || !sellingPrice || !saleSource) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(paidWith) || paidWith.length === 0) {
      return NextResponse.json(
        { message: "paidWith must be a non-empty array" },
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

    if (saleSource === "shop 235" && product.inShop === 0) {
      return NextResponse.json(
        { message: "Product is out of stock in shop" },
        { status: 400 }
      );
    }

    if (saleSource === "sshop 116" && product.inStore === 0) {
      return NextResponse.json(
        { message: "Product is out of stock in Shop 116" },
        { status: 400 }
      );
    }

    if (saleSource === "shop 235" && Number(quantitySold) > product.inShop) {
      return NextResponse.json(
        { message: `Only ${product.inShop} items available in shop 235.` },
        { status: 400 }
      );
    }

    if (saleSource === "shop 116" && Number(quantitySold) > product.inStore) {
      return NextResponse.json(
        { message: `Only ${product.inStore} items available in Shop 116.` },
        { status: 400 }
      );
    }

    // Calculate total paid amount from paidWith array
    const totalPaidAmount = paidWith.reduce((acc, payment) => {
      return acc + (Number(payment.amount) || 0);
    }, 0);

    // Calculate expected total price
    const expectedTotal = Number(quantitySold) * Number(sellingPrice);

    if (paymentStatus === "paid" && totalPaidAmount !== expectedTotal) {
      return NextResponse.json(
        {
          message: `Paid amount (${totalPaidAmount}) must equal total price (${expectedTotal}).`,
        },
        { status: 400 }
      );
    }

    if (paymentStatus === "partial" && totalPaidAmount >= expectedTotal) {
      return NextResponse.json(
        {
          message: `Partial payment (${totalPaidAmount}) cannot be greater than or equal to total price (${expectedTotal}).`,
        },
        { status: 400 }
      );
    }

    // 1. Create purchase record
    const sell = await prisma.sale.create({
      data: {
        productId,
        productName,
        sellingPrice: Number(sellingPrice),
        quantitySold: Number(quantitySold),
        customerName,
        plateNo,
        address,
        paidWith,
        saleSource,
        paymentStatus,
        date: new Date(date),
      },
    });

    // 2. Update product stock based on saleSource
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data:
        saleSource === "shop 235"
          ? { inShop: { decrement: Number(quantitySold) } }
          : { inStore: { decrement: Number(quantitySold) } }, // store sale
    });

    await sendTelegramMessage(
      `🧾 NEW SALE\n
Product: ${sell.productName}
Qty: ${sell.quantitySold}
Total Price: ${sell.sellingPrice * sell.quantitySold}
Customer Name: ${sell.customerName}
Customer Phone: ${sell.sellingPrice}
Customer Adress: ${sell.address}
Customer Plate Number: ${sell.plateNo}
Source: ${sell.saleSource}
Payment: ${sell.paymentStatus}
${sell.paymentStatus === "paid" && `Paid With: ${sell.paidWith.method}`}`
    );

    // Stock checks
    const totalStock = updatedProduct.inShop + updatedProduct.inStore;

    if (totalStock <= updatedProduct.minStock) {
      await sendTelegramMessage(
        `⚠️ LOW STOCK ALERT\n${updatedProduct.productName} needs to restock. \nStock left: ${totalStock}`
      );
    }

    if (saleSource === "shop 235" && product.inShop === 0) {
      return NextResponse.json(
        { message: "Product is out of stock in shop" },
        { status: 400 }
      );
    }
    const bankTransaction = await prisma.bankTransaction.create({
      data: {
        type: "Sales",
        bankName: paidWith,
      },
    });
    return NextResponse.json({
      message: "Success",
      sell,
      updatedProduct,
      bankTransaction,
    });
  } catch (error) {
    console.error("Error while Selling:", error);
    return NextResponse.json(
      { message: "Something went wrong", error },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      id,
      productId,
      productName,
      sellingPrice,
      quantitySold,
      customerName,
      plateNo,
      address,
      paidWith,
      saleSource,
      paymentStatus,
    } = body;

    if (!Array.isArray(paidWith) || paidWith.length === 0) {
      return NextResponse.json(
        { message: "paidWith must be a non-empty array" },
        { status: 400 }
      );
    }

    // Fetch the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    if (saleSource === "shop 116" && product.inStore === 0) {
      return NextResponse.json(
        { message: "Product is out of stock in Shop 116" },
        { status: 400 }
      );
    }

    if (saleSource === "shop 235" && Number(quantitySold) > product.inShop) {
      return NextResponse.json(
        { message: `Only ${product.inShop} items available in shop 235.` },
        { status: 400 }
      );
    }

    if (saleSource === "shop 116" && Number(quantitySold) > product.inStore) {
      return NextResponse.json(
        { message: `Only ${product.inStore} items available in Shop 116.` },
        { status: 400 }
      );
    }

    // Validate total paid
    const totalPaidAmount = paidWith.reduce((acc, payment) => {
      return acc + (Number(payment.amount) || 0);
    }, 0);

    const expectedTotal = Number(quantitySold) * Number(sellingPrice);

    if (paymentStatus === "paid" && totalPaidAmount < expectedTotal) {
      return NextResponse.json(
        {
          message: `Paid amount (${totalPaidAmount}) cannot be less than total price (${expectedTotal}).`,
        },
        { status: 400 }
      );
    }

    // Update sale
    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        productId,
        productName,
        sellingPrice: Number(sellingPrice),
        quantitySold: Number(quantitySold),
        customerName,
        plateNo,
        address,
        paidWith,
        saleSource,
        paymentStatus,
      },
    });
    console.log(updatedSale);

    // Adjust stock
    await prisma.product.update({
      where: { id: productId },
      data:
        saleSource === "shop 235"
          ? { inShop: { decrement: Number(quantitySold) } }
          : { inStore: { decrement: Number(quantitySold) } },
    });

    const totalStock = inShop + inStore;

    if (totalStock <= product.minStock) {
      await sendTelegramMessage(
        `⚠️ LOW STOCK ALERT\n\n${productName}\nis running loww. please restock product\n${productName}\n. Stock left: ${totalStock}`
      );
    }

    return NextResponse.json({
      message: "Sale updated successfully",
      sale: updatedSale,
    });
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { message: "Something went wrong while updating sale", error },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { id } = body;

    // 1. Find the sale first (to know productId, quantitySold, and source)
    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, message: "Sale not found" },
        { status: 404 }
      );
    }

    // 2. Delete the sale
    await prisma.sale.delete({
      where: { id },
    });

    // 3. Update product stock (restore based on saleSource)
    await prisma.product.update({
      where: { id: sale.productId },
      data:
        sale.saleSource === "shop 235"
          ? { inShop: { increment: sale.quantitySold } }
          : { inStore: { increment: sale.quantitySold } },
    });

    return NextResponse.json({
      success: true,
      message: "Sale deleted and stock restored",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
