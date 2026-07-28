/**
 * Welcome post — final Sports Gala design match.
 * White brand + 3D gold SPORTS GALA | photo + green shields | dark green card + values
 */

const W = 1080;
const H = 1600;
const GOLD = "#d4af37";
const GOLD_LIGHT = "#ffe9a0";
const GOLD_DEEP = "#8a6a0a";
const GREEN = "#1a9b4a";
const GREEN_DARK = "#0a3d28";
const CARD_BG = "#062e22";
const SAFE = 40;

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

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, maxSize, minSize = 20) {
  let size = maxSize;
  ctx.font = `900 ${size}px Arial Black, Impact, Arial, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px Arial Black, Impact, Arial, sans-serif`;
  }
  return size;
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function goldFill(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, GOLD_DEEP);
  g.addColorStop(0.3, GOLD);
  g.addColorStop(0.5, GOLD_LIGHT);
  g.addColorStop(0.7, GOLD);
  g.addColorStop(1, GOLD_DEEP);
  return g;
}

function drawGold3DText(ctx, text, x, y, size, maxWidth) {
  let s = size;
  ctx.font = `900 ${s}px Arial Black, Impact, Arial, sans-serif`;
  while (s > 28 && ctx.measureText(text).width > maxWidth) {
    s -= 2;
    ctx.font = `900 ${s}px Arial Black, Impact, Arial, sans-serif`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 8; i >= 1; i--) {
    ctx.fillStyle = `rgba(50,35,0,${0.3 + i * 0.05})`;
    ctx.fillText(text, x + i * 0.9, y + i * 1.1);
  }
  ctx.lineWidth = Math.max(2, s * 0.04);
  ctx.strokeStyle = "rgba(40,25,0,0.9)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = goldFill(ctx, x - 280, y - s / 2, x + 280, y + s / 2);
  ctx.fillText(text, x, y);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 400, y - s * 0.5, 800, s * 0.32);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.fillText(text, x, y);
  ctx.restore();
  return s;
}

function drawConfetti(ctx) {
  const colors = [GOLD, GOLD_LIGHT, "#fff", "#2ecc71", "#f1c40f"];
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * W;
    const y = 40 + Math.random() * (H * 0.45);
    const s = 2 + Math.random() * 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI);
    ctx.globalAlpha = 0.35 + Math.random() * 0.45;
    ctx.fillStyle = colors[i % colors.length];
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-s / 2, -s / 4, s, s / 2);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawFirework(ctx, cx, cy, radius = 55) {
  const colors = [GOLD, GOLD_LIGHT, "#fff", "#2ecc71", "#ffd700"];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const len = radius * (0.5 + (i % 3) * 0.18);
    const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.4, colors[i % colors.length]);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.stroke();
  }
}

function drawBat(ctx, x, y, scale = 1, angle = -0.4) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  const blade = ctx.createLinearGradient(-12, -60, 12, 20);
  blade.addColorStop(0, "#f5e0b0");
  blade.addColorStop(1, "#c4893a");
  ctx.fillStyle = blade;
  roundRect(ctx, -12, -62, 24, 85, 6);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  roundRect(ctx, -7, 20, 14, 42, 3);
  ctx.fill();
  ctx.restore();
}

function drawBall(ctx, x, y, r = 22) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 8;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
  g.addColorStop(0, "#ff6b5a");
  g.addColorStop(0.5, "#c0392b");
  g.addColorStop(1, "#4a100c");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, -0.9, 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, Math.PI - 0.9, Math.PI + 0.9);
  ctx.stroke();
  ctx.restore();
}

