import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/login"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const role = payload.role;

    // ✅ Admin can access everything
    if (role === "admin") {
      return NextResponse.next();
    }

    // 🛍 Shopper → only /shop
    if (
      role === "shopper" &&
      (pathname.startsWith("/shop") || pathname.startsWith("/sales"))
    ) {
      return NextResponse.next();
    }

    // 📦 Storekeeper → only /store
    if (
      role === "storekeeper" &&
      (pathname.startsWith("/store") || pathname.startsWith("/sentToShop"))
    ) {
      return NextResponse.next();
    }

    if (
      role === "shop 116" &&
      (pathname.startsWith("/shop") ||
        pathname.startsWith("/sales") ||
        pathname.startsWith("/"))
    ) {
      return NextResponse.next();
    }
    if (
      role === "shop 235" &&
      (pathname.startsWith("/shop") ||
        pathname.startsWith("/sales") ||
        pathname.startsWith("/"))
    ) {
      return NextResponse.next();
    }
    if (
      role === "shop siti" &&
      (pathname.startsWith("/shop") ||
        pathname.startsWith("/sales") ||
        pathname.startsWith("/"))
    ) {
      return NextResponse.next();
    }

    // ❌ Anything else → unauthorized
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api).*)"],
};
