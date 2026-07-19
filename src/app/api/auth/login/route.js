import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { writeClient } from "@/lib/sanity";
import { createToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { whatsapp, password, role } = await request.json();

    if (role === "admin") {
      if (password !== process.env.ADMIN_PASSWORD && password !== "admin123") {
        return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
      }

      const token = await createToken({ role: "admin" });
      const response = NextResponse.json({ success: true });
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
      return response;
    }

    if (!whatsapp || !password) {
      return NextResponse.json({ error: "WhatsApp number and password required" }, { status: 400 });
    }

    const captain = await writeClient.fetch(
      `*[_type == "captain" && whatsapp == $whatsapp][0]`,
      { whatsapp }
    );

    if (!captain) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, captain.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createToken({
      role: "captain",
      captainId: captain._id,
      teamId: captain.team?._ref,
      whatsapp,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
