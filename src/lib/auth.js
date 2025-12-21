import { jwtVerify } from "jose";

export async function getUserFromToken(req) {
  const token = req.cookies.token;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return payload;
  } catch (err) {
    return null;
  }
}
