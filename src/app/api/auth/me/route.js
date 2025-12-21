// app/api/auth/me/route.js or route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    return NextResponse.json({
      authenticated: true,
      role: payload.role,
      username: payload.username,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}
