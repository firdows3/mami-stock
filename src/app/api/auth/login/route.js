import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();

    const { phone, password } = body;

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "InCorrect Password or Phone Number" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      id: user.id,
      role: user.role,
      username: user.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    const response = NextResponse.json({
      message: "Login successful",
      role: user.role,
      username: user.username,
    });

    response.cookies.set("token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
