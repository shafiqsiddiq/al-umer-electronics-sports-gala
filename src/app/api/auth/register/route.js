import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { writeClient } from "@/lib/sanity";
import { createToken } from "@/lib/auth";

function safeFilename(prefix, value, ext = "jpg") {
  const slug = String(value || "file").replace(/[^a-z0-9]/gi, "").slice(0, 40) || "file";
  return `${prefix}-${slug}.${ext}`;
}

async function uploadImage(file, filename) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return writeClient.assets.upload("image", buffer, {
    filename,
    contentType: file.type || "image/jpeg",
  });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const captainName = formData.get("captainName");
    const whatsapp = formData.get("whatsapp");
    const password = formData.get("password");
    const teamName = formData.get("teamName");
    const profilePicture = formData.get("profilePicture");
    const entryFeeImage = formData.get("entryFeeImage");

    if (!captainName || !whatsapp || !password || !teamName) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    const digits = String(whatsapp).replace(/\D/g, "");
    if (digits.length !== 11 || !digits.startsWith("03")) {
      return NextResponse.json(
        { error: "Enter a valid 11-digit WhatsApp number (e.g. 03001234567)" },
        { status: 400 }
      );
    }

    if (!profilePicture || profilePicture.size === 0) {
      return NextResponse.json({ error: "Profile picture is required" }, { status: 400 });
    }

    const hasEntryFee =
      entryFeeImage &&
      typeof entryFeeImage === "object" &&
      typeof entryFeeImage.size === "number" &&
      entryFeeImage.size > 0;

    const [existingWhatsapp, teamExisting] = await Promise.all([
      writeClient.fetch(
        `*[_type == "captain" && (whatsapp == $whatsapp || phone == $whatsapp)][0]._id`,
        { whatsapp: digits }
      ),
      writeClient.fetch(`*[_type == "team" && name == $teamName][0]._id`, { teamName }),
    ]);

    if (existingWhatsapp) {
      return NextResponse.json({ error: "This phone number is already registered" }, { status: 400 });
    }
    if (teamExisting) {
      return NextResponse.json({ error: "Team name already taken" }, { status: 400 });
    }

    const teamId = `team.${crypto.randomUUID()}`;
    const captainId = `captain.${crypto.randomUUID()}`;

    const [passwordHash, profileAsset, entryFeeAsset] = await Promise.all([
      bcrypt.hash(password, 8),
      uploadImage(profilePicture, safeFilename("captain-profile", digits)),
      hasEntryFee
        ? uploadImage(entryFeeImage, safeFilename("team-entry-fee", teamName))
        : Promise.resolve(null),
    ]);

    await writeClient
      .transaction()
      .create({
        _id: teamId,
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
        entryFeeVerified: false,
        ...(entryFeeAsset
          ? {
              entryFeeImage: {
                _type: "image",
                asset: { _type: "reference", _ref: entryFeeAsset._id },
              },
            }
          : {}),
        captain: { _type: "reference", _ref: captainId },
      })
      .create({
        _id: captainId,
        _type: "captain",
        name: captainName,
        whatsapp: digits,
        phone: digits,
        passwordHash,
        profilePicture: {
          _type: "image",
          asset: { _type: "reference", _ref: profileAsset._id },
        },
        team: { _type: "reference", _ref: teamId },
      })
      .commit({ autoGenerateArrayKeys: true });

    const token = await createToken({
      role: "captain",
      captainId,
      teamId,
      whatsapp: digits,
    });

    const response = NextResponse.json({
      success: true,
      captainId,
      teamId,
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
