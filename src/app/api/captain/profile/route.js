import { NextResponse } from "next/server";
import { getCaptainSession, createToken } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { validateCnic } from "@/lib/cnic";

const CAPTAIN_QUERY = `*[_type == "captain" && _id == $captainId][0]{
  _id, name, fatherName, cnic, email, phone, whatsapp,
  "profilePictureUrl": profilePicture.asset->url,
  "cnicImageUrl": cnicImage.asset->url
}`;

export async function PATCH(request) {
  const session = await getCaptainSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get("name");
    const fatherName = formData.get("fatherName");
    const cnic = formData.get("cnic");
    const email = formData.get("email");
    const whatsapp = formData.get("whatsapp");
    const profilePicture = formData.get("profilePicture");
    const cnicImage = formData.get("cnicImage");

    if (!name || !fatherName || !cnic || !email || !whatsapp) {
      return NextResponse.json({ error: "Name, father name, CNIC, email and WhatsApp are required" }, { status: 400 });
    }

    if (!validateCnic(cnic)) {
      return NextResponse.json({ error: "Invalid CNIC format. Use 35201-8511102-5" }, { status: 400 });
    }

    const duplicateEmail = await writeClient.fetch(
      `*[_type == "captain" && email == $email && _id != $captainId][0]`,
      { email, captainId: session.captainId }
    );
    if (duplicateEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const duplicateCnic = await writeClient.fetch(
      `*[_type in ["captain", "player"] && cnic == $cnic && !(_type == "captain" && _id == $captainId)][0]`,
      { cnic, captainId: session.captainId }
    );
    if (duplicateCnic) {
      return NextResponse.json({ error: "CNIC already registered" }, { status: 400 });
    }

    const patch = writeClient.patch(session.captainId).set({
      name,
      fatherName,
      cnic,
      email,
      whatsapp,
      phone: whatsapp,
    });

    if (profilePicture && profilePicture.size > 0) {
      const asset = await writeClient.assets.upload("image", profilePicture, {
        filename: `captain-profile-${email.replace(/[^a-z0-9]/gi, "")}.jpg`,
      });
      patch.set({
        profilePicture: {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
        },
      });
    }

    if (cnicImage && cnicImage.size > 0) {
      const asset = await writeClient.assets.upload("image", cnicImage, {
        filename: `captain-cnic-${email.replace(/[^a-z0-9]/gi, "")}.jpg`,
      });
      patch.set({
        cnicImage: {
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
