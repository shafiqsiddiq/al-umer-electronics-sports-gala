import { NextResponse } from "next/server";
import { getCaptainSession, createToken } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

const CAPTAIN_QUERY = `*[_type == "captain" && _id == $captainId][0]{
  _id, name, email, phone, whatsapp,
  "profilePictureUrl": profilePicture.asset->url
}`;

export async function PATCH(request) {
  const session = await getCaptainSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const whatsapp = formData.get("whatsapp");
    const profilePicture = formData.get("profilePicture");

    if (!name || !whatsapp) {
      return NextResponse.json({ error: "Name and phone number are required" }, { status: 400 });
    }

    const digits = String(whatsapp).replace(/\D/g, "");
    if (digits.length !== 11 || !digits.startsWith("03")) {
      return NextResponse.json(
        { error: "Enter a valid 11-digit phone number (e.g. 03001234567)" },
        { status: 400 }
      );
    }

    const emailValue = typeof email === "string" ? email.trim() : "";
    if (emailValue) {
      const duplicateEmail = await writeClient.fetch(
        `*[_type == "captain" && email == $email && _id != $captainId][0]`,
        { email: emailValue, captainId: session.captainId }
      );
      if (duplicateEmail) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    const duplicateWhatsapp = await writeClient.fetch(
      `*[_type == "captain" && (whatsapp == $whatsapp || phone == $whatsapp) && _id != $captainId][0]`,
      { whatsapp: digits, captainId: session.captainId }
    );
    if (duplicateWhatsapp) {
      return NextResponse.json(
        { error: "This phone number is already used by another captain" },
        { status: 400 }
      );
    }

    const patch = writeClient.patch(session.captainId).set({
      name,
      email: emailValue,
      whatsapp: digits,
      phone: digits,
    });

    const fileSlug = (emailValue || digits || "captain").replace(/[^a-z0-9]/gi, "");

    if (profilePicture && profilePicture.size > 0) {
      const asset = await writeClient.assets.upload("image", profilePicture, {
        filename: `captain-profile-${fileSlug}.jpg`,
      });
      patch.set({
        profilePicture: {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
        },
      });
    }

    await patch.commit();

    const captain = await writeClient.fetch(CAPTAIN_QUERY, { captainId: session.captainId });

    const response = NextResponse.json({ success: true, captain });

    if (email !== session.email) {
      const token = await createToken({
        role: "captain",
        captainId: session.captainId,
        teamId: session.teamId,
        email,
        whatsapp: digits,
      });
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Update captain profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
