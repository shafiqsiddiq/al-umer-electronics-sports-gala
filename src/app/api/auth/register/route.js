import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { writeClient } from "@/lib/sanity";
import { createToken } from "@/lib/auth";
import { validateCnic } from "@/lib/cnic";

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
    const fatherName = formData.get("fatherName");
    const cnic = formData.get("cnic");
    const whatsapp = formData.get("whatsapp");
    const password = formData.get("password");
    const teamName = formData.get("teamName");
    const villageOrCity = formData.get("villageOrCity");
    const profilePicture = formData.get("profilePicture");
    const cnicImage = formData.get("cnicImage");
    const entryFeeImage = formData.get("entryFeeImage");

    if (!captainName || !fatherName || !cnic || !whatsapp || !password || !teamName || !villageOrCity) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    if (!validateCnic(cnic)) {
      return NextResponse.json({ error: "Invalid CNIC format. Use 35201-8511102-5" }, { status: 400 });
    }

    if (!profilePicture || profilePicture.size === 0) {
      return NextResponse.json({ error: "Profile picture is required" }, { status: 400 });
    }
    if (!cnicImage || cnicImage.size === 0) {
      return NextResponse.json({ error: "CNIC upload is required" }, { status: 400 });
    }

    const hasEntryFee =
      entryFeeImage &&
      typeof entryFeeImage === "object" &&
      typeof entryFeeImage.size === "number" &&
      entryFeeImage.size > 0;

    // Run uniqueness checks in parallel
    const [existingCnic, teamExisting] = await Promise.all([
      writeClient.fetch(`*[_type in ["captain", "player"] && cnic == $cnic][0]._id`, { cnic }),
      writeClient.fetch(`*[_type == "team" && name == $teamName][0]._id`, { teamName }),
    ]);

    if (existingCnic) {
      return NextResponse.json({ error: "CNIC already registered" }, { status: 400 });
    }
    if (teamExisting) {
      return NextResponse.json({ error: "Team name already taken" }, { status: 400 });
    }

    const teamId = `team.${crypto.randomUUID()}`;
    const captainId = `captain.${crypto.randomUUID()}`;

    // Hash password + upload required images in parallel; entry fee is optional
    const [passwordHash, profileAsset, cnicAsset, entryFeeAsset] = await Promise.all([
      bcrypt.hash(password, 8),
      uploadImage(profilePicture, safeFilename("captain-profile", cnic)),
      uploadImage(cnicImage, safeFilename("captain-cnic", cnic)),
      hasEntryFee
        ? uploadImage(entryFeeImage, safeFilename("team-entry-fee", teamName))
        : Promise.resolve(null),
    ]);

    // Create team + captain + link in a single Sanity transaction
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
        fatherName,
        cnic,
        whatsapp,
        villageOrCity,
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
        team: { _type: "reference", _ref: teamId },
      })
      .commit({ autoGenerateArrayKeys: true });

    const token = await createToken({
      role: "captain",
      captainId,
      teamId,
      cnic,
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
