import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { resolveTeamSection } from "@/lib/tournament-logic";
import { isValidVillage } from "@/lib/villages";

function safeFilename(prefix, value, ext = "jpg") {
  const slug =
    String(value || "file")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 40) || "file";
  return `${prefix}-${slug}.${ext}`;
}

async function uploadImage(file, filename) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return writeClient.assets.upload("image", buffer, {
    filename,
    contentType: file.type || "image/jpeg",
  });
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teams = await writeClient.fetch(`
    *[_type == "team"] | order(coalesce(entryFeePaid, 0) desc, name asc) {
      _id, name, sponsorName, village, section, status, entryFeeVerified, entryFeeRejected, entryFeePaid, entryFeeReceivedBy,
      "playerCount": count(players),
      "entryFeeImageUrl": entryFeeImage.asset->url,
      "captain": captain->{
        name,
        fatherName,
        cnic,
        villageOrCity,
        whatsapp,
        phone,
        "profilePictureUrl": profilePicture.asset->url
      }
    }
  `);

  return NextResponse.json({ teams });
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const teamName = String(formData.get("teamName") || "").trim();
    const sponsorName = String(formData.get("sponsorName") || "").trim();
    const village = String(formData.get("village") || "").trim();
    const captainName = String(formData.get("captainName") || "").trim();
    const whatsapp = String(formData.get("whatsapp") || "").replace(/\D/g, "");
    const password = String(formData.get("password") || "");
    const fatherName = String(formData.get("fatherName") || "").trim();
    const cnic = String(formData.get("cnic") || "").trim();
    const villageOrCity = String(formData.get("villageOrCity") || "").trim();
    const sectionRaw = String(formData.get("section") || "unassigned");
    const status = String(formData.get("status") || "pending");
    const entryFeePaid = Number(formData.get("entryFeePaid") || 0);
    const entryFeeReceivedBy = String(formData.get("entryFeeReceivedBy") || "").trim();
    const profilePicture = formData.get("profilePicture");
    const entryFeeImage = formData.get("entryFeeImage");

    if (!teamName || !captainName || !whatsapp || !password) {
      return NextResponse.json(
        { error: "Team name, captain name, WhatsApp and password are required" },
        { status: 400 }
      );
    }

    if (village && !isValidVillage(village)) {
      return NextResponse.json(
        { error: "Please select a valid village from the list" },
        { status: 400 }
      );
    }

    if (whatsapp.length !== 11 || !whatsapp.startsWith("03")) {
      return NextResponse.json(
        { error: "Enter a valid 11-digit WhatsApp number (e.g. 03001234567)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (!profilePicture || profilePicture.size === 0) {
      return NextResponse.json(
        { error: "Captain profile picture is required" },
        { status: 400 }
      );
    }

    if (Number.isNaN(entryFeePaid) || entryFeePaid < 0) {
      return NextResponse.json(
        { error: "Paid amount must be 0 or greater" },
        { status: 400 }
      );
    }

    const allowedSections = ["unassigned", "A", "B", "C", "knockout"];
    const allowedStatuses = [
      "pending",
      "approved",
      "active",
      "eliminated",
      "qualified_main",
      "qualified_loser",
      "final_eight",
    ];
    if (!allowedSections.includes(sectionRaw)) {
      return NextResponse.json({ error: "Invalid group" }, { status: 400 });
    }
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const hasEntryFee =
      entryFeeImage &&
      typeof entryFeeImage === "object" &&
      typeof entryFeeImage.size === "number" &&
      entryFeeImage.size > 0;

    const [existingWhatsapp, teamExisting, existingTeamCount] = await Promise.all([
      writeClient.fetch(
        `*[_type == "captain" && (whatsapp == $whatsapp || phone == $whatsapp)][0]._id`,
        { whatsapp }
      ),
      writeClient.fetch(`*[_type == "team" && name == $teamName][0]._id`, {
        teamName,
      }),
      writeClient.fetch(`count(*[_type == "team"])`),
    ]);

    if (existingWhatsapp) {
      return NextResponse.json(
        { error: "This phone number is already registered" },
        { status: 400 }
      );
    }
    if (teamExisting) {
      return NextResponse.json({ error: "Team name already taken" }, { status: 400 });
    }

    if (status === "active" && !hasEntryFee) {
      return NextResponse.json(
        { error: "Upload entry fee receipt before setting status to active" },
        { status: 400 }
      );
    }

    const { section, newEntry } = resolveTeamSection(existingTeamCount, sectionRaw);

    const teamId = `team.${crypto.randomUUID()}`;
    const captainId = `captain.${crypto.randomUUID()}`;

    const [passwordHash, profileAsset, entryFeeAsset] = await Promise.all([
      bcrypt.hash(password, 8),
      uploadImage(profilePicture, safeFilename("captain-profile", whatsapp)),
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
        ...(sponsorName ? { sponsorName } : {}),
        ...(village ? { village } : {}),
        section,
        newEntry,
        status: status === "active" ? "approved" : status,
        players: [],
        wins: 0,
        losses: 0,
        points: 0,
        runsScored: 0,
        runsConceded: 0,
        entryFeeVerified: false,
        entryFeeRejected: false,
        entryFeePaid,
        ...(entryFeeReceivedBy ? { entryFeeReceivedBy } : {}),
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
        ...(fatherName ? { fatherName } : {}),
        ...(cnic ? { cnic } : {}),
        ...(villageOrCity ? { villageOrCity } : {}),
        whatsapp,
        phone: whatsapp,
        passwordHash,
        profilePicture: {
          _type: "image",
          asset: { _type: "reference", _ref: profileAsset._id },
        },
        team: { _type: "reference", _ref: teamId },
      })
      .commit({ autoGenerateArrayKeys: true });

    // If admin requested active and fee uploaded, verify + activate
    if (status === "active" && entryFeeAsset) {
      await writeClient
        .patch(teamId)
        .set({ status: "active", entryFeeVerified: true, entryFeeRejected: false })
        .commit();
    }

    const team = await writeClient.fetch(
      `*[_type == "team" && _id == $id][0]{
        _id, name, sponsorName, village, section, status, entryFeeVerified, entryFeeRejected, entryFeePaid, entryFeeReceivedBy,
        "playerCount": count(players),
        "entryFeeImageUrl": entryFeeImage.asset->url,
        "captain": captain->{
          _id, name, fatherName, cnic, villageOrCity, whatsapp, phone,
          "profilePictureUrl": profilePicture.asset->url
        }
      }`,
      { id: teamId }
    );

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error) {
    console.error("Admin register team error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to register team" },
      { status: 500 }
    );
  }
}
