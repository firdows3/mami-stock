import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const Users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(Users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
}

export async function POST(req) {
  const data = await req.json();

  const { username, phone, password, role } = data;

  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        phone,
        password,
        role,
      },
    });

    return NextResponse.json({ success: true, newUser });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, username, phone, password, role } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(username && { username }),
        ...(phone && { phone }),
        ...(password && { password }),
        ...(role && { role }),
      },
    });

    return NextResponse.json({ success: true, updatedUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
