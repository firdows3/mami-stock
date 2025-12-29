import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Utility function to save uploaded file
async function saveFile(file) {
  if (!file) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public/uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const fileName = Date.now() + "-" + file.name;
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${fileName}`;
}

export async function GET(req) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    // Required fields
    const productName = formData.get("productName")?.toString() || "";
    const inShop = Number(formData.get("inShop") || 0);
    const inStore = Number(formData.get("inStore") || 0);
    const sellingPrice = Number(formData.get("sellingPrice") || 0);
    const buyingPrice = Number(formData.get("buyingPrice") || 0);
    const paymentStatus = formData.get("paymentStatus")?.toString() || "paid";
    const paidWith = JSON.parse(formData.get("paidWith") || "[]");

    // Optional fields
    const productImageFile = formData.get("productImage"); // File
    const productImage = await saveFile(productImageFile);
    const productCode = formData.get("productCode")?.toString() || null;
    const category = formData.get("category")?.toString() || null;
    const brand = formData.get("brand")?.toString() || null;
    const unit = formData.get("unit")?.toString() || null;
    const status = formData.get("status")?.toString() || "active";
    const minStock = Number(formData.get("minStock") || 0);
    const maxStock = Number(formData.get("maxStock") || 0);
    const expiredAtRaw = formData.get("expiredAt");
    const expiredAt = expiredAtRaw ? new Date(expiredAtRaw) : null;

    // Create product
    const newProduct = await prisma.product.create({
      data: {
        productName,
        inShop,
        inStore,
        orgQty: inShop + inStore,
        sellingPrice,
        buyingPrice,
        paymentStatus,
        paidWith,
        productImage,
        productCode,
        category,
        brand,
        unit,
        status,
        minStock,
        maxStock,
        expiredAt,
      },
    });

    // Optional: create initial purchase record
    await prisma.purchase.create({
      data: {
        productId: newProduct.id,
        productName,
        quantity: inShop + inStore,
        purchasingPrice: buyingPrice,
        sellingPrice,
        paymentStatus,
        supplierName: "",
        supplierPhone: "",
        paidWith,
        date: new Date(),
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error uploading product:", error);
    return NextResponse.json(
      { message: "Error uploading product" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const formData = await req.formData();
    const id = formData.get("id")?.toString();
    if (!id)
      return NextResponse.json({ message: "No ID provided" }, { status: 400 });

    // Required and optional fields
    const updateData = {
      productName: formData.get("productName")?.toString(),
      inShop: formData.get("inShop")
        ? Number(formData.get("inShop"))
        : undefined,
      inStore: formData.get("inStore")
        ? Number(formData.get("inStore"))
        : undefined,
      orgQty: formData.get("inShop") + formData.get("inStore"),
      sellingPrice: formData.get("sellingPrice")
        ? Number(formData.get("sellingPrice"))
        : undefined,
      buyingPrice: formData.get("buyingPrice")
        ? Number(formData.get("buyingPrice"))
        : undefined,
      paymentStatus: formData.get("paymentStatus")?.toString(),
      // paidWith: formData.get("paidWith")
      //   ? JSON.parse(formData.get("paidWith"))
      //   : undefined,
      productCode: formData.get("productCode")?.toString(),
      category: formData.get("category")?.toString(),
      brand: formData.get("brand")?.toString(),
      unit: formData.get("unit")?.toString(),
      status: formData.get("status")?.toString(),
      expiredAt: formData.get("expiredAt")
        ? new Date(formData.get("expiredAt"))
        : null,
      minStock: formData.get("minStock")
        ? Number(formData.get("minStock"))
        : undefined,
      maxStock: formData.get("maxStock")
        ? Number(formData.get("maxStock"))
        : undefined,
    };

    // Handle product image separately
    const productImageFile = formData.get("productImage");
    if (productImageFile && productImageFile.size > 0) {
      updateData.productImage = await saveFile(productImageFile);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: "Error updating product" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const ids = body.ids?.map((id) => id.toString());
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No IDs provided" }, { status: 400 });
    }

    await prisma.product.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error deleting products:", err);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