/** Green shield with gold stripes + star (final design) */
function drawGreenShield(ctx, cx, cy, scale = 1, mirror = false) {
  ctx.save();
  ctx.translate(cx, cy);
  if (mirror) ctx.scale(-1, 1);
  ctx.scale(scale, scale);
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 14;

  // Shield outline
  ctx.beginPath();
  ctx.moveTo(8, -95);
  ctx.lineTo(72, -88);
  ctx.quadraticCurveTo(95, -40, 88, 20);
  ctx.quadraticCurveTo(78, 70, 40, 100);
  ctx.lineTo(8, 110);
  ctx.closePath();
  const sg = ctx.createLinearGradient(8, -95, 90, 110);
  sg.addColorStop(0, "#0d5c38");
  sg.addColorStop(0.5, "#0a3d28");
  sg.addColorStop(1, "#062818");
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = goldFill(ctx, 8, -95, 90, 110);
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner gold stripes (facing circle)
  ctx.shadowBlur = 0;
  for (let i = 0; i < 5; i++) {
    const sy = -70 + i * 28;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(18, sy);
    ctx.lineTo(58, sy + 4);
    ctx.stroke();
  }

  // Gold star at tip
  ctx.fillStyle = GOLD_LIGHT;
  ctx.beginPath();
  const sx = 42;
  const sy = 88;
  for (let j = 0; j < 5; j++) {
    const a = (j * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = sx + Math.cos(a) * 14;
    const py = sy + Math.sin(a) * 14;
    if (j === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPhoto(ctx, img, cx, cy, size, letter) {
  const r = size / 2;

  // Glow ring
  const glow = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.35);
  glow.addColorStop(0, "rgba(255,233,160,0.4)");
  glow.addColorStop(0.5, "rgba(212,175,55,0.15)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
  ctx.strokeStyle = goldFill(ctx, cx - r, cy - r, cx + r, cy + r);
  ctx.lineWidth = 16;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img && img.width > 0) {
    const scale = Math.max(size / img.width, size / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, GREEN_DARK);
    g.addColorStop(1, GREEN);
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, size, size);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.font = "900 110px Arial Black, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, cx, cy);
  }
  ctx.restore();
}

function drawLogoCircle(ctx, logo, cx, cy, size = 70) {
  // Rounded white badge — shows full rectangular logo (contain fit)
  const w = size * 1.35;
  const h = size;
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 14;
  roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 14);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.shadowBlur = 0;

  roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 14);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  if (logo && logo.width > 0) {
    const pad = 8;
    const maxW = w - pad * 2;
    const maxH = h - pad * 2;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const dw = logo.width * scale;
    const dh = logo.height * scale;
    ctx.drawImage(logo, cx - dw / 2, cy - dh / 2, dw, dh);
  }
  ctx.restore();
}

function drawCalendarIcon(ctx, x, y, s = 18) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 2;
  roundRect(ctx, -s / 2, -s / 2 + 2, s, s - 2, 3);
  ctx.stroke();
  ctx.fillRect(-s / 2, -s / 2 + 2, s, 5);
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.beginPath();
  ctx.moveTo(-4, -s / 2);
  ctx.lineTo(-4, -s / 2 + 6);
  ctx.moveTo(4, -s / 2);
  ctx.lineTo(4, -s / 2 + 6);
  ctx.stroke();
  ctx.restore();
}

