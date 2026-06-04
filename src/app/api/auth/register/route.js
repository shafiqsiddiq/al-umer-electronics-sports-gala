import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { writeClient } from "@/lib/sanity";
import { createToken } from "@/lib/auth";
import { validateCnic } from "@/lib/cnic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const captainName = formData.get("captainName");
    const fatherName = formData.get("fatherName");
    const cnic = formData.get("cnic");
    const email = formData.get("email");
    const whatsapp = formData.get("whatsapp");
    const password = formData.get("password");
    const teamName = formData.get("teamName");
    const profilePicture = formData.get("profilePicture");
    const cnicImage = formData.get("cnicImage");

    if (!captainName || !fatherName || !cnic || !email || !whatsapp || !password || !teamName) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    if (!validateCnic(cnic)) {
      return NextResponse.json({ error: "Invalid CNIC format. Use 35201-8511102-5" }, { status: 400 });
    }

    const existingCnic = await writeClient.fetch(
      `*[_type in ["captain", "player"] && cnic == $cnic][0]`,
      { cnic }
    );
    if (existingCnic) {
      return NextResponse.json({ error: "CNIC already registered" }, { status: 400 });
    }

    if (!profilePicture || profilePicture.size === 0) {
      return NextResponse.json({ error: "Profile picture is required" }, { status: 400 });
    }

    if (!cnicImage || cnicImage.size === 0) {
      return NextResponse.json({ error: "CNIC upload is required" }, { status: 400 });
    }

    const existing = await writeClient.fetch(
      `*[_type == "captain" && email == $email][0]`,
      { email }
    );
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const teamExisting = await writeClient.fetch(
      `*[_type == "team" && name == $teamName][0]`,
      { teamName }
    );
    if (teamExisting) {
      return NextResponse.json({ error: "Team name already taken" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const profileAsset = await writeClient.assets.upload("image", profilePicture, {
      filename: `captain-profile-${email.replace(/[^a-z0-9]/gi, "")}.jpg`,
    });

    const cnicAsset = await writeClient.assets.upload("image", cnicImage, {
      filename: `captain-cnic-${email.replace(/[^a-z0-9]/gi, "")}.jpg`,
    });

    const team = await writeClient.create({
      _type: "team",
      name: teamName,
      section: "unassigned",
      status: "pending",
      players: [],
      wins: 0,
      losses: 0,
      points: 0,
      runsScored: 0,
      runsConceded: 0,
    });

    const captain = await writeClient.create({
      _type: "captain",
      name: captainName,
      fatherName,
      cnic,
      email,
      whatsapp,
      phone: whatsapp,
      passwordHash,
      profilePicture: {
        _type: "image",
        asset: { _type: "reference", _ref: profileAsset._id },
      },
      cnicImage: {
        _type: "image",
        asset: { _type: "reference", _ref: cnicAsset._id },
      },
      team: { _type: "reference", _ref: team._id },
    });

    await writeClient.patch(team._id).set({
      captain: { _type: "reference", _ref: captain._id },
    }).commit();

    const token = await createToken({
      role: "captain",
      captainId: captain._id,
      teamId: team._id,
      email,
    });

    const response = NextResponse.json({
      success: true,
      captainId: captain._id,
      teamId: team._id,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    const message = error?.message || "";
    if (message.includes("Insufficient permissions") || message.includes('permission "create"')) {
      return NextResponse.json(
        {
          error:
            "Sanity API token has no write access. Create a new token with Editor permissions at sanity.io/manage → bubodoq1 → API → Tokens.",
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message || "Registration failed" : "Registration failed" },
      { status: 500 }
    );
  }
}
