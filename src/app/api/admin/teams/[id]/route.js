import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { isValidVillage } from "@/lib/villages";

const TEAM_QUERY = `*[_type == "team" && _id == $id][0]{
  _id, name, sponsorName, village, section, status, wins, losses, points, entryFeeVerified, entryFeeRejected, entryFeePaid, entryFeeReceivedBy,
  "entryFeeImageUrl": entryFeeImage.asset->url,
  "playerCount": count(players),
  "captain": captain->{
    _id, name, fatherName, cnic, villageOrCity, email, whatsapp, phone,
    "profilePictureUrl": profilePicture.asset->url,
    "cnicImageUrl": cnicImage.asset->url
  },
  "players": players[]->{
    _id, name, fatherName, cnic, role, address,
    "profilePictureUrl": profilePicture.asset->url,
    "cnicImageUrl": cnicImage.asset->url
  }
}`;

export async function GET(_request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const team = await writeClient.fetch(TEAM_QUERY, { id });

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({ team });
}

async function parsePatchBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const get = (key) => {
      const value = formData.get(key);
      return value == null || value === "" ? undefined : String(value);
    };
    return {
      action: get("action"),
      name: get("name"),
      sponsorName:
        formData.get("sponsorName") == null
          ? undefined
          : String(formData.get("sponsorName")),
      village:
        formData.get("village") == null
          ? undefined
          : String(formData.get("village")),
      section: get("section"),
      status: get("status"),
      newPassword: get("newPassword"),
      whatsapp: get("whatsapp"),
      captainName: get("captainName"),
      fatherName: get("fatherName"),
      cnic: get("cnic"),
      villageOrCity: get("villageOrCity"),
      entryFeePaid: get("entryFeePaid"),
      entryFeeReceivedBy:
        formData.get("entryFeeReceivedBy") == null
          ? undefined
          : String(formData.get("entryFeeReceivedBy")),
      profilePicture: formData.get("profilePicture"),
      entryFeeImage: formData.get("entryFeeImage"),
    };
  }

  const body = await request.json();
  return { ...body, profilePicture: null };
}

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await parsePatchBody(request);
  const {
    action,
    name,
    sponsorName,
    village,
    section,
    status,
    newPassword,
    whatsapp,
    captainName,
    fatherName,
    cnic,
    villageOrCity,
    entryFeePaid,
    entryFeeReceivedBy,
    profilePicture,
    entryFeeImage,
  } = body;

  if (action === "changePassword") {
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const team = await writeClient.fetch(`*[_type == "team" && _id == $id][0]{ "captainId": captain._ref }`, { id });
    if (!team?.captainId) {
      return NextResponse.json({ error: "Team has no captain" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await writeClient.patch(team.captainId).set({ passwordHash }).commit();
    return NextResponse.json({ success: true });
  }

  if (action === "approve") {
    await writeClient.patch(id).set({ status: "approved" }).commit();
    return NextResponse.json({ success: true });
  }

  if (action === "activate") {
    const team = await writeClient.fetch(
      `*[_type == "team" && _id == $id][0]{
        _id,
        entryFeeVerified,
        "hasEntryFee": defined(entryFeeImage.asset)
      }`,
      { id }
    );

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (!team.entryFeeVerified) {
      return NextResponse.json(
        { error: "Cannot activate team until entry fee is verified by admin" },
        { status: 400 }
      );
    }

    await writeClient.patch(id).set({ status: "active" }).commit();
    return NextResponse.json({ success: true });
  }

  if (action === "verifyEntryFee") {
    const team = await writeClient.fetch(
      `*[_type == "team" && _id == $id][0]{
        _id,
        "hasEntryFee": defined(entryFeeImage.asset)
      }`,
      { id }
    );

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    await writeClient
      .patch(id)
      .set({ entryFeeVerified: true, entryFeeRejected: false })
      .commit();
    return NextResponse.json({ success: true });
  }

  if (action === "rejectEntryFee") {
    const team = await writeClient.fetch(
      `*[_type == "team" && _id == $id][0]{
        _id,
        entryFeeVerified,
        "hasEntryFee": defined(entryFeeImage.asset)
      }`,
      { id }
    );

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Allow rejecting a verified fee too, so an accidental verification can be undone
    if (!team.hasEntryFee && !team.entryFeeVerified) {
      return NextResponse.json({ error: "No entry fee receipt to reject" }, { status: 400 });
    }

    await writeClient
      .patch(id)
      .unset(["entryFeeImage"])
      .set({ entryFeeVerified: false, entryFeeRejected: true })
      .commit();
    return NextResponse.json({ success: true });
  }

  const hasProfilePicture =
    profilePicture && typeof profilePicture === "object" && profilePicture.size > 0;
  const hasEntryFeeImage =
    entryFeeImage && typeof entryFeeImage === "object" && entryFeeImage.size > 0;

  if (
    name !== undefined ||
    sponsorName !== undefined ||
    village !== undefined ||
    section !== undefined ||
    status !== undefined ||
    whatsapp !== undefined ||
    captainName !== undefined ||
    fatherName !== undefined ||
    cnic !== undefined ||
    villageOrCity !== undefined ||
    entryFeePaid !== undefined ||
    entryFeeReceivedBy !== undefined ||
    newPassword !== undefined ||
    hasProfilePicture ||
    hasEntryFeeImage
  ) {
    const team = await writeClient.fetch(
      `*[_type == "team" && _id == $id][0]{ _id, "captainId": captain._ref }`,
      { id }
    );
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (name) {
      const duplicate = await writeClient.fetch(
        `*[_type == "team" && name == $name && _id != $id][0]`,
        { name, id }
      );
      if (duplicate) {
        return NextResponse.json({ error: "Team name already taken" }, { status: 400 });
      }
    }

    const needsCaptainUpdate =
      whatsapp !== undefined ||
      captainName !== undefined ||
      fatherName !== undefined ||
      cnic !== undefined ||
      villageOrCity !== undefined ||
      newPassword !== undefined ||
      hasProfilePicture;

    if (!team.captainId && needsCaptainUpdate) {
      return NextResponse.json({ error: "Team has no captain" }, { status: 400 });
    }

    const captainUpdates = {};

    if (captainName !== undefined) {
      const trimmed = String(captainName).trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Captain name is required" }, { status: 400 });
      }
      captainUpdates.name = trimmed;
    }

    if (fatherName !== undefined) {
      captainUpdates.fatherName = String(fatherName).trim();
    }

    if (cnic !== undefined) {
      captainUpdates.cnic = String(cnic).trim();
    }

    if (villageOrCity !== undefined) {
      captainUpdates.villageOrCity = String(villageOrCity).trim();
    }

    if (whatsapp !== undefined) {
      const digits = String(whatsapp).replace(/\D/g, "");
      if (digits.length !== 11 || !digits.startsWith("03")) {
        return NextResponse.json(
          { error: "Enter a valid 11-digit WhatsApp number (e.g. 03001234567)" },
          { status: 400 }
        );
      }
      const duplicateWhatsapp = await writeClient.fetch(
        `*[_type == "captain" && whatsapp == $whatsapp && _id != $captainId][0]`,
        { whatsapp: digits, captainId: team.captainId }
      );
      if (duplicateWhatsapp) {
        return NextResponse.json(
          { error: "This WhatsApp number is already used by another captain" },
          { status: 400 }
        );
      }
      captainUpdates.whatsapp = digits;
      captainUpdates.phone = digits;
    }

    if (newPassword) {
      if (String(newPassword).length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      captainUpdates.passwordHash = await bcrypt.hash(String(newPassword), 10);
    }

    if (hasProfilePicture) {
      const asset = await writeClient.assets.upload("image", profilePicture, {
        filename: `captain-profile-${team.captainId}.jpg`,
      });
      captainUpdates.profilePicture = {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      };
    }

    if (Object.keys(captainUpdates).length > 0) {
      await writeClient.patch(team.captainId).set(captainUpdates).commit();
    }

    if (entryFeePaid !== undefined) {
      const paid = Number(entryFeePaid);
      if (Number.isNaN(paid) || paid < 0) {
        return NextResponse.json(
          { error: "Paid amount must be a number 0 or greater" },
          { status: 400 }
        );
      }
    }

    if (status === "active") {
      const feeCheck = await writeClient.fetch(
        `*[_type == "team" && _id == $id][0]{
          entryFeeVerified,
          "hasEntryFee": defined(entryFeeImage.asset)
        }`,
        { id }
      );
      if (!feeCheck?.entryFeeVerified && !hasEntryFeeImage) {
        return NextResponse.json(
          { error: "Cannot set status to active until entry fee is verified by admin" },
          { status: 400 }
        );
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (sponsorName !== undefined) updates.sponsorName = String(sponsorName).trim();
    if (village !== undefined) {
      const trimmedVillage = String(village).trim();
      if (trimmedVillage && !isValidVillage(trimmedVillage)) {
        return NextResponse.json(
          { error: "Please select a valid village from the list" },
          { status: 400 }
        );
      }
      updates.village = trimmedVillage;
    }
    if (section !== undefined) {
      updates.section = section;
      updates.newEntry = section === "knockout";
    }
    if (status !== undefined) updates.status = status;
    if (entryFeePaid !== undefined) updates.entryFeePaid = Number(entryFeePaid);
    if (entryFeeReceivedBy !== undefined) {
      updates.entryFeeReceivedBy = String(entryFeeReceivedBy).trim();
    }

    if (hasEntryFeeImage) {
      const asset = await writeClient.assets.upload("image", entryFeeImage, {
        filename: `team-entry-fee-${id}.jpg`,
      });
      updates.entryFeeImage = {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      };
      updates.entryFeeRejected = false;
    }

    if (Object.keys(updates).length > 0) {
      await writeClient.patch(id).set(updates).commit();
    }

    const updated = await writeClient.fetch(TEAM_QUERY, { id });
    return NextResponse.json({ success: true, team: updated });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE(_request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const team = await writeClient.fetch(
    `*[_type == "team" && _id == $id][0]{
      _id,
      "captainId": captain._ref,
      "playerIds": players[]._ref
    }`,
    { id }
  );

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const matchCount = await writeClient.fetch(
    `count(*[_type == "match" && (team1._ref == $id || team2._ref == $id || winner._ref == $id || loser._ref == $id)])`,
    { id }
  );

  if (matchCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete team linked to matches. Remove fixtures first." },
      { status: 400 }
    );
  }

  try {
    const transaction = writeClient.transaction();

    // Remove strong references from the team document first to avoid deletion errors
    transaction.patch(id, (p) => p.unset(["captain", "players"]));

    // Delete players
    for (const playerId of team.playerIds || []) {
      if (playerId) transaction.delete(playerId);
    }
    
    // Delete captain
    if (team.captainId) transaction.delete(team.captainId);
    
    // Delete the team itself
    transaction.delete(id);

    await transaction.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete team error:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
