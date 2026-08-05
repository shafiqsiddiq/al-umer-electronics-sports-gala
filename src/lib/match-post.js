/**
 * Match VS post — card layout, Al Umer emerald + gold palette.
 */

const W = 1080;
const H = 1350;

const GREEN = "#0d9488"; // teal-emerald brand
const GREEN_MID = "#14b8a6";
const GREEN_DARK = "#0f766e";
const GREEN_DEEP = "#115e59";
const GREEN_PALE = "#99f6e4";
const GOLD = "#d4af37";
const GOLD_LIGHT = "#f5e6a8";
const GOLD_DEEP = "#a16207";
const NAVY = "#0c1a2e";
const MUTED = "#5b6b7c";
const WHITE = "#ffffff";
const SAFE = 48;

function loadImage(src, { cors = false } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

async function loadProfileImage(url) {
  if (!url || typeof url !== "string") return null;
  const fromBlob = async (src) => {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const img = await loadImage(objectUrl);
      if (img.decode) await img.decode().catch(() => {});
      return img;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };
  try {
    return await fromBlob(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  } catch {
    /* continue */
  }
  try {
    return await loadImage(url, { cors: true });
  } catch {
    /* continue */
  }
  try {
    return await fromBlob(url);
  } catch {
    return null;
  }
}

function coverImage(ctx, img, x, y, w, h, focusY = 0.15) {
  if (!img) return;
  const ir = img.width / img.height;
  const br = w / h;
  let dw;
  let dh;
  let dx;
  let dy;
  if (ir > br) {
    dh = h;
    dw = h * ir;
    dx = x - (dw - w) / 2;
    dy = y;
  } else {
    dw = w;
    dh = w / ir;
    dx = x;
    dy = y - (dh - h) * focusY;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, maxSize, minSize = 16) {
  let size = maxSize;
  ctx.font = `900 ${size}px Arial Black, Impact, Arial, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `900 ${size}px Arial Black, Impact, Arial, sans-serif`;
  }
  return size;
}

function wrapLines(ctx, text, maxWidth, maxLines = 2) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return ["TBD"];
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines.slice(0, maxLines);
}

function drawPill(ctx, text, x, y, opts = {}) {
  const {
    bg = GREEN,
    color = WHITE,
    fontSize = 18,
    padX = 18,
    padY = 10,
    radius = 999,
  } = opts;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  const tw = ctx.measureText(text).width;
  const w = tw + padX * 2;
  const h = fontSize + padY * 2;
  roundRectPath(ctx, x - w / 2, y - h / 2, w, h, radius);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 1);
  return { w, h };
}

function drawTimeBadge(ctx, label, x, y, variant) {
  const isStart = variant === "start";
  const h = 44;
  ctx.font = "900 20px Arial, sans-serif";
  const tw = ctx.measureText(label).width;
  const w = tw + 22 + 36;
  const left = isStart ? x : x - w;

  ctx.save();
  ctx.shadowColor = "rgba(12,26,46,0.16)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  roundRectPath(ctx, left, y, w, h, 22);
  if (isStart) {
    const g = ctx.createLinearGradient(left, y, left + w, y + h);
    g.addColorStop(0, GOLD_LIGHT);
    g.addColorStop(0.55, GOLD);
    g.addColorStop(1, GOLD_DEEP);
    ctx.fillStyle = g;
  } else {
    const g = ctx.createLinearGradient(left, y, left + w, y + h);
    g.addColorStop(0, GREEN_MID);
    g.addColorStop(1, GREEN_DEEP);
    ctx.fillStyle = g;
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const color = isStart ? NAVY : WHITE;
  const cx = left + 22;
  const cy = y + h / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - 5);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 4, cy + 2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "900 20px Arial, sans-serif";
  ctx.fillText(label, left + 38, cy + 1);
  ctx.restore();
}

function drawDashedCircle(ctx, cx, cy, r, color, lineWidth = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCaptainSide(ctx, { img, teamName, captainName, cx, photoCy, photoSize, maxNameW }) {
  // Team name above photo
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = NAVY;
  const nameSize = fitText(ctx, teamName, maxNameW, 28, 16);
  ctx.font = `900 ${nameSize}px Arial Black, Impact, Arial, sans-serif`;
  const nameLines = wrapLines(ctx, String(teamName).toUpperCase(), maxNameW, 2);
  nameLines.forEach((line, i) => {
    ctx.fillText(line, cx, photoCy - photoSize / 2 - 28 - (nameLines.length - 1 - i) * (nameSize + 4));
  });

  // Dashed rings
  drawDashedCircle(ctx, cx, photoCy, photoSize / 2 + 28, "rgba(13,148,136,0.28)", 2);
  drawDashedCircle(ctx, cx, photoCy, photoSize / 2 + 14, "rgba(212,175,55,0.35)", 1.5);

  // Gradient ring — teal → gold
  const ringPad = 6;
  const outerR = photoSize / 2 + ringPad;
  const g = ctx.createLinearGradient(cx - outerR, photoCy - outerR, cx + outerR, photoCy + outerR);
  g.addColorStop(0, GREEN_PALE);
  g.addColorStop(0.45, GREEN);
  g.addColorStop(0.75, GOLD);
  g.addColorStop(1, GOLD_DEEP);

  ctx.save();
  ctx.shadowColor = "rgba(13,148,136,0.35)";
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.arc(cx, photoCy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  // White ring + photo
  ctx.beginPath();
  ctx.arc(cx, photoCy, photoSize / 2 + 3, 0, Math.PI * 2);
  ctx.fillStyle = WHITE;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, photoCy, photoSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#e2e8f0";
  ctx.fill();
  ctx.clip();
  if (img) {
    coverImage(ctx, img, cx - photoSize / 2, photoCy - photoSize / 2, photoSize, photoSize, 0.15);
  } else {
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(cx - photoSize / 2, photoCy - photoSize / 2, photoSize, photoSize);
    ctx.fillStyle = MUTED;
    ctx.font = `900 ${Math.floor(photoSize * 0.28)}px Arial Black, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", cx, photoCy);
  }
  ctx.restore();

  // Captain pill
  const cap = (captainName || teamName || "TBA").toUpperCase();
  const pillY = photoCy + photoSize / 2 + 36;
  ctx.font = "bold 20px Arial, sans-serif";
  let pillText = cap;
  const maxPillW = maxNameW * 0.95;
  while (ctx.measureText(pillText).width + 40 > maxPillW && pillText.length > 8) {
    pillText = `${pillText.slice(0, -2)}…`;
  }
  drawPill(ctx, pillText, cx, pillY, {
    bg: GREEN_DEEP,
    color: WHITE,
    fontSize: 20,
    padX: 22,
    padY: 11,
  });
}

/**
 * @param {object} opts
 * @param {object} opts.match
 * @param {string} [opts.startLabel]
 * @param {string} [opts.endLabel]
 * @param {string} [opts.timeRange]
 */
export async function generateMatchPost({
  match,
  startLabel = "5:30 PM",
  endLabel = "",
  timeRange = "",
}) {
  const team1 = match?.team1;
  const team2 = match?.team2;
  const name1 = team1?.name || "TBD";
  const name2 = team2?.name || "TBD";
  const cap1 = team1?.captain?.name || "";
  const cap2 = team2?.captain?.name || "";
  const photo1 = team1?.captain?.profilePictureUrl || "";
  const photo2 = team2?.captain?.profilePictureUrl || "";
  const section =
    match?.section === "knockout"
      ? "Knockout"
      : match?.section === "loser_ab" || match?.section === "loser"
        ? "Loser AB"
        : match?.section
          ? `Group ${match.section}`
          : "Match";
  const round = match?.round ?? 1;
  const matchNo = match?.matchNumber ?? 1;
  const displayTime =
    timeRange ||
    (endLabel ? `${startLabel} – ${endLabel}` : startLabel) ||
    "5:30 PM";

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const [logo, img1, img2] = await Promise.all([
    loadImage("/al_umer_electronics_logo_v2.png").catch(() =>
      loadImage("/al_umer_electronics_logo.png").catch(() => null)
    ),
    loadProfileImage(photo1),
    loadProfileImage(photo2),
  ]);

  // —— Soft teal → cream wash ——
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#e6fffa");
  bg.addColorStop(0.28, "#f0fdfa");
  bg.addColorStop(0.55, "#fffef8");
  bg.addColorStop(1, "#f8fafc");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft gold corner glow
  const glow = ctx.createRadialGradient(W, 0, 20, W, 0, 420);
  glow.addColorStop(0, "rgba(212,175,55,0.18)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Left teal accent bar
  const bar = ctx.createLinearGradient(0, 0, 0, H);
  bar.addColorStop(0, GOLD);
  bar.addColorStop(0.35, GREEN);
  bar.addColorStop(1, GREEN_DEEP);
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, 14, H);

  // Dot pattern (top-right)
  ctx.save();
  ctx.globalAlpha = 0.2;
  for (let x = W - 280; x < W - 20; x += 14) {
    for (let y = 20; y < 220; y += 14) {
      const dist = Math.hypot(x - (W - 20), y - 20);
      if (dist > 200) continue;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = GREEN_DARK;
      ctx.fill();
    }
  }
  ctx.restore();

  // Outer soft card frame
  ctx.strokeStyle = "rgba(13,148,136,0.28)";
  ctx.lineWidth = 3;
  roundRectPath(ctx, 20, 20, W - 40, H - 40, 36);
  ctx.stroke();

  // Time badges
  if (startLabel) drawTimeBadge(ctx, startLabel, SAFE + 8, 44, "start");
  if (endLabel) drawTimeBadge(ctx, endLabel, W - SAFE - 8, 44, "end");

  // Round / Match chips
  let chipY = 120;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const roundLabel = `ROUND ${round}`;
  const matchLabel = `MATCH ${matchNo}`;
  ctx.font = "900 16px Arial, sans-serif";
  const roundW = ctx.measureText(roundLabel).width + 36;
  const matchW = ctx.measureText(matchLabel).width + 36;
  const gap = 14;
  const chipsTotal = roundW + matchW + gap;
  const chipsStart = (W - chipsTotal) / 2;

  roundRectPath(ctx, chipsStart, chipY - 16, roundW, 32, 16);
  const roundGrad = ctx.createLinearGradient(chipsStart, 0, chipsStart + roundW, 0);
  roundGrad.addColorStop(0, GREEN);
  roundGrad.addColorStop(1, GREEN_DEEP);
  ctx.fillStyle = roundGrad;
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.fillText(roundLabel, chipsStart + roundW / 2, chipY + 1);

  roundRectPath(ctx, chipsStart + roundW + gap, chipY - 16, matchW, 32, 16);
  ctx.fillStyle = "rgba(212,175,55,0.18)";
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, chipsStart + roundW + gap, chipY - 16, matchW, 32, 16);
  ctx.stroke();
  ctx.fillStyle = GOLD_DEEP;
  ctx.fillText(matchLabel, chipsStart + roundW + gap + matchW / 2, chipY + 1);

  // Logo + brand title
  let y = 175;
  if (logo) {
    const lw = 120;
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, y, lw, lh);
    y += lh + 18;
  }

  ctx.fillStyle = NAVY;
  ctx.font = "900 42px Arial Black, Impact, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AL UMER ELECTRONICS", W / 2, y);
  y += 42;

  // Gold subtitle
  const subtitle = "SPORTS GALA S3";
  {
    const spacing = 10;
    ctx.font = "900 24px Arial Black, Arial, sans-serif";
    let total = 0;
    for (const ch of subtitle) total += ctx.measureText(ch).width + spacing;
    total -= spacing;
    let sx = W / 2 - total / 2;
    const subGrad = ctx.createLinearGradient(0, y - 12, 0, y + 12);
    subGrad.addColorStop(0, GOLD_LIGHT);
    subGrad.addColorStop(0.45, GOLD);
    subGrad.addColorStop(1, GOLD_DEEP);
    ctx.fillStyle = subGrad;
    for (const ch of subtitle) {
      ctx.fillText(ch, sx + ctx.measureText(ch).width / 2, y);
      sx += ctx.measureText(ch).width + spacing;
    }
  }

  // Captains
  const photoSize = 280;
  const photoCy = 620;
  const leftCx = W * 0.27;
  const rightCx = W * 0.73;
  const maxNameW = W * 0.38;

  drawCaptainSide(ctx, {
    img: img1,
    teamName: name1,
    captainName: cap1,
    cx: leftCx,
    photoCy,
    photoSize,
    maxNameW,
  });
  drawCaptainSide(ctx, {
    img: img2,
    teamName: name2,
    captainName: cap2,
    cx: rightCx,
    photoCy,
    photoSize,
    maxNameW,
  });

  // VS circle — gold ring, teal text
  ctx.save();
  ctx.shadowColor = "rgba(12,26,46,0.18)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.arc(W / 2, photoCy, 74, 0, Math.PI * 2);
  const vsRing = ctx.createLinearGradient(W / 2 - 74, photoCy, W / 2 + 74, photoCy);
  vsRing.addColorStop(0, GOLD_LIGHT);
  vsRing.addColorStop(0.5, GOLD);
  vsRing.addColorStop(1, GREEN);
  ctx.fillStyle = vsRing;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.beginPath();
  ctx.arc(W / 2, photoCy, 62, 0, Math.PI * 2);
  ctx.fillStyle = WHITE;
  ctx.fill();
  ctx.fillStyle = GREEN_DEEP;
  ctx.font = "900 44px Arial Black, Impact, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VS", W / 2, photoCy + 2);
  ctx.restore();

  // Meta row
  const metaY = 930;
  ctx.fillStyle = NAVY;
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${section}  ·  Round ${round}  ·  Match ${matchNo}`, W / 2, metaY);

  // Time range pill — deep teal
  drawPill(ctx, displayTime, W / 2, metaY + 52, {
    bg: GREEN_DEEP,
    color: WHITE,
    fontSize: 24,
    padX: 28,
    padY: 14,
  });

  // Scheduled chip
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.fillStyle = GREEN;
  ctx.fillText("●  SCHEDULED", W / 2, metaY + 110);

  // Footer CTA — gold plaque
  const fy = H - 130;
  roundRectPath(ctx, SAFE, fy, W - SAFE * 2, 78, 24);
  const footGrad = ctx.createLinearGradient(SAFE, fy, SAFE, fy + 78);
  footGrad.addColorStop(0, GOLD_LIGHT);
  footGrad.addColorStop(0.5, GOLD);
  footGrad.addColorStop(1, GOLD_DEEP);
  ctx.fillStyle = footGrad;
  ctx.fill();

  ctx.fillStyle = NAVY;
  ctx.font = "900 26px Arial Black, Arial, sans-serif";
  ctx.fillText("CRICKET KA MELA — DEKHNE AAO!", W / 2, fy + 32);
  ctx.fillStyle = "rgba(12,26,46,0.72)";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Al Umer Electronics Sports Gala Season 3", W / 2, fy + 58);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create image"))),
      "image/png",
      0.95
    );
  });

  const safe = `${name1}-vs-${name2}`
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const filename = `match-r${round}-m${matchNo}-${safe || "fixture"}.png`;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);

  return { filename, blob, url: objectUrl };
}