function drawValueIcon(ctx, cx, cy, type, size = 56) {
  const r = size / 2;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 8;

  // Solid gold circle badge
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = goldFill(ctx, cx - r, cy - r, cx + r, cy + r);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Dark inner plate for contrast
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(8,40,30,0.92)";
  ctx.fill();

  ctx.fillStyle = GOLD_LIGHT;
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (type === "unity") {
    // 3 people — clear filled shapes
    const heads = [-12, 0, 12];
    for (const dx of heads) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy - 8, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + dx, cy + 8, 8, 7, 0, Math.PI, 0);
      ctx.fill();
    }
  } else if (type === "respect") {
    // Trophy
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy - 10);
    ctx.lineTo(cx + 11, cy - 10);
    ctx.quadraticCurveTo(cx + 13, cy + 2, cx, cy + 8);
    ctx.quadraticCurveTo(cx - 13, cy + 2, cx - 11, cy - 10);
    ctx.closePath();
    ctx.fill();
    // handles
    ctx.beginPath();
    ctx.arc(cx - 11, cy - 2, 6, Math.PI * 0.2, Math.PI * 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 11, cy - 2, 6, -Math.PI * 0.2, Math.PI * 0.8, true);
    ctx.stroke();
    ctx.fillRect(cx - 3, cy + 8, 6, 6);
    ctx.fillRect(cx - 10, cy + 14, 20, 4);
  } else {
    // Star — larger & filled
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
      const a = (j * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = cx + Math.cos(a) * 14;
      const py = cy + Math.sin(a) * 14;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * @param {{ name: string, captainName?: string, profilePictureUrl?: string, captain?: object }} team
 */
export async function generateWelcomePost(team) {
  const teamName = (team.name || "TEAM").trim().toUpperCase();
  const captainName = (team.captainName || team.captain?.name || "—").trim().toUpperCase();
  const displayName = (team.name || teamName).trim();
  const photoUrl = team.profilePictureUrl || team.captain?.profilePictureUrl || "";

  const [bg, logo, profile] = await Promise.all([
    loadImage("/cricket_stadium.png").catch(() =>
      loadImage("/cricket_stadium_desktop.png").catch(() => null)
    ),
    loadImage("/al_umer_electronics_logo_v2.png").catch(() =>
      loadImage("/al_umer_electronics_logo.png").catch(() => null)
    ),
    loadProfileImage(photoUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // —— Background ——
  if (bg) {
    const scale = Math.max(W / bg.width, H / bg.height) * 1.1;
    const dw = bg.width * scale;
    const dh = bg.height * scale;
    ctx.drawImage(bg, (W - dw) / 2, H - dh + 20, dw, dh);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a1a2e");
    g.addColorStop(1, "#051510");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const grade = ctx.createLinearGradient(0, 0, 0, H);
  grade.addColorStop(0, "rgba(0,0,0,0.55)");
  grade.addColorStop(0.3, "rgba(0,0,0,0.35)");
  grade.addColorStop(0.55, "rgba(0,20,12,0.3)");
  grade.addColorStop(0.8, "rgba(0,0,0,0.4)");
  grade.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = grade;
  ctx.fillRect(0, 0, W, H);

  drawConfetti(ctx);
  drawFirework(ctx, 100, 90, 65);
  drawFirework(ctx, W - 100, 85, 60);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // —— Logo ——
  let y = 48;
  if (logo) {
    drawLogoCircle(ctx, logo, W / 2, y + 42, 88);
    y += 140; // more space below logo
  }

  // —— AL UMER ELECTRONICS (same 3D gold as SPORTS GALA, 60px) ——
  const brand = "AL UMER ELECTRONICS";
  drawGold3DText(ctx, brand, W / 2, y, 60, W - SAFE * 2);

  // —— SPORTS GALA (3D gold) ——
  y += 72;
  drawGold3DText(ctx, "SPORTS GALA", W / 2, y, 64, W - 80);

  // —— SEASON 3 with gold lines ——
  y += 48;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 200, y);
  ctx.lineTo(W / 2 - 70, y);
  ctx.moveTo(W / 2 + 70, y);
  ctx.lineTo(W / 2 + 200, y);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.fillText("SEASON 3", W / 2, y);

  // —— Photo ——
  y += 40;
  const photoSize = 400;
  const photoCy = y + photoSize / 2;

  drawGreenShield(ctx, 100, photoCy, 0.92, false);
  drawGreenShield(ctx, W - 100, photoCy, 0.92, true);
  drawPhoto(ctx, profile, W / 2, photoCy, photoSize, teamName.charAt(0) || "T");

  // Bats + balls — extra space below photo ring
  const baseY = photoCy + photoSize / 2;
  drawBall(ctx, 220, baseY + 36, 24);
  drawBall(ctx, W - 220, baseY + 36, 24);
  drawBat(ctx, 175, baseY + 62, 0.55, -1.15);
  drawBat(ctx, W - 175, baseY + 62, 0.55, 1.15);

  // —— Dark green info card ——
  const cardX = SAFE + 16;
  const cardW = W - SAFE * 2 - 32;
  const pad = 28;
  ctx.font = "17px Arial, sans-serif";
  const msg = `We are delighted to welcome ${displayName} to AL Umer Electronics Sports Gala – Season 3. Wishing great success & sportsmanship!`;
  const msgLines = wrapText(ctx, msg, cardW - pad * 2).slice(0, 3);

  const cardH =
    36 + 56 + 58 + 52 + 34 + msgLines.length * 24 + 28 + 38 + 38 + 142 + 28;
  const cardTop = baseY + 88;
  const cardY = Math.min(cardTop, H - SAFE - 56 - cardH);

  // Card with double gold border + corner accents
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 22;
  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.fillStyle = "rgba(6,46,34,0.94)";
  ctx.fill();
  ctx.restore();

  roundRect(ctx, cardX, cardY, cardW, cardH, 16);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  roundRect(ctx, cardX + 6, cardY + 6, cardW - 12, cardH - 12, 12);
  ctx.strokeStyle = "rgba(255,233,160,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Corner diamonds
  for (const [cx, cy] of [
    [cardX + 18, cardY + 18],
    [cardX + cardW - 18, cardY + 18],
    [cardX + 18, cardY + cardH - 18],
    [cardX + cardW - 18, cardY + cardH - 18],
  ]) {
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx + 5, cy);
    ctx.lineTo(cx, cy + 5);
    ctx.lineTo(cx - 5, cy);
    ctx.closePath();
    ctx.fill();
  }

  let cy = cardY + 36;
  ctx.fillStyle = goldFill(ctx, W / 2 - 160, cy - 24, W / 2 + 160, cy + 24);
  ctx.font = "900 42px Arial Black, Arial, sans-serif";
  ctx.fillText("★  WELCOME  ★", W / 2, cy);

  cy += 56;
  const nSize = fitText(ctx, teamName, cardW - pad * 2, 46, 22);
  ctx.font = `900 ${nSize}px Arial Black, Impact, Arial, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(teamName, W / 2, cy);

  cy += 58;
  const pillW = 340;
  const pillH = 30;
  roundRect(ctx, (W - pillW) / 2, cy - pillH / 2, pillW, pillH, 15);
  ctx.fillStyle = GREEN;
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px Arial, sans-serif";
  ctx.fillText("OFFICIALLY REGISTERED TEAM", W / 2, cy);

  cy += 52;
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.fillText(`CAPTAIN: ${captainName}`, W / 2, cy);

  cy += 34;
  ctx.font = "17px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textBaseline = "top";
  msgLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, cy + i * 24);
  });
  ctx.textBaseline = "middle";
  cy += msgLines.length * 24 + 28;

  ctx.fillStyle = GOLD;
  ctx.font = "italic 700 28px Georgia, 'Times New Roman', serif";
  ctx.fillText("★  Best of luck!  ★", W / 2, cy);

  cy += 38;
  drawCalendarIcon(ctx, W / 2 - 110, cy, 20);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillText("7TH AUGUST 2026", W / 2 + 12, cy);

  // Values row — extra space above icons
  cy += 72;
  const values = [
    { type: "unity", title: "UNITY", sub: "ON THE FIELD" },
    { type: "respect", title: "RESPECT", sub: "EVERYONE" },
    { type: "passion", title: "PASSION", sub: "IN OUR HEARTS" },
  ];
  const gap = cardW / 3;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  values.forEach((v, i) => {
    const vx = cardX + gap * i + gap / 2;
    drawValueIcon(ctx, vx, cy, v.type, 58);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.font = "900 16px Arial Black, Arial, sans-serif";
    ctx.fillText(v.title, vx, cy + 44);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillText(v.sub, vx, cy + 62);
  });

  // —— Footer trapezoid plaque ——
  const fy = H - SAFE - 48;
  const fw = 520;
  const fh = 42;
  ctx.beginPath();
  ctx.moveTo((W - fw) / 2 + 20, fy);
  ctx.lineTo((W + fw) / 2 - 20, fy);
  ctx.lineTo((W + fw) / 2, fy + fh);
  ctx.lineTo((W - fw) / 2, fy + fh);
  ctx.closePath();
  ctx.fillStyle = goldFill(ctx, (W - fw) / 2, fy, (W + fw) / 2, fy + fh);
  ctx.fill();
  ctx.fillStyle = "#1a1200";
  ctx.font = "bold 28px Arial Black, Arial, sans-serif";
  ctx.fillText("AL UMER ELECTRONICS", W / 2, fy + fh / 2);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create image"))),
      "image/png",
      0.95
    );
  });

  const safeName = teamName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "team";
  const filename = `welcome-${safeName}.png`;
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
